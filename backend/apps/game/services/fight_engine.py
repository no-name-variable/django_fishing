"""
Движок механики вываживания.
Ядро игрового процесса - обрабатывает все действия игрока и обновляет состояние.
"""
import time
from dataclasses import dataclass
from typing import Optional, Tuple
from enum import Enum

from apps.fishing.models import Fish
from apps.equipment.models import Rod, Reel, Line
from apps.game.models import GameSession, GameState, FishState
from apps.game.services.fish_ai import FishAI, FishBehavior
from core.exceptions import LineBreakError, FishEscapedError


class PlayerAction(str, Enum):
    """Действия игрока при вываживании."""
    REEL = 'reel'       # Подмотка
    RELEASE = 'release' # Отпустить (стравить леску)
    HOLD = 'hold'       # Удержание
    SET_DRAG = 'drag'   # Установить фрикцион


@dataclass
class FightState:
    """Текущее состояние вываживания для отправки клиенту."""
    fish_state: FishState
    fish_stamina: float
    fish_distance: float
    fish_direction: float
    line_tension: float
    line_health: float
    drag_level: float
    is_critical: bool  # Критическое натяжение


@dataclass
class FightResult:
    """Результат вываживания."""
    success: bool
    fish: Optional[Fish] = None
    weight: float = 0
    fight_duration: int = 0  # секунды
    reason: str = ''  # Причина завершения


