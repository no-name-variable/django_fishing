"""
Сервис управления игровой сессией.
Координирует все игровые операции.
"""
from typing import Optional
from dataclasses import dataclass
from django.db import transaction
from django.utils import timezone

from apps.users.models import User
from apps.fishing.models import Fish, Location
from apps.fishing.services.bite_calculator import BiteCalculator, BiteResult
from apps.fishing.services.fishing_service import FishingService
from apps.inventory.models import PlayerEquipment
from apps.inventory.services import InventoryService
from apps.progression.services import ProgressionService
from apps.game.models import GameSession, GameState, FishState
from apps.game.services.fight_engine import FightEngine, FightState, FightResult, PlayerAction
from core.exceptions import InvalidGameStateError, EquipmentNotFoundError


@dataclass
class CastResult:
    """Результат заброса."""
    success: bool
    distance: float = 0
    depth: float = 0
    error: str = ''


@dataclass
class SessionState:
    """Полное состояние сессии для клиента."""
    state: GameState
    location_id: int
    cast_distance: float
    cast_depth: float
    fight: Optional[FightState] = None


class GameSessionService:
    """
    Сервис управления игровой сессией.

    Отвечает за:
    - Создание/удаление сессий
    - Заброс удочки
    - Обработку поклёвки
    - Координацию вываживания
    - Завершение и награды
    """

    def __init__(self, user: User):
        self.user = user
        self.inventory_service = InventoryService(user)
        self.fishing_service = FishingService(user)
        self.progression_service = ProgressionService(user)

    def get_or_create_session(self, location_id: int) -> GameSession:
        """Получить или создать игровую сессию."""
        # Проверяем доступ к локации
        location = Location.objects.get(pk=location_id)
        if not self.fishing_service.can_access_location(location):
            raise InvalidGameStateError('Локация недоступна для вашего уровня')

        # Проверяем экипировку
        equipment = self.inventory_service.get_equipment()
        if not equipment or not equipment.is_complete():
            raise EquipmentNotFoundError('Экипируйте все снасти перед рыбалкой')

        # Создаём или обновляем сессию
        session, created = GameSession.objects.update_or_create(
            player=self.user,
            defaults={
                'location': location,
                'state': GameState.IDLE,
            }
        )
        return session

    def close_session(self) -> None:
        """Закрыть игровую сессию."""
        GameSession.objects.filter(player=self.user).delete()

    def get_session(self) -> Optional[GameSession]:
        """Получить текущую сессию."""
        try:
            return GameSession.objects.get(player=self.user)
        except GameSession.DoesNotExist:
            return None

    @transaction.atomic
    def cast_line(self, power: float, angle: float) -> CastResult:
        """
        Выполнить заброс.

        Args:
            power: Сила заброса (0-1)
            angle: Угол заброса (градусы)

        Returns:
            CastResult с параметрами заброса
        """
        session = self.get_session()
        if not session:
            return CastResult(success=False, error='Нет активной сессии')

        if session.state != GameState.IDLE:
            return CastResult(success=False, error='Нельзя забрасывать в текущем состоянии')

        # Получаем снаряжение
        equipment = self.inventory_service.get_equipment()
        rod = equipment.get_rod()

        # Расходуем наживку
        if not self.inventory_service.consume_bait():
            return CastResult(success=False, error='Закончилась наживка')

        # Записываем заброс в статистику
        self.progression_service.record_cast()

        # Рассчитываем дистанцию заброса
        base_distance = 20 + power * 30  # 20-50 метров
        distance_bonus = rod.cast_distance_bonus / 100
        distance = base_distance * (1 + distance_bonus)

        # Глубина зависит от угла и локации
        max_depth = session.location.max_depth
        depth = max_depth * (0.3 + angle / 90 * 0.7)  # 30%-100% от максимума

        # Обновляем сессию
        session.cast_distance = distance
        session.cast_depth = depth
        session.state = GameState.WAITING
        session.next_bite_check_time = None  # Сбрасываем время проверки
        session.save()

        return CastResult(success=True, distance=distance, depth=depth)

    def calculate_bite(self) -> Optional[BiteResult]:
        """
        Рассчитать поклёвку.
        Вызывается периодически пока состояние WAITING.
        """
        session = self.get_session()
        if not session or session.state != GameState.WAITING:
            return None

        equipment = self.inventory_service.get_equipment()
        bait = equipment.get_bait()

        calculator = BiteCalculator(
            location=session.location,
            bait=bait,
            cast_distance=session.cast_distance,
            depth=session.cast_depth
        )

        return calculator.calculate_bite()

    @transaction.atomic
    def handle_bite(self, bite: BiteResult) -> bool:
        """
        Обработать поклёвку.

        Args:
            bite: Результат расчёта поклёвки

        Returns:
            True если рыба подсечена
        """
        session = self.get_session()

        if not session or session.state != GameState.WAITING:
            return False

        if not bite.will_bite or not bite.fish:
            return False

        # Генерируем вес рыбы
        weight = bite.fish.generate_weight()

        # Обновляем сессию
        from django.utils import timezone
        session.state = GameState.BITE
        session.hooked_fish = bite.fish
        session.hooked_fish_weight = weight
        session.bite_time = timezone.now()  # Запоминаем время поклевки
        session.save()

        return True

    @transaction.atomic
    def start_fight(self) -> bool:
        """
        Начать вываживание (игрок подсёк).

        Returns:
            True если вываживание началось
        """
        session = self.get_session()
        if not session or session.state != GameState.BITE:
            return False

        # Проверяем таймаут поклевки (8 секунд)
        from django.utils import timezone
        from datetime import timedelta
        BITE_TIMEOUT = 8  # секунд

        if session.bite_time:
            elapsed = (timezone.now() - session.bite_time).total_seconds()

            if elapsed > BITE_TIMEOUT:
                # Таймаут - рыба ушла
                session.state = GameState.WAITING
                session.hooked_fish = None
                session.hooked_fish_weight = 0
                session.bite_time = None
                session.next_bite_check_time = timezone.now() + timedelta(seconds=10)
                session.save()
                return False

        # Инициализируем параметры вываживания
        session.state = GameState.FIGHTING
        session.fish_state = FishState.ACTIVE
        session.fish_stamina = 100
        session.fish_distance = session.cast_distance * 0.8
        session.fish_direction = 0
        session.line_tension = 30
        session.line_health = 100
        session.drag_level = 0.5
        session.fight_start_time = timezone.now()
        session.bite_time = None  # Очищаем время поклевки
        session.save()

        return True

    def get_fight_engine(self) -> Optional[FightEngine]:
        """Получить движок вываживания для текущей сессии."""
        session = self.get_session()
        if not session or session.state != GameState.FIGHTING:
            return None

        equipment = self.inventory_service.get_equipment()
        return FightEngine(
            session=session,
            rod=equipment.get_rod(),
            reel=equipment.get_reel(),
            line=equipment.get_line()
        )

    @transaction.atomic
    def complete_catch(self, result: FightResult) -> dict:
        """
        Завершить вываживание и выдать награды.

        Args:
            result: Результат вываживания

        Returns:
            Данные о награде
        """
        session = self.get_session()
        if not session:
            return {}

        reward = {}

        if result.success:
            # Записываем улов
            catch_result = self.fishing_service.record_catch(
                fish=result.fish,
                location=session.location,
                weight=result.weight
            )

            # Обновляем статистику
            self.progression_service.record_catch_stats(
                fish=result.fish,
                fight_duration=result.fight_duration
            )

            # Проверяем достижения
            new_achievements = self.progression_service.check_achievements()

            reward = {
                'success': True,
                'fish_name': result.fish.name,
                'weight': result.weight,
                'price': catch_result.price,
                'experience': catch_result.experience,
                'leveled_up': catch_result.leveled_up,
                'new_level': catch_result.new_level,
                'achievements': [a.name for a in new_achievements],
            }
        else:
            # Записываем неудачу
            if result.reason == 'line_break':
                self.progression_service.record_line_break()
            else:
                self.progression_service.record_fish_escaped()

            reward = {
                'success': False,
                'reason': result.reason,
            }

        # Сбрасываем сессию
        session.state = GameState.IDLE
        session.hooked_fish = None
        session.hooked_fish_weight = 0
        session.fish_stamina = 100
        session.fish_distance = 0
        session.line_tension = 0
        session.line_health = 100
        session.fight_start_time = None
        session.save()

        return reward

    def get_session_state(self) -> Optional[SessionState]:
        """Получить текущее состояние сессии."""
        session = self.get_session()
        if not session:
            return None

        fight_state = None
        if session.state == GameState.FIGHTING:
            fight_state = FightState(
                fish_state=FishState(session.fish_state),
                fish_stamina=session.fish_stamina,
                fish_distance=session.fish_distance,
                fish_direction=session.fish_direction,
                line_tension=session.line_tension,
                line_health=session.line_health,
                drag_level=session.drag_level,
                is_critical=session.line_tension >= 90
            )

        return SessionState(
            state=GameState(session.state),
            location_id=session.location_id,
            cast_distance=session.cast_distance,
            cast_depth=session.cast_depth,
            fight=fight_state
        )
