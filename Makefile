.PHONY: help build up down restart logs shell migrate makemigrations createsuperuser loaddata test lint clean

# Цвета для вывода
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Показать справку
	@echo "$(GREEN)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# ===================
# Docker команды
# ===================

build: ## Собрать все контейнеры
	docker-compose build

up: ## Запустить все сервисы (frontend + backend + db + redis)
	docker-compose up -d
	@echo "$(GREEN)Сервисы запущены:$(NC)"
	@echo "  Frontend: http://localhost:5173"
	@echo "  Backend API: http://localhost:8000/api/docs"
	@echo "  Admin: http://localhost:8000/admin"

up-logs: ## Запустить все сервисы с логами
	docker-compose up

down: ## Остановить все сервисы
	docker-compose down

restart: ## Перезапустить все сервисы
	docker-compose restart

logs: ## Показать логи всех сервисов
	docker-compose logs -f

logs-backend: ## Показать логи backend
	docker-compose logs -f backend

logs-frontend: ## Показать логи frontend
	docker-compose logs -f frontend

# ===================
# Разработка (только БД)
# ===================

dev-db: ## Запустить только PostgreSQL и Redis для локальной разработки
	docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)БД запущена:$(NC)"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis: localhost:6379"

dev-db-down: ## Остановить БД
	docker-compose -f docker-compose.dev.yml down

# ===================
# Django команды
# ===================

migrate: ## Применить миграции
	docker-compose exec backend python manage.py migrate

makemigrations: ## Создать миграции
	docker-compose exec backend python manage.py makemigrations

makemigrations-app: ## Создать миграции для конкретного приложения (usage: make makemigrations-app APP=users)
	docker-compose exec backend python manage.py makemigrations $(APP)

showmigrations: ## Показать статус миграций
	docker-compose exec backend python manage.py showmigrations

createsuperuser: ## Создать суперпользователя
	docker-compose exec backend python manage.py createsuperuser

loaddata: ## Загрузить начальные данные
	docker-compose exec backend python manage.py loaddata fixtures/initial_data.json

shell: ## Открыть Django shell
	docker-compose exec backend python manage.py shell

shell-db: ## Открыть PostgreSQL shell
	docker-compose exec db psql -U postgres -d fishing_game

# ===================
# Локальная разработка (без Docker для кода)
# ===================

run-backend: ## Запустить backend локально (требует dev-db)
	cd backend && python manage.py runserver

run-backend-ws: ## Запустить backend с WebSocket локально (требует dev-db)
	cd backend && daphne -b 0.0.0.0 -p 8000 fishing_game.asgi:application

run-frontend: ## Запустить frontend локально
	cd frontend && npm run dev

# ===================
# Первоначальная настройка
# ===================

init: ## Первоначальная настройка проекта (build + migrate + loaddata)
	@echo "$(GREEN)Сборка контейнеров...$(NC)"
	docker-compose build
	@echo "$(GREEN)Запуск сервисов...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Ожидание запуска БД...$(NC)"
	sleep 5
	@echo "$(GREEN)Применение миграций...$(NC)"
	docker-compose exec backend python manage.py migrate
	@echo "$(GREEN)Загрузка начальных данных...$(NC)"
	docker-compose exec backend python manage.py loaddata fixtures/initial_data.json
	@echo "$(GREEN)Готово! Создайте суперпользователя командой: make createsuperuser$(NC)"

init-local: ## Настройка для локальной разработки
	@echo "$(GREEN)Запуск БД...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d
	sleep 3
	@echo "$(GREEN)Установка зависимостей backend...$(NC)"
	cd backend && pip install -r requirements.txt
	@echo "$(GREEN)Применение миграций...$(NC)"
	cd backend && python manage.py migrate
	@echo "$(GREEN)Загрузка данных...$(NC)"
	cd backend && python manage.py loaddata fixtures/initial_data.json
	@echo "$(GREEN)Установка зависимостей frontend...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)Готово!$(NC)"
	@echo "  Запуск backend: make run-backend-ws"
	@echo "  Запуск frontend: make run-frontend"

# ===================
# Утилиты
# ===================

clean: ## Очистить Docker (контейнеры, volumes, images)
	docker-compose down -v --rmi local
	docker system prune -f

clean-pyc: ## Очистить Python кэш
	find . -type f -name "*.py[co]" -delete
	find . -type d -name "__pycache__" -delete

status: ## Показать статус контейнеров
	docker-compose ps

# ===================
# Тестирование
# ===================

test: ## Запустить тесты backend
	docker-compose exec backend pytest

test-local: ## Запустить тесты локально
	cd backend && pytest

# ===================
# Frontend
# ===================

npm-install: ## Установить npm зависимости
	docker-compose exec frontend npm install

npm-build: ## Собрать frontend для production
	docker-compose exec frontend npm run build