class FightEngine:
    """
    Движок вываживания рыбы.

    Обрабатывает:
    - Действия игрока (подмотка, отпуск, фрикцион)
    - ИИ поведения рыбы
    - Физику лески (натяжение, износ)
    - Условия победы/поражения
    """

    # Константы игровой механики
    TENSION_PER_REEL = 5        # Натяжение при подмотке
    TENSION_DECAY = 2           # Спад натяжения в секунду
    DISTANCE_PER_REEL = 0.5     # Метры за тик подмотки
    DISTANCE_PER_RUSH = 2       # Метры за тик рывка рыбы
    LINE_DAMAGE_THRESHOLD = 80  # Порог натяжения для износа
    CRITICAL_TENSION = 90       # Критическое натяжение
    MAX_TENSION = 100           # Максимум перед обрывом

    def __init__(self, session: GameSession, rod: Rod, reel: Reel, line: Line):
        self.session = session
        self.rod = rod
        self.reel = reel
        self.line = line
        self.fish_ai = FishAI(session.hooked_fish, session.hooked_fish_weight)

        # Расчёт максимальных параметров снасти
        self.max_drag = min(reel.drag_power, line.breaking_strength)
        self.reel_speed = reel.retrieve_speed / 50  # Нормализация к 0-2

    def process_action(self, action: PlayerAction, value: float = 0) -> FightState:
        """
        Обработать действие игрока.

        Args:
            action: Тип действия
            value: Значение (скорость подмотки, уровень фрикциона)

        Returns:
            FightState с обновлённым состоянием
        """
        if action == PlayerAction.REEL:
            self._process_reel(value)
        elif action == PlayerAction.RELEASE:
            self._process_release()
        elif action == PlayerAction.SET_DRAG:
            self._process_drag(value)
        elif action == PlayerAction.HOLD:
            self._process_hold()

        return self._get_state()

    def update(self, delta_time: float) -> Tuple[FightState, Optional[FightResult]]:
        """
        Обновить состояние вываживания (вызывается каждый тик).

        Args:
            delta_time: Время с последнего обновления (секунды)

        Returns:
            Tuple из текущего состояния и результата (если бой завершён)
        """
        # Обновляем поведение рыбы
        behavior = self.fish_ai.update(
            current_state=FishState(self.session.fish_state),
            stamina=self.session.fish_stamina,
            tension=self.session.line_tension,
            is_reeling=False  # Будет True если игрок подматывает
        )

        # Применяем поведение рыбы
        self._apply_fish_behavior(behavior, delta_time)

        # Естественное снижение натяжения
        self.session.line_tension = max(
            0,
            self.session.line_tension - self.TENSION_DECAY * delta_time
        )

        # Проверяем износ лески
        if self.session.line_tension > self.LINE_DAMAGE_THRESHOLD:
            damage = (self.session.line_tension - self.LINE_DAMAGE_THRESHOLD) * 0.1 * delta_time
            self.session.line_health -= damage

        # Проверяем условия завершения
        result = self._check_end_conditions()

        self.session.save()
        return self._get_state(), result

    def _process_reel(self, speed: float) -> None:
        """Обработка подмотки."""
        # Скорость 0-1, умножается на характеристики катушки
        effective_speed = speed * self.reel_speed

        # Уменьшаем дистанцию
        reel_distance = self.DISTANCE_PER_REEL * effective_speed
        self.session.fish_distance = max(0, self.session.fish_distance - reel_distance)

        # Увеличиваем натяжение в зависимости от состояния рыбы
        fish_state = FishState(self.session.fish_state)
        tension_multiplier = {
            FishState.PASSIVE: 1.0,
            FishState.ACTIVE: 1.5,
            FishState.RUSH: 3.0,
            FishState.EXHAUSTED: 0.5,
        }.get(fish_state, 1.0)

        tension_increase = self.TENSION_PER_REEL * effective_speed * tension_multiplier
        self.session.line_tension = min(
            self.MAX_TENSION,
            self.session.line_tension + tension_increase
        )

        # Рыба теряет больше выносливости при подмотке
        self.session.fish_stamina = max(
            0,
            self.session.fish_stamina - effective_speed * 0.5
        )

    def _process_release(self) -> None:
        """Обработка стравливания лески."""
        # Резко снижаем натяжение
        self.session.line_tension = max(0, self.session.line_tension - 20)
        # Рыба отплывает
        self.session.fish_distance += 1

    def _process_drag(self, level: float) -> None:
        """Установка уровня фрикциона."""
        self.session.drag_level = max(0.1, min(1.0, level))

    def _process_hold(self) -> None:
        """Удержание - поддержание текущего натяжения."""
        # Натяжение медленно падает, но удерживаем рыбу
        pass

    def _apply_fish_behavior(self, behavior: FishBehavior, delta_time: float) -> None:
        """Применить поведение рыбы к состоянию."""
        self.session.fish_state = behavior.new_state.value
        self.session.fish_direction += behavior.direction_change

        # Нормализуем направление к -180..180
        while self.session.fish_direction > 180:
            self.session.fish_direction -= 360
        while self.session.fish_direction < -180:
            self.session.fish_direction += 360

        # Рыба тянет леску - увеличиваем натяжение и дистанцию
        pull_effect = behavior.pull_force * self.session.drag_level
        self.session.line_tension = min(
            self.MAX_TENSION,
            self.session.line_tension + pull_effect * delta_time * 0.5
        )

        # При рывке рыба отплывает
        if behavior.new_state == FishState.RUSH:
            self.session.fish_distance += self.DISTANCE_PER_RUSH * delta_time

        # Расход выносливости рыбы
        stamina_drain = behavior.stamina_drain * delta_time
        # Высокий фрикцион утомляет рыбу быстрее
        stamina_drain *= (1 + self.session.drag_level * 0.5)
        # Мощность удилища ускоряет утомление
        stamina_drain *= (1 + self.rod.power / 200)

        self.session.fish_stamina = max(0, self.session.fish_stamina - stamina_drain)

    def _check_end_conditions(self) -> Optional[FightResult]:
        """Проверить условия завершения боя."""
        # Обрыв лески
        if self.session.line_tension >= self.MAX_TENSION:
            return FightResult(
                success=False,
                reason='line_break'
            )

        # Износ лески
        if self.session.line_health <= 0:
            return FightResult(
                success=False,
                reason='line_worn'
            )

        # Рыба уплыла
        if self.session.fish_distance > self.line.length * 0.9:
            return FightResult(
                success=False,
                reason='fish_escaped'
            )

        # Победа - рыба близко и устала (или совсем выдохлась)
        win_condition_1 = self.session.fish_distance <= 3 and self.session.fish_stamina < 20
        win_condition_2 = self.session.fish_stamina <= 0  # Если выносливость 0 - автоматическая победа

        if win_condition_1 or win_condition_2:
            print(f'[DEBUG] WIN! cond1={win_condition_1}, cond2={win_condition_2}, dist={self.session.fish_distance}, stam={self.session.fish_stamina}')
            duration = 0
            if self.session.fight_start_time:
                from django.utils import timezone
                duration = int((timezone.now() - self.session.fight_start_time).total_seconds())

            return FightResult(
                success=True,
                fish=self.session.hooked_fish,
                weight=self.session.hooked_fish_weight,
                fight_duration=duration,
                reason='caught'
            )

        # Шанс схода
        escape_chance = self.fish_ai.calculate_escape_chance(
            self.session.line_tension,
            self.session.fish_stamina
        )
        import random
        if random.random() < escape_chance:
            return FightResult(
                success=False,
                reason='fish_escaped'
            )

        return None

    def _get_state(self) -> FightState:
        """Получить текущее состояние для отправки клиенту."""
        return FightState(
            fish_state=FishState(self.session.fish_state),
            fish_stamina=round(self.session.fish_stamina, 1),
            fish_distance=round(self.session.fish_distance, 1),
            fish_direction=round(self.session.fish_direction, 1),
            line_tension=round(self.session.line_tension, 1),
            line_health=round(self.session.line_health, 1),
            drag_level=round(self.session.drag_level, 2),
            is_critical=self.session.line_tension >= self.CRITICAL_TENSION
        )
