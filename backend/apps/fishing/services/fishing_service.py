"""
Main fishing service.
"""
from typing import Optional
from dataclasses import dataclass

from django.db import transaction

from apps.users.models import User, PlayerProfile
from apps.fishing.models import Fish, Location, CatchRecord


@dataclass
class CatchResult:
    """Result of catching a fish."""
    fish: Fish
    weight: float
    price: int
    experience: int
    leveled_up: bool
    new_level: Optional[int] = None


class FishingService:
    """Service for fishing operations."""

    def __init__(self, user: User):
        self.user = user
        self.profile = user.profile

    @transaction.atomic
    def record_catch(
        self,
        fish: Fish,
        location: Location,
        weight: float
    ) -> CatchResult:
        """Record a caught fish and update player stats."""
        price = fish.calculate_price(weight)
        experience = fish.calculate_experience(weight)

        # Create catch record
        CatchRecord.objects.create(
            player=self.user,
            fish=fish,
            location=location,
            weight=weight,
            price=price,
            experience=experience
        )

        # Update profile stats
        self.profile.money += price
        self.profile.total_fish_caught += 1
        self.profile.total_weight_caught += weight

        if weight > self.profile.biggest_fish_weight:
            self.profile.biggest_fish_weight = weight

        # Add experience
        leveled_up = self.profile.add_experience(experience)

        return CatchResult(
            fish=fish,
            weight=weight,
            price=price,
            experience=experience,
            leveled_up=leveled_up,
            new_level=self.profile.level if leveled_up else None
        )

    def get_available_locations(self) -> list[Location]:
        """Get locations available for player's level."""
        return list(
            Location.objects.filter(
                is_active=True,
                required_level__lte=self.profile.level
            )
        )

    def can_access_location(self, location: Location) -> bool:
        """Check if player can access location."""
        return (
            location.is_active and
            location.required_level <= self.profile.level
        )
