// backend/src/routes/phones.js

const express = require('express');
const phoneController = require('../controllers/phoneController');
const { validatePhone } = require('../validators/phoneValidator');

const router = express.Router();

// Существующие роуты
router.get('/', phoneController.getPhones);
router.get('/stats', phoneController.getPhoneStats);
router.get('/:id', phoneController.getPhone);
router.post('/', validatePhone, phoneController.createPhone);
router.put('/:id', validatePhone, phoneController.updatePhone);
router.delete('/:id', phoneController.deletePhone);
router.post('/:id/toggle-status', phoneController.togglePhoneStatus);
router.post('/:id/reboot', phoneController.rebootPhone);

// НОВЫЕ РОУТЫ для импорта/экспорта

// Конфигурация импорта/экспорта
router.get('/import/config', phoneController.getImportConfig);
router.get('/export/config', phoneController.getExportConfig);
router.get('/export/fields', phoneController.getExportFields);

// Импорт
router.post('/import/text', phoneController.importPhonesFromText);

// Экспорт
router.post('/export', phoneController.exportPhones);
router.get('/export/csv', phoneController.exportPhonesCSV);
router.get('/export/json', phoneController.exportPhonesJSON);
router.get('/export/txt', phoneController.exportPhonesTXT);

// Массовые операции (если еще не добавлены)
router.post('/bulk-delete', phoneController.bulkDeletePhones);
router.post('/bulk-update-status', phoneController.bulkUpdateStatus);

module.exports = router;