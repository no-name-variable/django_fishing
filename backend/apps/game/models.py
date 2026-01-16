"""
Модели игровой сессии.
Хранит состояние активной рыбалки.
"""
from django.db import models


class GameState(models.TextChoices):
    """Состояния игровой сессии."""
    IDLE = 'idle', 'Ожидание'
    CASTING = 'casting', 'Заброс'
    WAITING = 'waiting', 'Ожидание поклёвки'
    BITE = 'bite', 'Поклёвка'
    FIGHTING = 'fighting', 'Вываживание'
    CATCHING = 'catching', 'Подсечка'


class FishState(models.TextChoices):
    """Состояния рыбы при вываживании."""
    PASSIVE = 'passive', 'Пассивная'  # Можно подматывать
    ACTIVE = 'active', 'Активная'     # Сопротивляется
    RUSH = 'rush', 'Рывок'            # Нужно отпустить
    EXHAUSTED = 'exhausted', 'Уставшая'  # Легко вытянуть


class GameSession(models.Model):
    """
    Активная игровая сессия.
    Создаётся при подключении к WebSocket, удаляется при отключении.
    """
    player = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='game_session',
        verbose_name='Игрок'
    )
    location = models.ForeignKey(
        'fishing.Location',
        on_delete=models.CASCADE,
        verbose_name='Локация'
    )

    # Текущее состояние
    state = models.CharField(
        max_length=20,
        choices=GameState.choices,
        default=GameState.IDLE,
        verbose_name='Состояние'
    )

    # Параметры заброса
    cast_distance = models.FloatField(
        default=0,
        verbose_name='Дистанция заброса (м)'
    )
    cast_depth = models.FloatField(
        default=0,
        verbose_name='Глубина (м)'
    )

    # Данные о пойманной рыбе (заполняются при поклёвке)
    hooked_fish = models.ForeignKey(
        'fishing.Fish',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Рыба на крючке'
    )
    hooked_fish_weight = models.FloatField(
        default=0,
        verbose_name='Вес рыбы (кг)'
    )

    # Параметры вываживания
    fish_state = models.CharField(
        max_length=20,
        choices=FishState.choices,
        default=FishState.PASSIVE,
        verbose_name='Состояние рыбы'
    )
    fish_stamina = models.FloatField(
        default=100,
        verbose_name='Выносливость рыбы (0-100)'
    )
    fish_distance = models.FloatField(
        default=0,
        verbose_name='Дистанция до рыбы (м)'
    )
    fish_direction = models.FloatField(
        default=0,
        verbose_name='Направление рыбы (градусы)'
    )

    # Состояние снасти
    line_tension = models.FloatField(
        default=0,
        verbose_name='Натяжение лески (0-100)'
    )
    line_health = models.FloatField(
        default=100,
        verbose_name='Здоровье лески (0-100)'
    )
    drag_level = models.FloatField(
        default=0.5,
        verbose_name='Уровень фрикциона (0-1)'
    )

    # Время
    fight_start_time = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Начало вываживания'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Игровая сессия'
        verbose_name_plural = 'Игровые сессии'

    def __str__(self):
        return f'Сессия {self.player.username} @ {self.location.name}'
