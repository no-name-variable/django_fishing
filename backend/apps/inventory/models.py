"""
Модели инвентаря игрока.
Хранит снаряжение игрока и текущую экипировку.
"""
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class InventoryItem(models.Model):
    """
    Предмет в инвентаре игрока.
    Использует GenericForeignKey для связи с разными типами снаряжения.
    """
    player = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='inventory_items',
        verbose_name='Игрок'
    )

    # Универсальная связь с любым типом снаряжения
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Тип предмета'
    )
    object_id = models.PositiveIntegerField(verbose_name='ID предмета')
    item = GenericForeignKey('content_type', 'object_id')

    # Количество (для расходуемых предметов типа наживки)
    quantity = models.PositiveIntegerField(default=1, verbose_name='Количество')

    # Состояние предмета (для изнашиваемого снаряжения)
    durability = models.PositiveIntegerField(
        default=100,
        verbose_name='Прочность (%)'
    )

    # Когда приобретён
    acquired_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата получения'
    )

    class Meta:
        verbose_name = 'Предмет инвентаря'
        verbose_name_plural = 'Предметы инвентаря'
        # Уникальность: один игрок не может иметь дубли одного предмета
        unique_together = ['player', 'content_type', 'object_id']

    def __str__(self):
        return f'{self.player.username}: {self.item}'


class PlayerEquipment(models.Model):
    """
    Текущая экипировка игрока.
    Один набор снаряжения на игрока (удочка + катушка + леска + наживка).
    """
    player = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='equipment',
        verbose_name='Игрок'
    )

    # Экипированное снаряжение (ссылки на предметы в инвентаре)
    rod = models.ForeignKey(
        InventoryItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='equipped_as_rod',
        verbose_name='Удочка'
    )
    reel = models.ForeignKey(
        InventoryItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='equipped_as_reel',
        verbose_name='Катушка'
    )
    line = models.ForeignKey(
        InventoryItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='equipped_as_line',
        verbose_name='Леска'
    )
    bait = models.ForeignKey(
        InventoryItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='equipped_as_bait',
        verbose_name='Наживка'
    )

    class Meta:
        verbose_name = 'Экипировка игрока'
        verbose_name_plural = 'Экипировки игроков'

    def __str__(self):
        return f'Экипировка {self.player.username}'

    def is_complete(self) -> bool:
        """Проверяет, что всё снаряжение экипировано."""
        return all([self.rod, self.reel, self.line, self.bait])

    def get_rod(self):
        """Возвращает объект удочки или None."""
        return self.rod.item if self.rod else None

    def get_reel(self):
        """Возвращает объект катушки или None."""
        return self.reel.item if self.reel else None

    def get_line(self):
        """Возвращает объект лески или None."""
        return self.line.item if self.line else None

    def get_bait(self):
        """Возвращает объект наживки или None."""
        return self.bait.item if self.bait else None
