from django.contrib import admin
from .models import InventoryItem, PlayerEquipment


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ['player', 'content_type', 'object_id', 'quantity', 'durability', 'acquired_at']
    list_filter = ['content_type', 'acquired_at']
    search_fields = ['player__username']
    readonly_fields = ['acquired_at']


@admin.register(PlayerEquipment)
class PlayerEquipmentAdmin(admin.ModelAdmin):
    list_display = ['player', 'rod', 'reel', 'line', 'bait']
    search_fields = ['player__username']
