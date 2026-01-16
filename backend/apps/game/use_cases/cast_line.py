"""
Use Case: Заброс удочки.
"""
from dataclasses import dataclass
from core.use_cases import UseCase, UseCaseResult
from apps.users.models import User
from apps.game.services.game_session import GameSessionService, CastResult


@dataclass
class CastLineInput:
    """Входные данные для заброса."""
    user: User
    power: float  # 0-1
    angle: float  # градусы


@dataclass
class CastLineOutput:
    """Результат заброса."""
    distance: float
    depth: float


class CastLineUseCase(UseCase[CastLineInput, CastLineOutput]):
    """
    Use Case: Заброс удочки.

    Последовательность:
    1. Проверить состояние сессии (должно быть IDLE)
    2. Проверить наличие наживки
    3. Рассчитать дистанцию и глубину
    4. Расходовать наживку
    5. Обновить состояние на WAITING
    """

    def execute(self, input_data: CastLineInput) -> UseCaseResult[CastLineOutput]:
        service = GameSessionService(input_data.user)

        # Валидация входных данных
        power = max(0, min(1, input_data.power))
        angle = max(0, min(90, input_data.angle))

        result = service.cast_line(power, angle)

        if not result.success:
            return UseCaseResult.fail(result.error)

        return UseCaseResult.ok(CastLineOutput(
            distance=result.distance,
            depth=result.depth
        ))
