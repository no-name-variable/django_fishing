from django.contrib import admin
from .models import GameSession


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = [
        'player', 'location', 'state', 'hooked_fish',
        'fish_stamina', 'line_tension', 'updated_at'
    ]
    list_filter = ['state', 'location']
    search_fields = ['player__username']
    readonly_fields = ['created_at', 'updated_at', 'fight_start_time']
