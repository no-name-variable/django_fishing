# Модуль Equipment

## Модели

### Rod (Удочка)
| Поле | Тип | Описание |
|------|-----|----------|
| name | CharField | Название |
| tier | Enum | basic/amateur/professional/expert/master |
| power | 1-100 | Контроль крупной рыбы |
| sensitivity | 1-100 | Обнаружение поклёвки |
| max_line_weight | FloatField | Макс. тест лески (кг) |
| cast_distance_bonus | int | Бонус дальности (%) |
| price | int | Цена |
| required_level | int | Требуемый уровень |
| durability | int | Прочность |

### Reel (Катушка)
| Поле | Тип | Описание |
|------|-----|----------|
| gear_ratio | float | Передаточное число (5.2:1) |
| drag_power | float | Сила фрикциона (кг) |
| line_capacity | int | Вместимость лески (м) |
| retrieve_speed | 1-100 | Скорость подмотки |

### Line (Леска)
| Поле | Тип | Описание |
|------|-----|----------|
| breaking_strength | float | Разрывная нагрузка (кг) |
| visibility | 1-100 | Заметность (ниже = лучше) |
| stretch | 1-100 | Растяжимость |
| length | int | Длина (м) |

### Bait (Наживка)
| Поле | Тип | Описание |
|------|-----|----------|
| bait_type | Enum | live/artificial/dough/natural |
| uses | int | Количество забросов |
| attraction_bonus | int | Бонус привлекательности (%) |
| is_consumable | bool | Расходуемая |

## Влияние на геймплей

- **power** удочки влияет на скорость утомления рыбы
- **sensitivity** влияет на видимость индикатора поклёвки
- **gear_ratio** и **retrieve_speed** влияют на скорость подмотки
- **drag_power** - максимальное натяжение без обрыва
- **breaking_strength** лески - при превышении = обрыв
- **visibility** лески снижает шанс поклёвки

## API Endpoints

- `GET /api/equipment/rods` - список удочек
- `GET /api/equipment/reels` - список катушек
- `GET /api/equipment/lines` - список лесок
- `GET /api/equipment/baits` - список наживок

Параметр `available_only=true` фильтрует по уровню игрока.
