FROM node:16-alpine AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код и собираем приложение
COPY . .
RUN npm run build

FROM node:16-alpine as production
WORKDIR /app

# Устанавливаем pm2 глобально
RUN npm install -g pm2

# Копируем файлы package*.json из builder
COPY --from=builder /app/package*.json ./
# Устанавливаем только зависимости, необходимые в продакшене
RUN npm install --omit=dev

# Копируем директорию со сборкой приложения
COPY --from=builder /app/dist ./dist/

# Указываем команду для запуска приложения с использованием pm2
CMD ["pm2-runtime", "./dist/main.js"]