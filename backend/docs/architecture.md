# Архитектура Backend

## Структура проекта

```
backend/
├── fishing_game/          # Django project settings
├── apps/                  # Django applications
│   ├── users/            # Пользователи и профили
│   ├── fishing/          # Логика рыбалки (рыба, локации)
│   ├── equipment/        # Снаряжение (удочки, катушки, наживки)
│   ├── inventory/        # Инвентарь игрока
│   ├── progression/      # Уровни, достижения
│   └── game/             # Real-time игровая сессия (WebSocket)
├── core/                 # Общие компоненты
└── docs/                 # Документация
```

## Clean Architecture

- **Models** - Django ORM модели, хранение данных
- **Services** - Бизнес-логика, не зависит от HTTP/WS
- **Use Cases** - Сценарии использования (для game модуля)
- **API** - Django Ninja endpoints (HTTP)
- **Consumers** - WebSocket handlers (Channels)

## Зависимости между модулями

```
users ← fishing ← equipment
         ↓
      inventory ← progression
         ↓
        game (использует все)
```

## Ключевые сервисы

1. **BiteCalculator** (`fishing/services/bite_calculator.py`)
   - Расчёт поклёвки на основе локации, глубины, наживки, времени

2. **FightEngine** (`game/services/fight_engine.py`)
   - Механика вываживания рыбы
   - Состояния: Passive, Active, Rush, Exhausted
   - Параметры: tension, stamina, distance

3. **FishAI** (`game/services/fish_ai.py`)
   - Поведение рыбы во время вываживания
   - Рывки, направление движения
