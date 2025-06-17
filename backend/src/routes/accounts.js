const express = require('express');
const accountController = require('../controllers/accountController');
const { validateAccount, validateAccountUpdate } = require('../validators/accountValidator');

const router = express.Router();

// GET /api/accounts - получить список аккаунтов
router.get('/', accountController.getAccounts);

// GET /api/accounts/stats - статистика аккаунтов
router.get('/stats', accountController.getAccountStats);

// GET /api/accounts/:id - получить аккаунт по ID
router.get('/:id', accountController.getAccount);

// POST /api/accounts - создать новый аккаунт
router.post('/', validateAccount, accountController.createAccount);

// PUT /api/accounts/:id - обновить аккаунт
router.put('/:id', validateAccountUpdate, accountController.updateAccount);

// DELETE /api/accounts/:id - удалить аккаунт
router.delete('/:id', accountController.deleteAccount);

// POST /api/accounts/:id/status - изменить статус аккаунта
router.post('/:id/status', accountController.changeAccountStatus);

// POST /api/accounts/import-text - импорт аккаунтов из текста
router.post('/import-text', accountController.importAccountsFromText);

// POST /api/accounts/bulk-delete - массовое удаление
router.post('/bulk-delete', accountController.bulkDeleteAccounts);

// POST /api/accounts/bulk-update-status - массовое обновление статуса
router.post('/bulk-update-status', accountController.bulkUpdateStatus);

// GET /api/accounts/export-json - экспорт в JSON
router.get('/export-json', accountController.exportAccountsJSON);

// GET /api/accounts/export-csv - экспорт в CSV
router.get('/export-csv', accountController.exportAccountsCSV);

// GET /api/accounts/export-txt - экспорт в TXT
router.get('/export-txt', accountController.exportAccountsTXT);

// POST /api/accounts/export-custom - кастомный экспорт
router.post('/export-custom', accountController.exportAccountsCustom);

module.exports = router;