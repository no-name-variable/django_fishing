FROM node:20-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем остальной код
COPY . .

EXPOSE 5173

# Запуск dev сервера
CMD ["npm", "run", "dev"]
