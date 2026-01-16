"""
Fishing API endpoints.
"""
from typing import List, Optional
from ninja import Router, Schema
from ninja_jwt.authentication import JWTAuth

from .models import Fish, Location, CatchRecord, Rarity

router = Router()


class LocationSchema(Schema):
    id: int
    name: str
    description: str
    image: Optional[str]
    max_depth: float
    required_level: int


class FishSchema(Schema):
    id: int
    name: str
    description: str
    image: Optional[str]
    min_weight: float
    max_weight: float
    rarity: str
    rarity_display: str
    base_price: int
    strength: int
    stamina: int
    aggressiveness: int


class CatchRecordSchema(Schema):
    id: int
    fish_name: str
    fish_rarity: str
    location_name: str
    weight: float
    price: int
    experience: int
    caught_at: str


@router.get('/locations', response=List[LocationSchema], auth=JWTAuth())
def list_locations(request):
    """List all available locations for player."""
    from .services.fishing_service import FishingService
    service = FishingService(request.auth)
    locations = service.get_available_locations()
    return [
        {
            'id': loc.id,
            'name': loc.name,
            'description': loc.description,
            'image': loc.image.url if loc.image else None,
            'max_depth': loc.max_depth,
            'required_level': loc.required_level,
        }
        for loc in locations
    ]


@router.get('/locations/{location_id}/fish', response=List[FishSchema], auth=JWTAuth())
def list_fish_at_location(request, location_id: int):
    """List fish species at a location."""
    fish_list = Fish.objects.filter(locations__id=location_id)
    return [
        {
            'id': f.id,
            'name': f.name,
            'description': f.description,
            'image': f.image.url if f.image else None,
            'min_weight': f.min_weight,
            'max_weight': f.max_weight,
            'rarity': f.rarity,
            'rarity_display': f.get_rarity_display(),
            'base_price': f.base_price,
            'strength': f.strength,
            'stamina': f.stamina,
            'aggressiveness': f.aggressiveness,
        }
        for f in fish_list
    ]


@router.get('/catches', response=List[CatchRecordSchema], auth=JWTAuth())
def list_catches(request, limit: int = 20):
    """List player's recent catches."""
    catches = CatchRecord.objects.filter(
        player=request.auth
    ).select_related('fish', 'location')[:limit]

    return [
        {
            'id': c.id,
            'fish_name': c.fish.name,
            'fish_rarity': c.fish.rarity,
            'location_name': c.location.name,
            'weight': c.weight,
            'price': c.price,
            'experience': c.experience,
            'caught_at': c.caught_at.isoformat(),
        }
        for c in catches
    ]
