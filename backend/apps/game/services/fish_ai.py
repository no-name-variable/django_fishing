"""
ИИ поведения рыбы при вываживании.
Определяет, как рыба реагирует на действия игрока.
"""
import random
import math
from dataclasses import dataclass
from typing import Tuple

from apps.fishing.models import Fish
from apps.game.models import FishState


@dataclass
class FishBehavior:
    """Результат обновления поведения рыбы."""
    new_state: FishState
    direction_change: float  # Изменение направления
    pull_force: float        # Сила тяги (0-100)
    stamina_drain: float     # Потеря выносливости


class FishAI:
    """
    ИИ управления поведением рыбы.

    Рыба меняет состояния в зависимости от:
    - Своей выносливости
    - Характеристик (strength, aggressiveness)
    - Натяжения лески
    - Случайных факторов
    """

    def __init__(self, fish: Fish, weight: float):
        self.fish = fish
        self.weight = weight
        # Вес влияет на силу
        self.weight_factor = weight / fish.max_weight

    def update(
        self,
        current_state: FishState,
        stamina: float,
        tension: float,
        is_reeling: bool
    ) -> FishBehavior:
        """
        Обновить поведение рыбы.

        Args:
            current_state: Текущее состояние рыбы
            stamina: Текущая выносливость (0-100)
            tension: Текущее натяжение лески (0-100)
            is_reeling: Подматывает ли игрок

        Returns:
            FishBehavior с новым состоянием и параметрами
        """
        # Рыба выдохлась
        if stamina < 20:
            return self._exhausted_behavior(stamina)

        # Определяем новое состояние
        new_state = self._determine_state(current_state, stamina, tension, is_reeling)

        # Рассчитываем поведение для состояния
        if new_state == FishState.RUSH:
            return self._rush_behavior(stamina)
        elif new_state == FishState.ACTIVE:
            return self._active_behavior(stamina, tension)
        elif new_state == FishState.PASSIVE:
            return self._passive_behavior(stamina)
        else:
            return self._exhausted_behavior(stamina)

    def _determine_state(
        self,
        current: FishState,
        stamina: float,
        tension: float,
        is_reeling: bool
    ) -> FishState:
        """Определить новое состояние рыбы."""
        # Шанс рывка зависит от агрессивности и натяжения
        rush_chance = (
            self.fish.aggressiveness / 100 *
            (tension / 100) *
            0.15  # Базовый шанс 15% при максимальных параметрах
        )

        # Высокое натяжение провоцирует рывок
        if tension > 70:
            rush_chance *= 2

        # При подмотке рыба чаще сопротивляется
        if is_reeling and current == FishState.PASSIVE:
            if random.random() < 0.3 + (self.fish.strength / 200):
                return FishState.ACTIVE

        # Рывок
        if random.random() < rush_chance:
            return FishState.RUSH

        # Уставшая рыба остаётся пассивной
        if stamina < 40 and random.random() < 0.4:
            return FishState.PASSIVE

        # Активное сопротивление
        if current == FishState.RUSH:
            # После рывка переход в активное или пассивное
            return FishState.ACTIVE if random.random() < 0.6 else FishState.PASSIVE

        if current == FishState.ACTIVE:
            # Может устать или продолжить сопротивляться
            if random.random() < 0.2 + (100 - stamina) / 200:
                return FishState.PASSIVE
            return FishState.ACTIVE

        # Пассивная рыба может начать сопротивляться
        if current == FishState.PASSIVE:
            if random.random() < self.fish.aggressiveness / 300:
                return FishState.ACTIVE

        return current

    def _rush_behavior(self, stamina: float) -> FishBehavior:
        """Поведение при рывке - сильный рывок в случайном направлении."""
        return FishBehavior(
            new_state=FishState.RUSH,
            direction_change=random.uniform(-60, 60),
            pull_force=70 + self.fish.strength * 0.3 * self.weight_factor,
            stamina_drain=3 + self.fish.strength * 0.05
        )

    def _active_behavior(self, stamina: float, tension: float) -> FishBehavior:
        """Активное сопротивление - умеренная тяга."""
        return FishBehavior(
            new_state=FishState.ACTIVE,
            direction_change=random.uniform(-20, 20),
            pull_force=30 + self.fish.strength * 0.4 * self.weight_factor,
            stamina_drain=1.5 + (tension / 100) * 0.5
        )

    def _passive_behavior(self, stamina: float) -> FishBehavior:
        """Пассивное состояние - слабое сопротивление."""
        return FishBehavior(
            new_state=FishState.PASSIVE,
            direction_change=random.uniform(-5, 5),
            pull_force=10 + self.fish.strength * 0.1,
            stamina_drain=0.5
        )

    def _exhausted_behavior(self, stamina: float) -> FishBehavior:
        """Рыба выдохлась - почти не сопротивляется."""
        return FishBehavior(
            new_state=FishState.EXHAUSTED,
            direction_change=0,
            pull_force=5,
            stamina_drain=0.1
        )

    def calculate_escape_chance(self, tension: float, stamina: float) -> float:
        """
        Рассчитать шанс схода рыбы.

        Рыба может сойти при:
        - Слишком слабом натяжении
        - После рывка при неправильной реакции
        """
        # При очень слабом натяжении рыба может сойти
        if tension < 10 and stamina > 50:
            return 0.02 * (1 - tension / 10)

        return 0
