from django.contrib import admin
from .models import Location, Fish, FishBaitPreference, CatchRecord


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'max_depth', 'required_level', 'is_active']
    list_filter = ['is_active', 'required_level']
    search_fields = ['name', 'description']


class FishBaitPreferenceInline(admin.TabularInline):
    model = FishBaitPreference
    extra = 1


@admin.register(Fish)
class FishAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'rarity', 'min_weight', 'max_weight',
        'base_price', 'strength', 'stamina', 'aggressiveness'
    ]
    list_filter = ['rarity', 'locations']
    search_fields = ['name', 'description']
    filter_horizontal = ['locations']
    inlines = [FishBaitPreferenceInline]
    fieldsets = [
        (None, {
            'fields': ['name', 'description', 'image']
        }),
        ('Характеристики', {
            'fields': ['min_weight', 'max_weight', 'rarity', 'base_price']
        }),
        ('Поведение при вываживании', {
            'fields': ['strength', 'stamina', 'aggressiveness']
        }),
        ('Среда обитания', {
            'fields': ['locations', 'depth_min', 'depth_max', 'active_from', 'active_until']
        }),
    ]


@admin.register(CatchRecord)
class CatchRecordAdmin(admin.ModelAdmin):
    list_display = ['player', 'fish', 'weight', 'price', 'experience', 'caught_at']
    list_filter = ['fish__rarity', 'location', 'caught_at']
    search_fields = ['player__username', 'fish__name']
    date_hierarchy = 'caught_at'
    readonly_fields = ['caught_at']
