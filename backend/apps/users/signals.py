"""
Сигналы для приложения users.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User, PlayerProfile


@receiver(post_save, sender=User)
def create_player_profile(sender, instance, created, **kwargs):
    """Автоматически создаёт PlayerProfile при создании User."""
    if created:
        PlayerProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_player_profile(sender, instance, **kwargs):
    """Сохраняет профиль при сохранении пользователя."""
    if hasattr(instance, 'profile'):
        instance.profile.save()
