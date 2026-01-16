"""
API эндпоинты инвентаря.
"""
from typing import List, Optional
from ninja import Router, Schema
from ninja_jwt.authentication import JWTAuth

from .models import InventoryItem, PlayerEquipment
from .services import InventoryService
from core.exceptions import InsufficientFundsError, InsufficientLevelError

router = Router()


class InventoryItemSchema(Schema):
    """Схема предмета инвентаря."""
    id: int
    item_type: str
    item_id: int
    item_name: str
    quantity: int
    durability: int


class EquipmentSchema(Schema):
    """Схема экипировки."""
    rod: Optional[InventoryItemSchema]
    reel: Optional[InventoryItemSchema]
    line: Optional[InventoryItemSchema]
    bait: Optional[InventoryItemSchema]
    is_complete: bool


class PurchaseSchema(Schema):
    """Схема запроса покупки."""
    item_type: str
    item_id: int
    quantity: int = 1


class EquipSchema(Schema):
    """Схема запроса экипировки."""
    inventory_item_id: int
    slot: str


class MessageSchema(Schema):
    """Схема ответа с сообщением."""
    message: str
    success: bool


def _item_to_schema(inv_item: InventoryItem) -> InventoryItemSchema:
    """Конвертирует InventoryItem в схему."""
    return {
        'id': inv_item.id,
        'item_type': inv_item.content_type.model,
        'item_id': inv_item.object_id,
        'item_name': str(inv_item.item),
        'quantity': inv_item.quantity,
        'durability': inv_item.durability,
    }


@router.get('/items', response=List[InventoryItemSchema], auth=JWTAuth())
def list_inventory(request):
    """Получить инвентарь игрока."""
    service = InventoryService(request.auth)
    items = service.get_inventory()
    return [_item_to_schema(item) for item in items]


@router.get('/equipment', response=EquipmentSchema, auth=JWTAuth())
def get_equipment(request):
    """Получить текущую экипировку."""
    service = InventoryService(request.auth)
    equipment = service.get_equipment()

    if not equipment:
        return {
            'rod': None,
            'reel': None,
            'line': None,
            'bait': None,
            'is_complete': False,
        }

    return {
        'rod': _item_to_schema(equipment.rod) if equipment.rod else None,
        'reel': _item_to_schema(equipment.reel) if equipment.reel else None,
        'line': _item_to_schema(equipment.line) if equipment.line else None,
        'bait': _item_to_schema(equipment.bait) if equipment.bait else None,
        'is_complete': equipment.is_complete(),
    }


@router.post('/purchase', response={200: MessageSchema, 400: MessageSchema}, auth=JWTAuth())
def purchase_item(request, data: PurchaseSchema):
    """Купить предмет."""
    service = InventoryService(request.auth)
    try:
        service.purchase_item(data.item_type, data.item_id, data.quantity)
        return 200, {'message': 'Предмет куплен', 'success': True}
    except InsufficientFundsError as e:
        return 400, {'message': str(e), 'success': False}
    except InsufficientLevelError as e:
        return 400, {'message': str(e), 'success': False}


@router.post('/equip', response={200: MessageSchema, 400: MessageSchema}, auth=JWTAuth())
def equip_item(request, data: EquipSchema):
    """Экипировать предмет."""
    service = InventoryService(request.auth)
    try:
        service.equip_item(data.inventory_item_id, data.slot)
        return 200, {'message': 'Предмет экипирован', 'success': True}
    except Exception as e:
        return 400, {'message': str(e), 'success': False}
