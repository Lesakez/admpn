// backend/src/routes/accounts.js
const express = require('express');
const accountController = require('../controllers/accountController');
const { validateAccount, validateAccountUpdate } = require('../validators/accountValidator');

const router = express.Router();

// НОВЫЕ РОУТЫ для конфигурации импорта/экспорта (должны быть ПЕРЕД динамическими)
router.get('/import/config', accountController.getImportConfig);
router.get('/export/config', accountController.getExportConfig);
router.get('/export/fields', accountController.getExportFields);

// GET /api/accounts/fields - получить поля аккаунтов для фильтрации (старый метод)
router.get('/fields', accountController.getAccountFields);

// GET /api/accounts/stats - статистика аккаунтов
router.get('/stats', accountController.getAccountStats);

// Экспорт (старые роуты для совместимости)
router.get('/export/json', accountController.exportAccountsJSON);
router.get('/export/csv', accountController.exportAccountsCSV);
router.get('/export/txt', accountController.exportAccountsTXT);

// Новый универсальный роут экспорта
router.post('/export', accountController.exportAccounts);

// GET /api/accounts - получить список аккаунтов
router.get('/', accountController.getAccounts);

// GET /api/accounts/:id/full - получить полные данные аккаунта (включая пароль)
router.get('/:id/full', accountController.getAccountWithPassword);

// GET /api/accounts/:id - получить аккаунт по ID (без пароля)
router.get('/:id', accountController.getAccount);

// POST /api/accounts - создать новый аккаунт
router.post('/', validateAccount, accountController.createAccount);

// POST /api/accounts/import-text - импорт аккаунтов из текста
router.post('/import-text', accountController.importAccountsFromText);

// POST /api/accounts/bulk-delete - массовое удаление
router.post('/bulk-delete', accountController.bulkDeleteAccounts);

// POST /api/accounts/bulk-update-status - массовое обновление статуса
router.post('/bulk-update-status', accountController.bulkUpdateStatus);

// POST /api/accounts/export/custom - кастомный экспорт (старый роут)
router.post('/export/custom', accountController.exportAccountsCustom);

// POST /api/accounts/:id/status - изменить статус аккаунта
router.post('/:id/status', accountController.changeAccountStatus);

// PUT /api/accounts/:id - обновить аккаунт
router.put('/:id', validateAccountUpdate, accountController.updateAccount);

// DELETE /api/accounts/:id - удалить аккаунт
router.delete('/:id', accountController.deleteAccount);

module.exports = router;