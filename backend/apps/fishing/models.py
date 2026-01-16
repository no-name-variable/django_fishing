"""
Fishing models: Fish, Location, Weather conditions.
"""
from django.db import models


class Rarity(models.TextChoices):
    COMMON = 'common', 'Обычная'
    UNCOMMON = 'uncommon', 'Необычная'
    RARE = 'rare', 'Редкая'
    EPIC = 'epic', 'Эпическая'
    LEGENDARY = 'legendary', 'Легендарная'


class Location(models.Model):
    """Fishing location."""
    name = models.CharField(max_length=100, verbose_name='Название')
    description = models.TextField(verbose_name='Описание')
    image = models.ImageField(
        upload_to='locations/',
        null=True,
        blank=True,
        verbose_name='Изображение'
    )
    max_depth = models.FloatField(verbose_name='Максимальная глубина (м)')
    required_level = models.PositiveIntegerField(
        default=1,
        verbose_name='Требуемый уровень'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активна')

    class Meta:
        verbose_name = 'Локация'
        verbose_name_plural = 'Локации'
        ordering = ['required_level', 'name']

    def __str__(self):
        return self.name


class Fish(models.Model):
    """Fish species."""
    name = models.CharField(max_length=100, verbose_name='Название')
    description = models.TextField(verbose_name='Описание')
    image = models.ImageField(
        upload_to='fish/',
        null=True,
        blank=True,
        verbose_name='Изображение'
    )

    # Weight characteristics
    min_weight = models.FloatField(verbose_name='Минимальный вес (кг)')
    max_weight = models.FloatField(verbose_name='Максимальный вес (кг)')

    # Rarity and price
    rarity = models.CharField(
        max_length=20,
        choices=Rarity.choices,
        default=Rarity.COMMON,
        verbose_name='Редкость'
    )
    base_price = models.PositiveIntegerField(
        verbose_name='Базовая цена за кг'
    )

    # Fight characteristics
    strength = models.PositiveIntegerField(
        verbose_name='Сила (1-100)',
        help_text='Сила сопротивления при вываживании'
    )
    stamina = models.PositiveIntegerField(
        verbose_name='Выносливость (1-100)',
        help_text='Как долго рыба может сопротивляться'
    )
    aggressiveness = models.PositiveIntegerField(
        verbose_name='Агрессивность (1-100)',
        help_text='Частота и сила рывков'
    )

    # Habitat
    locations = models.ManyToManyField(
        Location,
        related_name='fish_species',
        verbose_name='Локации'
    )
    depth_min = models.FloatField(verbose_name='Минимальная глубина (м)')
    depth_max = models.FloatField(verbose_name='Максимальная глубина (м)')

    # Activity time (24h format)
    active_from = models.PositiveIntegerField(
        default=0,
        verbose_name='Активна с (час)'
    )
    active_until = models.PositiveIntegerField(
        default=24,
        verbose_name='Активна до (час)'
    )

    class Meta:
        verbose_name = 'Рыба'
        verbose_name_plural = 'Рыбы'
        ordering = ['rarity', 'name']

    def __str__(self):
        return f'{self.name} ({self.get_rarity_display()})'

    def generate_weight(self) -> float:
        """Generate random weight within range."""
        import random
        return round(random.uniform(self.min_weight, self.max_weight), 2)

    def calculate_price(self, weight: float) -> int:
        """Calculate price based on weight and rarity multiplier."""
        rarity_multiplier = {
            Rarity.COMMON: 1.0,
            Rarity.UNCOMMON: 1.5,
            Rarity.RARE: 2.5,
            Rarity.EPIC: 4.0,
            Rarity.LEGENDARY: 8.0,
        }
        return int(weight * self.base_price * rarity_multiplier.get(self.rarity, 1.0))

    def calculate_experience(self, weight: float) -> int:
        """Calculate experience reward."""
        rarity_xp = {
            Rarity.COMMON: 10,
            Rarity.UNCOMMON: 25,
            Rarity.RARE: 50,
            Rarity.EPIC: 100,
            Rarity.LEGENDARY: 250,
        }
        base_xp = rarity_xp.get(self.rarity, 10)
        return int(base_xp * (1 + weight / self.max_weight))


class FishBaitPreference(models.Model):
    """Fish preferences for different baits."""
    fish = models.ForeignKey(
        Fish,
        on_delete=models.CASCADE,
        related_name='bait_preferences',
        verbose_name='Рыба'
    )
    bait = models.ForeignKey(
        'equipment.Bait',
        on_delete=models.CASCADE,
        related_name='fish_preferences',
        verbose_name='Наживка'
    )
    attraction = models.PositiveIntegerField(
        verbose_name='Привлекательность (0-100)',
        help_text='0 = не клюёт, 100 = обожает'
    )

    class Meta:
        verbose_name = 'Предпочтение наживки'
        verbose_name_plural = 'Предпочтения наживок'
        unique_together = ['fish', 'bait']

    def __str__(self):
        return f'{self.fish.name} -> {self.bait.name}: {self.attraction}%'


class CatchRecord(models.Model):
    """Record of caught fish."""
    player = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='catches',
        verbose_name='Игрок'
    )
    fish = models.ForeignKey(
        Fish,
        on_delete=models.CASCADE,
        related_name='catches',
        verbose_name='Рыба'
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name='catches',
        verbose_name='Локация'
    )
    weight = models.FloatField(verbose_name='Вес (кг)')
    price = models.PositiveIntegerField(verbose_name='Цена')
    experience = models.PositiveIntegerField(verbose_name='Опыт')
    caught_at = models.DateTimeField(auto_now_add=True, verbose_name='Время поимки')

    class Meta:
        verbose_name = 'Запись улова'
        verbose_name_plural = 'Записи уловов'
        ordering = ['-caught_at']

    def __str__(self):
        return f'{self.player.username}: {self.fish.name} ({self.weight} кг)'
