# Dockerfile для продакшена
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем PM2 глобально
RUN npm install -g pm2

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --only=production && npm cache clean --force

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Копируем исходный код
COPY --chown=nodejs:nodejs . .

# Создаем директорию для логов
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Переключаемся на пользователя nodejs
USER nodejs

# Открываем порт
EXPOSE 3000

# Запускаем через PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]