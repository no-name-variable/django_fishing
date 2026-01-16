"""
Сервисы системы прогрессии.
"""
from typing import List
from django.db import transaction

from apps.users.models import User
from apps.fishing.models import Fish, CatchRecord, Rarity
from .models import Achievement, PlayerAchievement, PlayerStats, AchievementType


class ProgressionService:
    """Сервис для работы с прогрессией игрока."""

    def __init__(self, user: User):
        self.user = user
        self.profile = user.profile

    def get_stats(self) -> PlayerStats:
        """Получить или создать статистику игрока."""
        stats, _ = PlayerStats.objects.get_or_create(player=self.user)
        return stats

    def get_achievements(self) -> List[dict]:
        """
        Получить список всех достижений с прогрессом.

        Returns:
            Список достижений с информацией о статусе и прогрессе.
        """
        all_achievements = Achievement.objects.all()
        unlocked_ids = set(
            PlayerAchievement.objects.filter(player=self.user)
            .values_list('achievement_id', flat=True)
        )

        result = []
        for ach in all_achievements:
            # Скрытые достижения не показываем, пока не получены
            if ach.is_hidden and ach.id not in unlocked_ids:
                continue

            progress = self._calculate_progress(ach)
            result.append({
                'id': ach.id,
                'name': ach.name,
                'description': ach.description,
                'icon': ach.icon.url if ach.icon else None,
                'unlocked': ach.id in unlocked_ids,
                'progress': progress,
                'target': ach.target_value,
                'reward_money': ach.reward_money,
                'reward_experience': ach.reward_experience,
            })

        return result

    def _calculate_progress(self, achievement: Achievement) -> int:
        """Рассчитать текущий прогресс по достижению."""
        stats = self.get_stats()

        if achievement.achievement_type == AchievementType.CATCH_COUNT:
            return stats.successful_catches

        elif achievement.achievement_type == AchievementType.CATCH_WEIGHT:
            return int(self.profile.total_weight_caught)

        elif achievement.achievement_type == AchievementType.LEVEL_REACH:
            return self.profile.level

        elif achievement.achievement_type == AchievementType.MONEY_EARN:
            return self.profile.money

        elif achievement.achievement_type == AchievementType.CATCH_RARITY:
            rarity_map = {
                Rarity.COMMON: stats.common_caught,
                Rarity.UNCOMMON: stats.uncommon_caught,
                Rarity.RARE: stats.rare_caught,
                Rarity.EPIC: stats.epic_caught,
                Rarity.LEGENDARY: stats.legendary_caught,
            }
            return rarity_map.get(achievement.target_rarity, 0)

        elif achievement.achievement_type == AchievementType.CATCH_SPECIES:
            if achievement.target_fish:
                return CatchRecord.objects.filter(
                    player=self.user,
                    fish=achievement.target_fish
                ).count()
            return 0

        return 0

    @transaction.atomic
    def check_achievements(self) -> List[Achievement]:
        """
        Проверить и выдать новые достижения.

        Returns:
            Список только что полученных достижений.
        """
        unlocked_ids = set(
            PlayerAchievement.objects.filter(player=self.user)
            .values_list('achievement_id', flat=True)
        )

        new_achievements = []
        all_achievements = Achievement.objects.exclude(id__in=unlocked_ids)

        for ach in all_achievements:
            progress = self._calculate_progress(ach)
            if progress >= ach.target_value:
                # Достижение получено!
                PlayerAchievement.objects.create(
                    player=self.user,
                    achievement=ach
                )
                # Выдаём награды
                self.profile.money += ach.reward_money
                self.profile.add_experience(ach.reward_experience)
                new_achievements.append(ach)

        return new_achievements

    @transaction.atomic
    def record_catch_stats(self, fish: Fish, fight_duration: int) -> None:
        """
        Обновить статистику после поимки рыбы.

        Args:
            fish: Пойманная рыба
            fight_duration: Длительность вываживания в секундах
        """
        stats = self.get_stats()
        stats.successful_catches += 1

        # Обновляем по редкости
        rarity_field_map = {
            Rarity.COMMON: 'common_caught',
            Rarity.UNCOMMON: 'uncommon_caught',
            Rarity.RARE: 'rare_caught',
            Rarity.EPIC: 'epic_caught',
            Rarity.LEGENDARY: 'legendary_caught',
        }
        field = rarity_field_map.get(fish.rarity)
        if field:
            setattr(stats, field, getattr(stats, field) + 1)

        # Обновляем рекорды
        if fight_duration > stats.longest_fight_seconds:
            stats.longest_fight_seconds = fight_duration
        if stats.fastest_catch_seconds == 0 or fight_duration < stats.fastest_catch_seconds:
            stats.fastest_catch_seconds = fight_duration

        stats.save()

    def record_cast(self) -> None:
        """Записать заброс."""
        stats = self.get_stats()
        stats.total_casts += 1
        stats.save()

    def record_fish_escaped(self) -> None:
        """Записать сход рыбы."""
        stats = self.get_stats()
        stats.fish_escaped += 1
        stats.save()

    def record_line_break(self) -> None:
        """Записать обрыв лески."""
        stats = self.get_stats()
        stats.line_breaks += 1
        stats.save()
