"""
Модели системы прогрессии: достижения и статистика.
"""
from django.db import models


class AchievementType(models.TextChoices):
    """Типы достижений."""
    CATCH_COUNT = 'catch_count', 'Количество пойманной рыбы'
    CATCH_WEIGHT = 'catch_weight', 'Вес пойманной рыбы'
    CATCH_RARITY = 'catch_rarity', 'Поймать рыбу редкости'
    CATCH_SPECIES = 'catch_species', 'Поймать определённый вид'
    LEVEL_REACH = 'level_reach', 'Достичь уровня'
    MONEY_EARN = 'money_earn', 'Заработать денег'
    LOCATION_VISIT = 'location_visit', 'Посетить локацию'


class Achievement(models.Model):
    """
    Достижение в игре.
    Определяет условия и награды за выполнение.
    """
    name = models.CharField(max_length=100, verbose_name='Название')
    description = models.TextField(verbose_name='Описание')
    icon = models.ImageField(
        upload_to='achievements/',
        null=True,
        blank=True,
        verbose_name='Иконка'
    )

    # Условия получения
    achievement_type = models.CharField(
        max_length=20,
        choices=AchievementType.choices,
        verbose_name='Тип'
    )
    target_value = models.PositiveIntegerField(
        verbose_name='Целевое значение',
        help_text='Например: 100 рыб, 50 кг, уровень 10'
    )
    # Для достижений с конкретной рыбой/локацией
    target_fish = models.ForeignKey(
        'fishing.Fish',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Целевая рыба'
    )
    target_location = models.ForeignKey(
        'fishing.Location',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Целевая локация'
    )
    target_rarity = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Целевая редкость'
    )

    # Награды
    reward_money = models.PositiveIntegerField(
        default=0,
        verbose_name='Награда деньгами'
    )
    reward_experience = models.PositiveIntegerField(
        default=0,
        verbose_name='Награда опытом'
    )

    # Порядок отображения
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')
    is_hidden = models.BooleanField(
        default=False,
        verbose_name='Скрытое',
        help_text='Скрытые достижения не показываются до получения'
    )

    class Meta:
        verbose_name = 'Достижение'
        verbose_name_plural = 'Достижения'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class PlayerAchievement(models.Model):
    """Полученное игроком достижение."""
    player = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='achievements',
        verbose_name='Игрок'
    )
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name='players',
        verbose_name='Достижение'
    )
    unlocked_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата получения'
    )

    class Meta:
        verbose_name = 'Достижение игрока'
        verbose_name_plural = 'Достижения игроков'
        unique_together = ['player', 'achievement']

    def __str__(self):
        return f'{self.player.username}: {self.achievement.name}'


class PlayerStats(models.Model):
    """
    Детальная статистика игрока.
    Расширяет базовую статистику в PlayerProfile.
    """
    player = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='stats',
        verbose_name='Игрок'
    )

    # Статистика по рыбалке
    total_casts = models.PositiveIntegerField(
        default=0,
        verbose_name='Всего забросов'
    )
    successful_catches = models.PositiveIntegerField(
        default=0,
        verbose_name='Успешных поимок'
    )
    fish_escaped = models.PositiveIntegerField(
        default=0,
        verbose_name='Рыба сорвалась'
    )
    line_breaks = models.PositiveIntegerField(
        default=0,
        verbose_name='Обрывов лески'
    )

    # Статистика по редкостям
    common_caught = models.PositiveIntegerField(default=0)
    uncommon_caught = models.PositiveIntegerField(default=0)
    rare_caught = models.PositiveIntegerField(default=0)
    epic_caught = models.PositiveIntegerField(default=0)
    legendary_caught = models.PositiveIntegerField(default=0)

    # Рекорды
    longest_fight_seconds = models.PositiveIntegerField(
        default=0,
        verbose_name='Самое долгое вываживание (сек)'
    )
    fastest_catch_seconds = models.PositiveIntegerField(
        default=0,
        verbose_name='Самая быстрая поимка (сек)'
    )

    # Время игры
    total_play_time_seconds = models.PositiveIntegerField(
        default=0,
        verbose_name='Общее время игры (сек)'
    )

    class Meta:
        verbose_name = 'Статистика игрока'
        verbose_name_plural = 'Статистика игроков'

    def __str__(self):
        return f'Статистика {self.player.username}'

    @property
    def catch_rate(self) -> float:
        """Процент успешных поимок."""
        if self.total_casts == 0:
            return 0
        return round(self.successful_catches / self.total_casts * 100, 1)
