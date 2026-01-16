"""
Equipment models: Rod, Reel, Line, Bait.
"""
from django.db import models


class EquipmentTier(models.TextChoices):
    BASIC = 'basic', 'Базовое'
    AMATEUR = 'amateur', 'Любительское'
    PROFESSIONAL = 'professional', 'Профессиональное'
    EXPERT = 'expert', 'Экспертное'
    MASTER = 'master', 'Мастерское'


class Rod(models.Model):
    """Fishing rod."""
    name = models.CharField(max_length=100, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    image = models.ImageField(
        upload_to='equipment/rods/',
        null=True,
        blank=True,
        verbose_name='Изображение'
    )
    tier = models.CharField(
        max_length=20,
        choices=EquipmentTier.choices,
        default=EquipmentTier.BASIC,
        verbose_name='Уровень'
    )
    power = models.PositiveIntegerField(
        verbose_name='Мощность (1-100)',
        help_text='Влияет на контроль крупной рыбы'
    )
    sensitivity = models.PositiveIntegerField(
        verbose_name='Чувствительность (1-100)',
        help_text='Влияет на обнаружение поклёвки'
    )
    max_line_weight = models.FloatField(
        verbose_name='Макс. тест лески (кг)',
        help_text='Максимальный вес лески'
    )
    cast_distance_bonus = models.PositiveIntegerField(
        default=0,
        verbose_name='Бонус дальности заброса (%)'
    )
    price = models.PositiveIntegerField(verbose_name='Цена')
    required_level = models.PositiveIntegerField(
        default=1,
        verbose_name='Требуемый уровень'
    )
    durability = models.PositiveIntegerField(
        default=100,
        verbose_name='Прочность'
    )

    class Meta:
        verbose_name = 'Удочка'
        verbose_name_plural = 'Удочки'
        ordering = ['required_level', 'price']

    def __str__(self):
        return f'{self.name} ({self.get_tier_display()})'


class Reel(models.Model):
    """Fishing reel."""
    name = models.CharField(max_length=100, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    image = models.ImageField(
        upload_to='equipment/reels/',
        null=True,
        blank=True,
        verbose_name='Изображение'
    )
    tier = models.CharField(
        max_length=20,
        choices=EquipmentTier.choices,
        default=EquipmentTier.BASIC,
        verbose_name='Уровень'
    )
    gear_ratio = models.FloatField(
        verbose_name='Передаточное число',
        help_text='Скорость подмотки (например 5.2:1)'
    )
    drag_power = models.FloatField(
        verbose_name='Сила фрикциона (кг)',
        help_text='Максимальное сопротивление'
    )
    line_capacity = models.PositiveIntegerField(
        verbose_name='Вместимость лески (м)'
    )
    retrieve_speed = models.PositiveIntegerField(
        verbose_name='Скорость подмотки (1-100)'
    )
    price = models.PositiveIntegerField(verbose_name='Цена')
    required_level = models.PositiveIntegerField(
        default=1,
        verbose_name='Требуемый уровень'
    )
    durability = models.PositiveIntegerField(
        default=100,
        verbose_name='Прочность'
    )

    class Meta:
        verbose_name = 'Катушка'
        verbose_name_plural = 'Катушки'
        ordering = ['required_level', 'price']

    def __str__(self):
        return f'{self.name} ({self.gear_ratio}:1)'


class Line(models.Model):
    """Fishing line."""
    name = models.CharField(max_length=100, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    image = models.ImageField(
        upload_to='equipment/lines/',
        null=True,
        blank=True,
        verbose_name='Изображение'
    )
    tier = models.CharField(
        max_length=20,
        choices=EquipmentTier.choices,
        default=EquipmentTier.BASIC,
        verbose_name='Уровень'
    )
    breaking_strength = models.FloatField(
        verbose_name='Разрывная нагрузка (кг)'
    )
    visibility = models.PositiveIntegerField(
        verbose_name='Заметность (1-100)',
        help_text='Чем ниже, тем лучше клёв'
    )
    stretch = models.PositiveIntegerField(
        verbose_name='Растяжимость (1-100)',
        help_text='Высокая = больше прощает ошибки'
    )
    length = models.PositiveIntegerField(
        verbose_name='Длина (м)'
    )
    price = models.PositiveIntegerField(verbose_name='Цена')
    required_level = models.PositiveIntegerField(
        default=1,
        verbose_name='Требуемый уровень'
    )

    class Meta:
        verbose_name = 'Леска'
        verbose_name_plural = 'Лески'
        ordering = ['required_level', 'price']

    def __str__(self):
        return f'{self.name} ({self.breaking_strength} кг)'


class BaitType(models.TextChoices):
    LIVE = 'live', 'Живая наживка'
    ARTIFICIAL = 'artificial', 'Искусственная'
    DOUGH = 'dough', 'Тесто/Паста'
    NATURAL = 'natural', 'Натуральная'


class Bait(models.Model):
    """Fishing bait."""
    name = models.CharField(max_length=100, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    image = models.ImageField(
        upload_to='equipment/baits/',
        null=True,
        blank=True,
        verbose_name='Изображение'
    )
    bait_type = models.CharField(
        max_length=20,
        choices=BaitType.choices,
        default=BaitType.NATURAL,
        verbose_name='Тип'
    )
    uses = models.PositiveIntegerField(
        verbose_name='Количество использований',
        help_text='На сколько забросов хватает'
    )
    attraction_bonus = models.PositiveIntegerField(
        default=0,
        verbose_name='Бонус привлекательности (%)'
    )
    price = models.PositiveIntegerField(verbose_name='Цена')
    required_level = models.PositiveIntegerField(
        default=1,
        verbose_name='Требуемый уровень'
    )
    is_consumable = models.BooleanField(
        default=True,
        verbose_name='Расходуемая'
    )

    class Meta:
        verbose_name = 'Наживка'
        verbose_name_plural = 'Наживки'
        ordering = ['bait_type', 'price']

    def __str__(self):
        return f'{self.name} ({self.get_bait_type_display()})'
