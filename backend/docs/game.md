# Модуль Game

Ядро игрового процесса - real-time вываживание через WebSocket.

## Архитектура

```
game/
├── models.py           # GameSession, GameState, FishState
├── consumers.py        # WebSocket consumer
├── routing.py          # WS URL routing
├── services/
│   ├── game_session.py # Координация сессии
│   ├── fight_engine.py # Механика вываживания
│   └── fish_ai.py      # ИИ поведения рыбы
└── use_cases/
    ├── cast_line.py    # Заброс
    ├── handle_bite.py  # Поклёвка
    ├── fight_fish.py   # Вываживание
    └── catch_fish.py   # Завершение
```

## GameSession States

```
IDLE → CASTING → WAITING → BITE → FIGHTING → IDLE
                    ↓                  ↓
                (timeout)        (catch/break/escape)
```

## FishState (при вываживании)

| Состояние | Описание | Действие игрока |
|-----------|----------|-----------------|
| PASSIVE | Рыба устала | Подматывать |
| ACTIVE | Сопротивляется | Держать натяжение |
| RUSH | Рывок | Отпустить фрикцион! |
| EXHAUSTED | Выдохлась | Вытягивать |

## FightEngine параметры

| Параметр | Диапазон | Описание |
|----------|----------|----------|
| line_tension | 0-100 | Натяжение лески |
| fish_stamina | 0-100 | Выносливость рыбы |
| fish_distance | 0-line_length | Дистанция до рыбы |
| line_health | 0-100 | Износ лески |
| drag_level | 0-1 | Уровень фрикциона |

## Условия завершения

**Победа:**
- fish_distance ≤ 1м И fish_stamina < 20

**Поражение:**
- line_tension ≥ 100 → обрыв
- line_health ≤ 0 → износ
- fish_distance > line_length × 0.9 → уплыла

## WebSocket протокол

### Client → Server

```json
{"type": "join", "location_id": 1}
{"type": "cast", "power": 0.8, "angle": 45}
{"type": "hook"}
{"type": "reel", "speed": 0.5}
{"type": "release"}
{"type": "set_drag", "level": 0.7}
{"type": "hold"}
```

### Server → Client

```json
{"type": "joined", "session": {...}}
{"type": "cast_result", "distance": 25, "depth": 5}
{"type": "bite", "fish": "Карп", "intensity": 0.6}
{"type": "fight_started", "fish": "Карп", "weight": 2.5}
{"type": "fight_update", "state": {
    "fish_state": "active",
    "fish_stamina": 78,
    "fish_distance": 15,
    "fish_direction": -30,
    "line_tension": 45,
    "line_health": 95,
    "drag_level": 0.5,
    "is_critical": false
}}
{"type": "catch", "result": {
    "success": true,
    "fish_name": "Карп",
    "weight": 2.5,
    "price": 500,
    "experience": 150,
    "leveled_up": false,
    "achievements": []
}}
{"type": "error", "message": "..."}
```

## FishAI логика

Поведение рыбы зависит от:
- **strength** - сила сопротивления
- **stamina** - как долго может сопротивляться
- **aggressiveness** - частота рывков

Рывок (RUSH) провоцируется:
- Высокое натяжение (> 70)
- Высокая агрессивность рыбы
- Попытка подмотки в неподходящий момент

## Ключевые файлы

- `fight_engine.py:FightEngine` - ядро механики
- `fish_ai.py:FishAI` - поведение рыбы
- `consumers.py:GameConsumer` - WebSocket обработчик
