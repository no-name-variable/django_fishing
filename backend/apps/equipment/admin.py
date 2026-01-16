from django.contrib import admin
from .models import Rod, Reel, Line, Bait


@admin.register(Rod)
class RodAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'tier', 'power', 'sensitivity',
        'max_line_weight', 'price', 'required_level'
    ]
    list_filter = ['tier', 'required_level']
    search_fields = ['name', 'description']


@admin.register(Reel)
class ReelAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'tier', 'gear_ratio', 'drag_power',
        'line_capacity', 'price', 'required_level'
    ]
    list_filter = ['tier', 'required_level']
    search_fields = ['name', 'description']


@admin.register(Line)
class LineAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'tier', 'breaking_strength', 'visibility',
        'length', 'price', 'required_level'
    ]
    list_filter = ['tier', 'required_level']
    search_fields = ['name', 'description']


@admin.register(Bait)
class BaitAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'bait_type', 'uses', 'attraction_bonus',
        'price', 'required_level', 'is_consumable'
    ]
    list_filter = ['bait_type', 'is_consumable', 'required_level']
    search_fields = ['name', 'description']
