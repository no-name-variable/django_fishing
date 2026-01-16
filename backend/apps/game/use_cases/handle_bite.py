"""
Use Case: Обработка поклёвки.
"""
from dataclasses import dataclass
from typing import Optional
from core.use_cases import UseCase, UseCaseResult
from apps.users.models import User
from apps.fishing.models import Fish
from apps.game.services.game_session import GameSessionService


@dataclass
class HandleBiteInput:
    """Входные данные."""
    user: User


@dataclass
class HandleBiteOutput:
    """Результат проверки поклёвки."""
    has_bite: bool
    fish_name: Optional[str] = None
    intensity: float = 0  # Интенсивность поклёвки для UI


class HandleBiteUseCase(UseCase[HandleBiteInput, HandleBiteOutput]):
    """
    Use Case: Проверка и обработка поклёвки.

    Вызывается периодически пока состояние WAITING.
    Если рыба клюнула - переводит в состояние BITE.
    """

    def execute(self, input_data: HandleBiteInput) -> UseCaseResult[HandleBiteOutput]:
        service = GameSessionService(input_data.user)

        # Рассчитываем поклёвку
        bite = service.calculate_bite()
        if not bite:
            return UseCaseResult.ok(HandleBiteOutput(has_bite=False))

        if not bite.will_bite:
            return UseCaseResult.ok(HandleBiteOutput(has_bite=False))

        # Рыба клюнула - обрабатываем
        success = service.handle_bite(bite)

        if success:
            return UseCaseResult.ok(HandleBiteOutput(
                has_bite=True,
                fish_name=bite.fish.name,
                intensity=bite.intensity
            ))

        return UseCaseResult.ok(HandleBiteOutput(has_bite=False))
