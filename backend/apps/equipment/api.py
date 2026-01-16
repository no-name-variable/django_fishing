"""
Equipment API endpoints.
"""
from typing import List, Optional
from ninja import Router, Schema
from ninja_jwt.authentication import JWTAuth

from .models import Rod, Reel, Line, Bait

router = Router()


class RodSchema(Schema):
    id: int
    name: str
    description: str
    image: Optional[str]
    tier: str
    tier_display: str
    power: int
    sensitivity: int
    max_line_weight: float
    cast_distance_bonus: int
    price: int
    required_level: int


class ReelSchema(Schema):
    id: int
    name: str
    description: str
    image: Optional[str]
    tier: str
    tier_display: str
    gear_ratio: float
    drag_power: float
    line_capacity: int
    retrieve_speed: int
    price: int
    required_level: int


class LineSchema(Schema):
    id: int
    name: str
    description: str
    image: Optional[str]
    tier: str
    tier_display: str
    breaking_strength: float
    visibility: int
    stretch: int
    length: int
    price: int
    required_level: int


class BaitSchema(Schema):
    id: int
    name: str
    description: str
    image: Optional[str]
    bait_type: str
    bait_type_display: str
    uses: int
    attraction_bonus: int
    price: int
    required_level: int
    is_consumable: bool


@router.get('/rods', response=List[RodSchema], auth=JWTAuth())
def list_rods(request, available_only: bool = False):
    """List all rods, optionally filtered by player level."""
    rods = Rod.objects.all()
    if available_only:
        rods = rods.filter(required_level__lte=request.auth.profile.level)
    return [
        {
            'id': r.id,
            'name': r.name,
            'description': r.description,
            'image': r.image.url if r.image else None,
            'tier': r.tier,
            'tier_display': r.get_tier_display(),
            'power': r.power,
            'sensitivity': r.sensitivity,
            'max_line_weight': r.max_line_weight,
            'cast_distance_bonus': r.cast_distance_bonus,
            'price': r.price,
            'required_level': r.required_level,
        }
        for r in rods
    ]


@router.get('/reels', response=List[ReelSchema], auth=JWTAuth())
def list_reels(request, available_only: bool = False):
    """List all reels."""
    reels = Reel.objects.all()
    if available_only:
        reels = reels.filter(required_level__lte=request.auth.profile.level)
    return [
        {
            'id': r.id,
            'name': r.name,
            'description': r.description,
            'image': r.image.url if r.image else None,
            'tier': r.tier,
            'tier_display': r.get_tier_display(),
            'gear_ratio': r.gear_ratio,
            'drag_power': r.drag_power,
            'line_capacity': r.line_capacity,
            'retrieve_speed': r.retrieve_speed,
            'price': r.price,
            'required_level': r.required_level,
        }
        for r in reels
    ]


@router.get('/lines', response=List[LineSchema], auth=JWTAuth())
def list_lines(request, available_only: bool = False):
    """List all lines."""
    lines = Line.objects.all()
    if available_only:
        lines = lines.filter(required_level__lte=request.auth.profile.level)
    return [
        {
            'id': ln.id,
            'name': ln.name,
            'description': ln.description,
            'image': ln.image.url if ln.image else None,
            'tier': ln.tier,
            'tier_display': ln.get_tier_display(),
            'breaking_strength': ln.breaking_strength,
            'visibility': ln.visibility,
            'stretch': ln.stretch,
            'length': ln.length,
            'price': ln.price,
            'required_level': ln.required_level,
        }
        for ln in lines
    ]


@router.get('/baits', response=List[BaitSchema], auth=JWTAuth())
def list_baits(request, available_only: bool = False):
    """List all baits."""
    baits = Bait.objects.all()
    if available_only:
        baits = baits.filter(required_level__lte=request.auth.profile.level)
    return [
        {
            'id': b.id,
            'name': b.name,
            'description': b.description,
            'image': b.image.url if b.image else None,
            'bait_type': b.bait_type,
            'bait_type_display': b.get_bait_type_display(),
            'uses': b.uses,
            'attraction_bonus': b.attraction_bonus,
            'price': b.price,
            'required_level': b.required_level,
            'is_consumable': b.is_consumable,
        }
        for b in baits
    ]
