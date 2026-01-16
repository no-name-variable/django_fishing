"""
Use Case: Завершение поимки рыбы.
"""
from dataclasses import dataclass
from typing import List
from core.use_cases import UseCase, UseCaseResult
from apps.users.models import User
from apps.game.services.game_session import GameSessionService
from apps.game.services.fight_engine import FightResult


@dataclass
class CatchFishInput:
    """Входные данные для завершения поимки."""
    user: User
    fight_result: FightResult


@dataclass
class CatchFishOutput:
    """Результат поимки."""
    success: bool
    fish_name: str = ''
    weight: float = 0
    price: int = 0
    experience: int = 0
    leveled_up: bool = False
    new_level: int = 0
    achievements: List[str] = None
    failure_reason: str = ''

    def __post_init__(self):
        if self.achievements is None:
            self.achievements = []


class CatchFishUseCase(UseCase[CatchFishInput, CatchFishOutput]):
    """
    Use Case: Завершение поимки рыбы.

    Обрабатывает результат вываживания:
    - При успехе: записывает улов, выдаёт награды, проверяет достижения
    - При неудаче: записывает статистику (обрыв/сход)
    """

    def execute(self, input_data: CatchFishInput) -> UseCaseResult[CatchFishOutput]:
        service = GameSessionService(input_data.user)

        result = service.complete_catch(input_data.fight_result)

        if result.get('success'):
            return UseCaseResult.ok(CatchFishOutput(
                success=True,
                fish_name=result.get('fish_name', ''),
                weight=result.get('weight', 0),
                price=result.get('price', 0),
                experience=result.get('experience', 0),
                leveled_up=result.get('leveled_up', False),
                new_level=result.get('new_level', 0),
                achievements=result.get('achievements', [])
            ))
        else:
            return UseCaseResult.ok(CatchFishOutput(
                success=False,
                failure_reason=result.get('reason', 'unknown')
            ))
