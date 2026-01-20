"""
Use Case: Обработка поклёвки.
"""
from dataclasses import dataclass
from typing import Optional
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from core.use_cases import UseCase, UseCaseResult
from apps.users.models import User
from apps.fishing.models import Fish
from apps.game.models import GameSession
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

    @transaction.atomic
    def execute(self, input_data: HandleBiteInput) -> UseCaseResult[HandleBiteOutput]:
        # Используем select_for_update() для предотвращения race conditions
        try:
            session = GameSession.objects.select_for_update().get(player=input_data.user)
        except GameSession.DoesNotExist:
            return UseCaseResult.ok(HandleBiteOutput(has_bite=False))

        service = GameSessionService(input_data.user)

        now = timezone.now()

        # Если это первая проверка после заброса - планируем время поклёвки
        if not session.next_bite_check_time:
            bite = service.calculate_bite()
            if not bite:
                return UseCaseResult.ok(HandleBiteOutput(has_bite=False))

            # Запоминаем время следующей проверки
            session.next_bite_check_time = now + timedelta(seconds=bite.wait_time)
            session.save()
            return UseCaseResult.ok(HandleBiteOutput(has_bite=False))

        # Проверяем, пришло ли время поклёвки
        if now < session.next_bite_check_time:
            # Еще не время
            return UseCaseResult.ok(HandleBiteOutput(has_bite=False))

        # Время пришло - рассчитываем поклёвку
        bite = service.calculate_bite()
        if not bite:
            return UseCaseResult.ok(HandleBiteOutput(has_bite=False))

        if not bite.will_bite:
            # Рыба не клюнула - планируем следующую проверку
            session.next_bite_check_time = now + timedelta(seconds=bite.wait_time)
            session.save()
            return UseCaseResult.ok(HandleBiteOutput(has_bite=False))

        # Рыба клюнула - обрабатываем
        success = service.handle_bite(bite)

        if success:
            # Очищаем время проверки
            session.next_bite_check_time = None
            session.save()

            return UseCaseResult.ok(HandleBiteOutput(
                has_bite=True,
                fish_name=bite.fish.name,
                intensity=bite.intensity
            ))

        return UseCaseResult.ok(HandleBiteOutput(has_bite=False))
