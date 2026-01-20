"""
WebSocket consumers для игровой сессии.
Обрабатывает real-time взаимодействие с клиентом.
"""
import json
import asyncio
from typing import Optional
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

from apps.game.models import GameState
from apps.game.services.game_session import GameSessionService
from apps.game.services.fight_engine import PlayerAction
from apps.game.use_cases.cast_line import CastLineUseCase, CastLineInput
from apps.game.use_cases.handle_bite import HandleBiteUseCase, HandleBiteInput
from apps.game.use_cases.fight_fish import (
    FightFishUseCase, FightFishInput,
    StartFightUseCase, StartFightInput
)

User = get_user_model()


class GameConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer для игровой сессии.

    Протокол сообщений:
    Client -> Server:
        {"type": "join", "location_id": 1}
        {"type": "cast", "power": 0.8, "angle": 45}
        {"type": "hook"}  # Подсечка
        {"type": "reel", "speed": 0.5}
        {"type": "release"}
        {"type": "set_drag", "level": 0.7}

    Server -> Client:
        {"type": "joined", "session": {...}}
        {"type": "cast_result", "distance": 25, "depth": 5}
        {"type": "waiting"}
        {"type": "bite", "intensity": 0.6}
        {"type": "fight_started", "fish": "Карп", "weight": 2.5}
        {"type": "fight_update", "state": {...}}
        {"type": "catch", "result": {...}}
        {"type": "error", "message": "..."}
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user: Optional[User] = None
        self.game_loop_task: Optional[asyncio.Task] = None
        self.is_fighting = False

    async def connect(self):
        """Подключение клиента."""
        self.user = self.scope.get('user')

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        # Закрываем старую сессию если она есть (предотвращаем множественные подключения)
        await self._close_old_sessions()

        await self.accept()
        await self.send_json({
            'type': 'connected',
            'message': 'Подключено к игровому серверу'
        })

    async def disconnect(self, close_code):
        """Отключение клиента."""
        # Останавливаем игровой цикл
        await self._cancel_game_loop()

        # Закрываем сессию
        if self.user:
            await self._close_session()

    async def _cancel_game_loop(self):
        """Отменить текущую задачу игрового цикла."""
        if self.game_loop_task:
            self.game_loop_task.cancel()
            try:
                await self.game_loop_task
            except asyncio.CancelledError:
                pass
            self.game_loop_task = None

    async def receive_json(self, content):
        """Обработка входящих сообщений."""
        msg_type = content.get('type')

        handlers = {
            'join': self._handle_join,
            'cast': self._handle_cast,
            'hook': self._handle_hook,
            'reel': self._handle_reel,
            'release': self._handle_release,
            'set_drag': self._handle_set_drag,
            'hold': self._handle_hold,
        }

        handler = handlers.get(msg_type)
        if handler:
            await handler(content)
        else:
            await self.send_json({
                'type': 'error',
                'message': f'Неизвестный тип сообщения: {msg_type}'
            })

    async def _handle_join(self, data):
        """Присоединиться к локации."""
        location_id = data.get('location_id')
        if not location_id:
            await self.send_json({
                'type': 'error',
                'message': 'Не указана локация'
            })
            return

        try:
            session = await self._create_session(location_id)
            location_name = await self._get_location_name(location_id)
            await self.send_json({
                'type': 'joined',
                'session': {
                    'location_id': session.location_id,
                    'location_name': location_name,
                    'state': session.state,
                }
            })
        except Exception as e:
            await self.send_json({
                'type': 'error',
                'message': str(e)
            })

    async def _handle_cast(self, data):
        """Заброс удочки."""
        power = data.get('power', 0.5)
        angle = data.get('angle', 45)

        use_case = CastLineUseCase()
        result = await database_sync_to_async(use_case.execute)(
            CastLineInput(user=self.user, power=power, angle=angle)
        )

        if result.success:
            await self.send_json({
                'type': 'cast_result',
                'distance': result.data.distance,
                'depth': result.data.depth
            })
            # Запускаем цикл ожидания поклёвки
            await self._cancel_game_loop()
            self.game_loop_task = asyncio.create_task(self._bite_loop())
        else:
            await self.send_json({
                'type': 'error',
                'message': result.error
            })

    async def _handle_hook(self, data):
        """Подсечка."""
        use_case = StartFightUseCase()
        result = await database_sync_to_async(use_case.execute)(
            StartFightInput(user=self.user)
        )

        if result.success:
            self.is_fighting = True
            await self.send_json({
                'type': 'fight_started',
                'fish': result.data.fish_name,
                'weight': result.data.weight
            })
            # Запускаем цикл вываживания
            await self._cancel_game_loop()
            self.game_loop_task = asyncio.create_task(self._fight_loop())
        else:
            await self.send_json({
                'type': 'error',
                'message': result.error
            })

    async def _handle_reel(self, data):
        """Подмотка."""
        speed = data.get('speed', 0.5)
        await self._process_fight_action('reel', speed)

    async def _handle_release(self, data):
        """Отпустить леску."""
        await self._process_fight_action('release', 0)

    async def _handle_set_drag(self, data):
        """Установить фрикцион."""
        level = data.get('level', 0.5)
        await self._process_fight_action('drag', level)

    async def _handle_hold(self, data):
        """Удержание."""
        await self._process_fight_action('hold', 0)

    async def _process_fight_action(self, action: str, value: float):
        """Обработать действие при вываживании."""
        if not self.is_fighting:
            return

        use_case = FightFishUseCase()
        result = await database_sync_to_async(use_case.execute)(
            FightFishInput(user=self.user, action=action, value=value)
        )

        if not result.success:
            # Игнорируем ошибку "Нет активного вываживания" - бой уже закончен
            if 'Нет активного вываживания' in result.error:
                return

            await self.send_json({
                'type': 'error',
                'message': result.error
            })
            return

        # ВАЖНО: Проверяем завершение боя в результате действия
        if result.data.finished and result.data.result:
            self.is_fighting = False

            # Отправляем результат клиенту
            await self.send_json({
                'type': 'catch',
                'result': result.data.result
            })

            # Останавливаем цикл вываживания
            if self.game_loop_task:
                self.game_loop_task.cancel()

    async def _bite_loop(self):
        """Цикл ожидания поклёвки."""
        try:
            use_case = HandleBiteUseCase()

            while True:
                await asyncio.sleep(1)  # Проверка каждую секунду

                result = await database_sync_to_async(use_case.execute)(
                    HandleBiteInput(user=self.user)
                )

                if result.success and result.data.has_bite:
                    await self.send_json({
                        'type': 'bite',
                        'fish': result.data.fish_name,
                        'intensity': result.data.intensity
                    })
                    # Запускаем таймер таймаута поклевки
                    await self._cancel_game_loop()
                    self.game_loop_task = asyncio.create_task(self._bite_timeout_check())
                    return  # Выходим из цикла, ждём подсечку

        except asyncio.CancelledError:
            pass

    async def _bite_timeout_check(self):
        """Проверка таймаута поклевки (работает после отправки bite сообщения)."""
        try:
            await asyncio.sleep(8)  # Ждем 8 секунд

            # Проверяем не подсек ли игрок за это время
            timeout_result = await self._check_bite_timeout()
            if timeout_result:
                # Рыба ушла - уведомляем клиента
                await self.send_json({
                    'type': 'bite_timeout',
                    'message': 'Рыба ушла! Слишком долго тянули с подсечкой'
                })
                # Перезапускаем цикл ожидания поклевки
                await self._cancel_game_loop()
                self.game_loop_task = asyncio.create_task(self._bite_loop())

        except asyncio.CancelledError:
            pass

    async def _fight_loop(self):
        """Цикл вываживания - отправка обновлений состояния."""
        try:
            while self.is_fighting:
                await asyncio.sleep(0.1)  # 10 обновлений в секунду

                try:
                    # СНАЧАЛА проверяем завершение (перед получением state)
                    result = await self._check_fight_result()
                    if result:
                        self.is_fighting = False
                        await self.send_json({
                            'type': 'catch',
                            'result': result
                        })
                        break

                    # Получаем текущее состояние
                    state = await self._get_fight_state()
                    if not state:
                        self.is_fighting = False
                        break

                    # Отправляем обновление клиенту
                    await self.send_json({
                        'type': 'fight_update',
                        'state': {
                            'fish_state': state.fish_state.value,
                            'fish_stamina': state.fish_stamina,
                            'fish_distance': state.fish_distance,
                            'fish_direction': state.fish_direction,
                            'line_tension': state.line_tension,
                            'line_health': state.line_health,
                            'drag_level': state.drag_level,
                            'is_critical': state.is_critical,
                        }
                    })

                except Exception as e:
                    print(f'Ошибка в fight_loop: {e}')
                    import traceback
                    traceback.print_exc()
                    await self.send_json({
                        'type': 'error',
                        'message': f'Ошибка вываживания: {str(e)}'
                    })
                    self.is_fighting = False
                    break

        except asyncio.CancelledError:
            pass

    @database_sync_to_async
    def _create_session(self, location_id: int):
        """Создать игровую сессию."""
        service = GameSessionService(self.user)
        return service.get_or_create_session(location_id)

    @database_sync_to_async
    def _get_location_name(self, location_id: int) -> str:
        """Получить название локации."""
        from apps.fishing.models import Location
        try:
            location = Location.objects.get(id=location_id)
            return location.name
        except Location.DoesNotExist:
            return 'Неизвестная локация'

    @database_sync_to_async
    def _close_old_sessions(self):
        """Закрыть старые сессии пользователя."""
        from apps.game.models import GameSession
        # Удаляем старую сессию (будет создана новая при join)
        GameSession.objects.filter(player=self.user).delete()

    @database_sync_to_async
    def _close_session(self):
        """Закрыть игровую сессию."""
        service = GameSessionService(self.user)
        service.close_session()

    @database_sync_to_async
    def _get_fight_state(self):
        """Получить состояние вываживания."""
        service = GameSessionService(self.user)
        session_state = service.get_session_state()
        return session_state.fight if session_state else None

    @database_sync_to_async
    def _check_bite_timeout(self):
        """Проверить таймаут поклевки."""
        from datetime import timedelta
        from django.utils import timezone

        service = GameSessionService(self.user)
        session = service.get_session()

        if not session or session.state != GameState.BITE:
            return False

        if not session.bite_time:
            return False

        BITE_TIMEOUT = 8  # секунд
        elapsed = (timezone.now() - session.bite_time).total_seconds()

        if elapsed > BITE_TIMEOUT:
            # Сбрасываем состояние
            session.state = GameState.WAITING
            session.hooked_fish = None
            session.hooked_fish_weight = 0
            session.bite_time = None
            session.next_bite_check_time = timezone.now() + timedelta(seconds=10)
            session.save()
            return True

        return False

    @database_sync_to_async
    def _check_fight_result(self):
        """Проверить результат вываживания."""
        try:
            service = GameSessionService(self.user)
            engine = service.get_fight_engine()
            if not engine:
                return None

            state, result = engine.update(0.1)

            if result:
                catch_result = service.complete_catch(result)
                if not catch_result:
                    return None
                return catch_result
            return None
        except Exception as e:
            print(f'[ERROR] _check_fight_result: {e}')
            import traceback
            traceback.print_exc()
            return None
