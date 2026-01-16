# Fishing Game

Браузерная игра-рыбалка с механикой вываживания как в "Русской Рыбалке 4".

## Технологии

- **Backend**: Django 5 + Django Ninja (API) + Django Channels (WebSocket)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Инфраструктура**: Docker Compose, PostgreSQL, Redis, Nginx

## Быстрый старт

### Первый запуск (Docker)

```bash
# Инициализация проекта (сборка, миграции, загрузка данных)
make init

# Создать администратора
make createsuperuser
```

После запуска:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/docs
- Admin: http://localhost:8000/admin

### Основные команды

```bash
make help           # Показать все команды

# Docker
make up             # Запустить все сервисы
make down           # Остановить
make restart        # Перезапустить
make logs           # Логи всех сервисов
make logs-backend   # Логи backend
make logs-frontend  # Логи frontend
make status         # Статус контейнеров

# Миграции
make migrate            # Применить миграции
make makemigrations     # Создать миграции
make makemigrations-app APP=users  # Создать для конкретного приложения
make showmigrations     # Показать статус миграций

# Django
make createsuperuser    # Создать суперпользователя
make loaddata           # Загрузить начальные данные
make shell              # Django shell
make shell-db           # PostgreSQL shell

# Сборка
make build          # Пересобрать контейнеры
make clean          # Очистить Docker (удалить volumes)
```

### Локальная разработка (без Docker для кода)

```bash
# Запустить только БД
make dev-db

# Инициализация
make init-local

# В отдельных терминалах:
make run-backend-ws   # Backend с WebSocket
make run-frontend     # Frontend
```

## Структура проекта

```
├── backend/
│   ├── apps/
│   │   ├── users/        # Пользователи и профили
│   │   ├── fishing/      # Рыба, локации, расчёт поклёвки
│   │   ├── equipment/    # Удочки, катушки, лески, наживки
│   │   ├── inventory/    # Инвентарь игрока
│   │   ├── progression/  # Уровни, достижения, статистика
│   │   └── game/         # WebSocket, механика вываживания
│   ├── core/             # Базовые классы и исключения
│   ├── docs/             # Документация по модулям
│   └── fixtures/         # Начальные данные
│
├── frontend/
│   ├── src/
│   │   ├── api/          # API клиент
│   │   ├── components/   # React компоненты
│   │   ├── hooks/        # WebSocket и игровые хуки
│   │   ├── store/        # Zustand stores
│   │   └── pages/        # Страницы приложения
│   └── docs/             # Документация frontend
│
├── Makefile              # Make команды
├── docker-compose.yml    # Полный стек
└── docker-compose.dev.yml # Только БД и Redis
```

## Игровая механика

### Состояния игры
```
IDLE → CASTING → WAITING → BITE → FIGHTING → IDLE
```

### Вываживание

Состояния рыбы:
- **Passive** - можно подматывать
- **Active** - сопротивляется, держать натяжение
- **Rush** - рывок, срочно отпустить!
- **Exhausted** - вытягивать

Параметры:
- `line_tension` (0-100) - натяжение лески
- `fish_stamina` (0-100) - выносливость рыбы
- `fish_distance` (0-max) - дистанция до рыбы

Победа: `distance ≤ 1м` && `stamina < 20`

Проигрыш: `tension ≥ 100` (обрыв) или `distance > line_length`

## API

### REST API
- `POST /api/token/pair` - получение JWT токена
- `GET /api/users/me` - профиль пользователя
- `GET /api/fishing/locations` - список локаций
- `GET /api/equipment/*` - снаряжение
- `GET /api/inventory/*` - инвентарь
- `GET /api/progression/*` - достижения и статистика

### WebSocket `/ws/game/`
```javascript
// Отправка
{type: "join", location_id: 1}
{type: "cast", power: 0.8, angle: 45}
{type: "hook"}
{type: "reel", speed: 0.5}
{type: "release"}
{type: "set_drag", level: 0.7}

// Получение
{type: "bite", fish: "Карп", intensity: 0.6}
{type: "fight_update", state: {...}}
{type: "catch", result: {...}}
```

## Документация

- `backend/docs/architecture.md` - архитектура backend
- `backend/docs/game.md` - механика вываживания
- `backend/docs/fishing.md` - модуль рыбалки
- `backend/docs/equipment.md` - снаряжение
- `frontend/docs/frontend.md` - документация frontend
