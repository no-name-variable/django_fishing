"""
Bite calculation service.
Determines if and when a fish bites based on various factors.
"""
import random
from datetime import datetime
from typing import Optional
from dataclasses import dataclass

from apps.fishing.models import Fish, Location, FishBaitPreference
from apps.equipment.models import Bait


@dataclass
class BiteResult:
    """Result of bite calculation."""
    will_bite: bool
    fish: Optional[Fish] = None
    wait_time: float = 0  # seconds until bite
    intensity: float = 0  # bite intensity 0-1


class BiteCalculator:
    """Service for calculating fish bites."""

    def __init__(
        self,
        location: Location,
        bait: Bait,
        cast_distance: float,
        depth: float
    ):
        self.location = location
        self.bait = bait
        self.cast_distance = cast_distance
        self.depth = depth

    def calculate_bite(self) -> BiteResult:
        """Calculate if a fish will bite and which one."""
        # Get all fish at this location and depth
        available_fish = Fish.objects.filter(
            locations=self.location,
            depth_min__lte=self.depth,
            depth_max__gte=self.depth
        )

        if not available_fish.exists():
            return BiteResult(will_bite=False, wait_time=random.uniform(30, 60))

        # Calculate bite probability for each fish
        fish_probabilities = []
        current_hour = datetime.now().hour

        for fish in available_fish:
            # Check if fish is active at current time
            if not self._is_fish_active(fish, current_hour):
                continue

            # Get bait attraction
            attraction = self._get_bait_attraction(fish)
            if attraction == 0:
                continue

            # Calculate base probability
            probability = self._calculate_probability(fish, attraction)
            fish_probabilities.append((fish, probability))

        if not fish_probabilities:
            return BiteResult(will_bite=False, wait_time=random.uniform(30, 60))

        # Determine if any fish bites
        total_probability = sum(p for _, p in fish_probabilities)

        if random.random() >= min(total_probability, 0.8):
            return BiteResult(
                will_bite=False,
                wait_time=random.uniform(15, 45)
            )

        # Select which fish bites (weighted random)
        fish = self._weighted_random_fish(fish_probabilities)
        wait_time = self._calculate_wait_time(fish)
        intensity = self._calculate_intensity(fish)

        return BiteResult(
            will_bite=True,
            fish=fish,
            wait_time=wait_time,
            intensity=intensity
        )

    def _is_fish_active(self, fish: Fish, hour: int) -> bool:
        """Check if fish is active at given hour."""
        if fish.active_from <= fish.active_until:
            return fish.active_from <= hour < fish.active_until
        else:
            # Wraps around midnight
            return hour >= fish.active_from or hour < fish.active_until

    def _get_bait_attraction(self, fish: Fish) -> int:
        """Get bait attraction for fish."""
        try:
            pref = FishBaitPreference.objects.get(fish=fish, bait=self.bait)
            return pref.attraction
        except FishBaitPreference.DoesNotExist:
            return 20  # Default low attraction

    def _calculate_probability(self, fish: Fish, attraction: int) -> float:
        """Calculate bite probability."""
        # Base probability from rarity
        rarity_factor = {
            'common': 0.4,
            'uncommon': 0.25,
            'rare': 0.15,
            'epic': 0.08,
            'legendary': 0.03,
        }.get(fish.rarity, 0.1)

        # Attraction factor (0-100 -> 0.5-1.5)
        attraction_factor = 0.5 + (attraction / 100)

        # Depth match factor
        depth_range = fish.depth_max - fish.depth_min
        depth_center = (fish.depth_min + fish.depth_max) / 2
        depth_diff = abs(self.depth - depth_center)
        depth_factor = max(0.5, 1 - (depth_diff / depth_range))

        return rarity_factor * attraction_factor * depth_factor

    def _weighted_random_fish(
        self,
        fish_probabilities: list[tuple[Fish, float]]
    ) -> Fish:
        """Select a fish based on weighted probabilities."""
        total = sum(p for _, p in fish_probabilities)
        r = random.uniform(0, total)
        cumulative = 0
        for fish, prob in fish_probabilities:
            cumulative += prob
            if r < cumulative:  # Исправлено: < вместо <= для устранения bias
                return fish
        return fish_probabilities[-1][0]

    def _calculate_wait_time(self, fish: Fish) -> float:
        """Calculate time until bite in seconds."""
        # Rarer fish take longer
        rarity_time = {
            'common': (5, 20),
            'uncommon': (10, 30),
            'rare': (20, 45),
            'epic': (30, 60),
            'legendary': (45, 90),
        }.get(fish.rarity, (10, 30))

        return random.uniform(*rarity_time)

    def _calculate_intensity(self, fish: Fish) -> float:
        """Calculate bite intensity (0-1)."""
        # Based on fish strength and aggressiveness
        base = (fish.strength + fish.aggressiveness) / 200
        variation = random.uniform(-0.1, 0.1)
        return max(0.3, min(1.0, base + variation))
