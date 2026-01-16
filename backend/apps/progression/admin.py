from django.contrib import admin
from .models import Achievement, PlayerAchievement, PlayerStats


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'achievement_type', 'target_value',
        'reward_money', 'reward_experience', 'is_hidden', 'order'
    ]
    list_filter = ['achievement_type', 'is_hidden']
    search_fields = ['name', 'description']
    ordering = ['order', 'name']


@admin.register(PlayerAchievement)
class PlayerAchievementAdmin(admin.ModelAdmin):
    list_display = ['player', 'achievement', 'unlocked_at']
    list_filter = ['achievement', 'unlocked_at']
    search_fields = ['player__username', 'achievement__name']
    date_hierarchy = 'unlocked_at'


@admin.register(PlayerStats)
class PlayerStatsAdmin(admin.ModelAdmin):
    list_display = [
        'player', 'total_casts', 'successful_catches',
        'catch_rate', 'legendary_caught'
    ]
    search_fields = ['player__username']
