"""
API эндпоинты прогрессии.
"""
from typing import List, Optional
from ninja import Router, Schema
from ninja_jwt.authentication import JWTAuth

from .services import ProgressionService

router = Router()


class AchievementSchema(Schema):
    """Схема достижения."""
    id: int
    name: str
    description: str
    icon: Optional[str]
    unlocked: bool
    progress: int
    target: int
    reward_money: int
    reward_experience: int


class StatsSchema(Schema):
    """Схема статистики."""
    total_casts: int
    successful_catches: int
    fish_escaped: int
    line_breaks: int
    catch_rate: float
    common_caught: int
    uncommon_caught: int
    rare_caught: int
    epic_caught: int
    legendary_caught: int
    longest_fight_seconds: int
    fastest_catch_seconds: int
    total_play_time_seconds: int


@router.get('/achievements', response=List[AchievementSchema], auth=JWTAuth())
def list_achievements(request):
    """Получить список достижений с прогрессом."""
    service = ProgressionService(request.auth)
    return service.get_achievements()


@router.get('/stats', response=StatsSchema, auth=JWTAuth())
def get_stats(request):
    """Получить статистику игрока."""
    service = ProgressionService(request.auth)
    stats = service.get_stats()
    return {
        'total_casts': stats.total_casts,
        'successful_catches': stats.successful_catches,
        'fish_escaped': stats.fish_escaped,
        'line_breaks': stats.line_breaks,
        'catch_rate': stats.catch_rate,
        'common_caught': stats.common_caught,
        'uncommon_caught': stats.uncommon_caught,
        'rare_caught': stats.rare_caught,
        'epic_caught': stats.epic_caught,
        'legendary_caught': stats.legendary_caught,
        'longest_fight_seconds': stats.longest_fight_seconds,
        'fastest_catch_seconds': stats.fastest_catch_seconds,
        'total_play_time_seconds': stats.total_play_time_seconds,
    }
