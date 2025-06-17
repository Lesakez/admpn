const express = require('express');
const phoneController = require('../controllers/phoneController');
const { validatePhone } = require('../validators/phoneValidator');

const router = express.Router();

// GET /api/phones - получить список телефонов
router.get('/', phoneController.getPhones);

// GET /api/phones/stats - статистика телефонов
router.get('/stats', phoneController.getPhoneStats);

// GET /api/phones/:id - получить телефон по ID
router.get('/:id', phoneController.getPhone);

// POST /api/phones - создать новый телефон
router.post('/', validatePhone, phoneController.createPhone);

// PUT /api/phones/:id - обновить телефон
router.put('/:id', validatePhone, phoneController.updatePhone);

// DELETE /api/phones/:id - удалить телефон
router.delete('/:id', phoneController.deletePhone);

// POST /api/phones/:id/toggle-status - переключить статус телефона
router.post('/:id/toggle-status', phoneController.togglePhoneStatus);

// POST /api/phones/:id/reboot - перезагрузить телефон
router.post('/:id/reboot', phoneController.rebootPhone);

module.exports = router;