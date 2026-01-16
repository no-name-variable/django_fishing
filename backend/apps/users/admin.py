from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PlayerProfile


class PlayerProfileInline(admin.StackedInline):
    model = PlayerProfile
    can_delete = False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [PlayerProfileInline]
    list_display = ['username', 'email', 'get_level', 'is_active']

    @admin.display(description='Уровень')
    def get_level(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.level
        return '-'


@admin.register(PlayerProfile)
class PlayerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'level', 'experience', 'money', 'total_fish_caught']
    list_filter = ['level']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at']
