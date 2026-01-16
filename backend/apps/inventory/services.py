"""
Сервисы для работы с инвентарём.
"""
from typing import Optional
from django.db import transaction
from django.contrib.contenttypes.models import ContentType

from apps.users.models import User
from apps.equipment.models import Rod, Reel, Line, Bait
from core.exceptions import (
    InsufficientFundsError,
    InsufficientLevelError,
    EquipmentNotFoundError
)
from .models import InventoryItem, PlayerEquipment


class InventoryService:
    """Сервис для управления инвентарём игрока."""

    def __init__(self, user: User):
        self.user = user
        self.profile = user.profile

    @transaction.atomic
    def purchase_item(self, item_type: str, item_id: int, quantity: int = 1) -> InventoryItem:
        """
        Покупка предмета в магазине.

        Args:
            item_type: Тип предмета (rod, reel, line, bait)
            item_id: ID предмета
            quantity: Количество (для расходуемых)

        Returns:
            InventoryItem: Созданный или обновлённый предмет инвентаря

        Raises:
            InsufficientFundsError: Недостаточно денег
            InsufficientLevelError: Недостаточный уровень
        """
        # Получаем модель и предмет
        model_map = {
            'rod': Rod,
            'reel': Reel,
            'line': Line,
            'bait': Bait,
        }
        model = model_map.get(item_type)
        if not model:
            raise ValueError(f'Неизвестный тип предмета: {item_type}')

        item = model.objects.get(pk=item_id)

        # Проверка уровня
        if item.required_level > self.profile.level:
            raise InsufficientLevelError(
                f'Требуется уровень {item.required_level}'
            )

        # Расчёт цены
        total_price = item.price * quantity

        # Проверка денег
        if self.profile.money < total_price:
            raise InsufficientFundsError(
                f'Недостаточно денег. Нужно: {total_price}, есть: {self.profile.money}'
            )

        # Списываем деньги
        self.profile.money -= total_price
        self.profile.save()

        # Добавляем в инвентарь
        content_type = ContentType.objects.get_for_model(model)
        inventory_item, created = InventoryItem.objects.get_or_create(
            player=self.user,
            content_type=content_type,
            object_id=item_id,
            defaults={'quantity': quantity}
        )

        if not created:
            # Для наживки увеличиваем количество
            if item_type == 'bait':
                inventory_item.quantity += quantity
                inventory_item.save()

        return inventory_item

    def equip_item(self, inventory_item_id: int, slot: str) -> None:
        """
        Экипировать предмет из инвентаря.

        Args:
            inventory_item_id: ID предмета в инвентаре
            slot: Слот (rod, reel, line, bait)
        """
        # Получаем предмет
        try:
            inv_item = InventoryItem.objects.get(
                pk=inventory_item_id,
                player=self.user
            )
        except InventoryItem.DoesNotExist:
            raise EquipmentNotFoundError('Предмет не найден в инвентаре')

        # Получаем или создаём экипировку
        equipment, _ = PlayerEquipment.objects.get_or_create(player=self.user)

        # Устанавливаем в нужный слот
        if slot == 'rod':
            equipment.rod = inv_item
        elif slot == 'reel':
            equipment.reel = inv_item
        elif slot == 'line':
            equipment.line = inv_item
        elif slot == 'bait':
            equipment.bait = inv_item
        else:
            raise ValueError(f'Неизвестный слот: {slot}')

        equipment.save()

    def get_inventory(self) -> list[InventoryItem]:
        """Получить весь инвентарь игрока."""
        return list(
            InventoryItem.objects.filter(player=self.user)
            .select_related('content_type')
        )

    def get_equipment(self) -> Optional[PlayerEquipment]:
        """Получить текущую экипировку."""
        try:
            return PlayerEquipment.objects.get(player=self.user)
        except PlayerEquipment.DoesNotExist:
            return None

    def consume_bait(self) -> bool:
        """
        Использовать одну единицу наживки.
        Вызывается при забросе.

        Returns:
            bool: True если наживка ещё есть, False если закончилась
        """
        equipment = self.get_equipment()
        if not equipment or not equipment.bait:
            return False

        bait_item = equipment.bait
        bait_item.quantity -= 1

        if bait_item.quantity <= 0:
            # Наживка закончилась
            equipment.bait = None
            equipment.save()
            bait_item.delete()
            return False

        bait_item.save()
        return True
