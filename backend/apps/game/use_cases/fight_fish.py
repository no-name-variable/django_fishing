"""
Use Case: Вываживание рыбы.
"""
from dataclasses import dataclass
from typing import Optional
from core.use_cases import UseCase, UseCaseResult
from apps.users.models import User
from apps.game.services.game_session import GameSessionService
from apps.game.services.fight_engine import FightState, FightResult, PlayerAction


@dataclass
class FightFishInput:
    """Входные данные для действия при вываживании."""
    user: User
    action: str  # reel, release, hold, drag
    value: float = 0  # Параметр действия (скорость, уровень)


@dataclass
class FightFishOutput:
    """Результат действия при вываживании."""
    state: FightState
    finished: bool = False
    result: Optional[dict] = None


class FightFishUseCase(UseCase[FightFishInput, FightFishOutput]):
    """
    Use Case: Обработка действия при вываживании.

    Принимает действие игрока, обновляет состояние боя,
    проверяет условия завершения.
    """

    def execute(self, input_data: FightFishInput) -> UseCaseResult[FightFishOutput]:
        service = GameSessionService(input_data.user)

        engine = service.get_fight_engine()
        if not engine:
            return UseCaseResult.fail('Нет активного вываживания')

        # Преобразуем строку в enum
        try:
            action = PlayerAction(input_data.action)
        except ValueError:
            return UseCaseResult.fail(f'Неизвестное действие: {input_data.action}')

        # Обрабатываем действие
        state = engine.process_action(action, input_data.value)

        # Обновляем состояние (тик игры)
        state, fight_result = engine.update(delta_time=0.1)

        # Проверяем завершение
        if fight_result:
            result = service.complete_catch(fight_result)
            return UseCaseResult.ok(FightFishOutput(
                state=state,
                finished=True,
                result=result
            ))

        return UseCaseResult.ok(FightFishOutput(
            state=state,
            finished=False
        ))


@dataclass
class StartFightInput:
    """Входные данные для подсечки."""
    user: User


@dataclass
class StartFightOutput:
    """Результат подсечки."""
    success: bool
    fish_name: str = ''
    weight: float = 0


class StartFightUseCase(UseCase[StartFightInput, StartFightOutput]):
    """
    Use Case: Подсечка - начало вываживания.

    Переводит состояние из BITE в FIGHTING.
    """

    def execute(self, input_data: StartFightInput) -> UseCaseResult[StartFightOutput]:
        service = GameSessionService(input_data.user)

        session = service.get_session()
        if not session:
            return UseCaseResult.fail('Нет активной сессии')

        if not session.hooked_fish:
            return UseCaseResult.fail('Нет рыбы на крючке')

        success = service.start_fight()
        if not success:
            return UseCaseResult.fail('Не удалось подсечь')

        return UseCaseResult.ok(StartFightOutput(
            success=True,
            fish_name=session.hooked_fish.name,
            weight=session.hooked_fish_weight
        ))
