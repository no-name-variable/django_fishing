"""
User and Player Profile models.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Custom user model."""
    email = models.EmailField(unique=True)

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'


class PlayerProfile(models.Model):
    """Player profile with game statistics."""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    level = models.PositiveIntegerField(default=1)
    experience = models.PositiveIntegerField(default=0)
    money = models.PositiveIntegerField(default=1000)
    total_fish_caught = models.PositiveIntegerField(default=0)
    biggest_fish_weight = models.FloatField(default=0)
    total_weight_caught = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Профиль игрока'
        verbose_name_plural = 'Профили игроков'

    def __str__(self):
        return f'{self.user.username} (Ур. {self.level})'

    @property
    def experience_for_next_level(self) -> int:
        """Calculate experience needed for next level."""
        return int(100 * (self.level ** 1.5))

    def add_experience(self, amount: int) -> bool:
        """Add experience and check for level up. Returns True if leveled up."""
        self.experience += amount
        leveled_up = False
        while self.experience >= self.experience_for_next_level:
            self.experience -= self.experience_for_next_level
            self.level += 1
            leveled_up = True
        self.save()
        return leveled_up
