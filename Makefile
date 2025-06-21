.PHONY: help up down migrate migrate-create logs clean restart status

help: ## Показать это сообщение помощи
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Запустить все сервисы с автоматическими миграциями
	@echo "🚀 Запуск AdminPanel с автоматическими миграциями..."
	docker-compose -f docker-compose.migrations.yml up -d
	@echo "✅ Сервисы запущены!"
	@echo "📊 Frontend: http://localhost:3001"
	@echo "🔧 Backend: http://localhost:3000"
	@echo "🗄️  Adminer: http://localhost:8080"

down: ## Остановить все сервисы
	@echo "⏹️  Остановка всех сервисов..."
	docker-compose -f docker-compose.migrations.yml down
	@echo "✅ Все сервисы остановлены"

restart: ## Перезапустить все сервисы
	@echo "🔄 Перезапуск сервисов..."
	$(MAKE) down
	$(MAKE) up

migrate: ## Запустить только миграции
	@echo "🔄 Выполнение миграций..."
	docker-compose -f docker-compose.migrations.yml up migration-runner
	@echo "✅ Миграции выполнены"

migrate-create: ## Создать новую миграцию (используйте: make migrate-create NAME=название_миграции)
	@if [ -z "$(NAME)" ]; then \
		echo "❌ Необходимо указать имя миграции: make migrate-create NAME=название_миграции"; \
		exit 1; \
	fi
	@TIMESTAMP=$(date +%Y%m%d_%H%M%S); \
	FILENAME="backend/database/migrations/${TIMESTAMP}_$(NAME).sql"; \
	echo "-- ============================================================================" > $$FILENAME; \
	echo "-- Миграция: $(NAME)" >> $$FILENAME; \
	echo "-- Создана: $$(date)" >> $$FILENAME; \
	echo "-- ============================================================================" >> $$FILENAME; \
	echo "" >> $$FILENAME; \
	echo "-- Отключаем проверки внешних ключей временно" >> $$FILENAME; \
	echo "SET FOREIGN_KEY_CHECKS = 0;" >> $$FILENAME; \
	echo "" >> $$FILENAME; \
	echo "-- Добавьте ваши изменения БД здесь" >> $$FILENAME; \
	echo "" >> $$FILENAME; \
	echo "-- Включаем обратно проверки внешних ключей" >> $$FILENAME; \
	echo "SET FOREIGN_KEY_CHECKS = 1;" >> $$FILENAME; \
	echo "✅ Создана миграция: $$FILENAME"

logs: ## Показать логи всех сервисов
	docker-compose -f docker-compose.migrations.yml logs -f

logs-backend: ## Показать логи только backend
	docker-compose -f docker-compose.migrations.yml logs -f backend

logs-mysql: ## Показать логи MySQL
	docker-compose -f docker-compose.migrations.yml logs -f mysql

logs-migration: ## Показать логи миграций
	docker-compose -f docker-compose.migrations.yml logs migration-runner

status: ## Показать статус всех сервисов
	@echo "📊 Статус сервисов AdminPanel:"
	@docker-compose -f docker-compose.migrations.yml ps

clean: ## Удалить все контейнеры и volumes (ОСТОРОЖНО!)
	@echo "⚠️  ВНИМАНИЕ: Это удалит ВСЕ данные!"
	@read -p "Вы уверены? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "🗑️  Удаление контейнеров и данных..."; \
		docker-compose -f docker-compose.migrations.yml down -v; \
		docker system prune -f; \
		echo "✅ Очистка завершена"; \
	else \
		echo "❌ Операция отменена"; \
	fi

backup-db: ## Создать бэкап базы данных
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	BACKUP_FILE="backup_adminpanel_$$TIMESTAMP.sql"; \
	echo "💾 Создание бэкапа базы данных..."; \
	docker exec adminpanel_mysql_dev mysqldump -u adminpanel -ppassword adminpanel > $$BACKUP_FILE; \
	echo "✅ Бэкап создан: $$BACKUP_FILE"

restore-db: ## Восстановить базу данных из бэкапа (используйте: make restore-db FILE=backup_file.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "❌ Необходимо указать файл бэкапа: make restore-db FILE=backup_file.sql"; \
		exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "❌ Файл $(FILE) не найден"; \
		exit 1; \
	fi
	@echo "🔄 Восстановление базы данных из $(FILE)..."
	@docker exec -i adminpanel_mysql_dev mysql -u adminpanel -ppassword adminpanel < $(FILE)
	@echo "✅ База данных восстановлена"

shell-backend: ## Подключиться к контейнеру backend
	docker exec -it adminpanel_backend_dev sh

shell-mysql: ## Подключиться к MySQL
	docker exec -it adminpanel_mysql_dev mysql -u adminpanel -ppassword adminpanel

build: ## Пересобрать все образы
	@echo "🔨 Пересборка образов..."
	docker-compose -f docker-compose.migrations.yml build --no-cache
	@echo "✅ Образы пересобраны"

update: ## Обновить проект (git pull + restart)
	@echo "🔄 Обновление проекта..."
	git pull
	$(MAKE) down
	$(MAKE) build
	$(MAKE) up
	@echo "✅ Проект обновлен"