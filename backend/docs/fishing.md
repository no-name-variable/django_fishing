# Модуль Fishing

## Модели

### Location
Локация для рыбалки.

| Поле | Тип | Описание |
|------|-----|----------|
| name | CharField | Название |
| description | TextField | Описание |
| image | ImageField | Изображение |
| max_depth | FloatField | Максимальная глубина (м) |
| required_level | PositiveIntegerField | Требуемый уровень |
| is_active | BooleanField | Активна ли локация |

### Fish
Вид рыбы.

| Поле | Тип | Описание |
|------|-----|----------|
| name | CharField | Название |
| min_weight / max_weight | FloatField | Диапазон веса (кг) |
| rarity | Enum | common/uncommon/rare/epic/legendary |
| base_price | PositiveIntegerField | Цена за кг |
| strength | 1-100 | Сила сопротивления |
| stamina | 1-100 | Выносливость |
| aggressiveness | 1-100 | Частота рывков |
| depth_min / depth_max | FloatField | Диапазон глубин |
| active_from / active_until | int | Часы активности (0-24) |

### FishBaitPreference
Связь рыба-наживка с уровнем привлекательности (0-100).

### CatchRecord
Запись о пойманной рыбе (игрок, рыба, локация, вес, цена, опыт).

## Сервисы

### BiteCalculator
```python
BiteCalculator(location, bait, cast_distance, depth)
  .calculate_bite() -> BiteResult
```

Факторы расчёта:
- Редкость рыбы (rare = меньше шанс)
- Привлекательность наживки (FishBaitPreference)
- Совпадение глубины
- Время суток (active_from/until)

### FishingService
```python
FishingService(user)
  .record_catch(fish, location, weight) -> CatchResult
  .get_available_locations() -> list[Location]
```

## API Endpoints

- `GET /api/fishing/locations` - список доступных локаций
- `GET /api/fishing/locations/{id}/fish` - рыба в локации
- `GET /api/fishing/catches` - история уловов игрока
