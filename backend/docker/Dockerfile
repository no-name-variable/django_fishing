FROM python:3.12-slim

WORKDIR /app

# Системные зависимости
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Зависимости Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Код приложения
COPY . .

# Порт
EXPOSE 8000

# Запуск через daphne (ASGI сервер)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "fishing_game.asgi:application"]
