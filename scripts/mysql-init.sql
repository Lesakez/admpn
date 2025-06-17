-- Инициализация базы данных AdminPanel
CREATE DATABASE IF NOT EXISTS adminpanel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE adminpanel;

-- Создание пользователя если не существует
CREATE USER IF NOT EXISTS 'adminpanel'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON adminpanel.* TO 'adminpanel'@'%';
FLUSH PRIVILEGES;

-- Создание стокового проекта
INSERT IGNORE INTO projects (id, name, transliterate_name, description, created_at, updated_at) 
VALUES 
(1, 'Стоковый проект', 'stock', 'Проект по умолчанию для всех ресурсов', NOW(), NOW()),
(2, 'Все проекты', 'all', 'Универсальный проект для всех операций', NOW(), NOW());

-- Создание тестовых данных для разработки
INSERT IGNORE INTO old_accounts (login, password, email, status, source, created_at, updated_at)
VALUES 
('test_user1', 'password123', 'test1@example.com', 'active', 'manual', NOW(), NOW()),
('test_user2', 'password456', 'test2@example.com', 'inactive', 'import', NOW(), NOW()),
('test_user3', 'password789', 'test3@example.com', 'free', 'api', NOW(), NOW());

-- Создание тестовых прокси
INSERT IGNORE INTO proxies (type, ip_port, login, password, status, country, project_id, created_at, updated_at)
VALUES 
('socks5', '127.0.0.1:1080', 'proxy_user', 'proxy_pass', 'free', 'US', 1, NOW(), NOW()),
('http', '127.0.0.1:8080', 'http_user', 'http_pass', 'free', 'UK', 1, NOW(), NOW());

-- Создание тестовых телефонов
INSERT IGNORE INTO phones (model, device, android_version, status, project_id, created_at, updated_at)
VALUES 
('Samsung Galaxy S21', 'SM-G991B', '11', 'free', 1, NOW(), NOW()),
('Google Pixel 6', 'GR1YH', '12', 'free', 1, NOW(), NOW());

-- Создание тестовых профилей
INSERT IGNORE INTO profiles (profile_id, name, folder_name, workspace_id, workspace_name, proxy, status, created_at, updated_at)
VALUES 
('profile_001', 'Test Profile 1', 'Test Folder', 'ws_001', 'Test Workspace', 'socks5://127.0.0.1:1080', 'created', NOW(), NOW()),
('profile_002', 'Test Profile 2', 'Test Folder', 'ws_001', 'Test Workspace', 'http://127.0.0.1:8080', 'active', NOW(), NOW());