const express = require('express');
const configController = require('../controllers/configController');

const router = express.Router();

// GET /api/config/statuses - получить полную конфигурацию статусов
router.get('/statuses', configController.getStatusConfig);

// GET /api/config/statuses/:entityType - получить статусы для сущности
router.get('/statuses/:entityType', configController.getEntityStatuses);

// POST /api/config/statuses/validate - валидировать статус
router.post('/statuses/validate', configController.validateStatus);

// POST /api/config/statuses/validate-transition - проверить переход
router.post('/statuses/validate-transition', configController.validateStatusTransition);

// GET /api/config/statuses/:entityType/:status/transitions - доступные переходы
router.get('/statuses/:entityType/:status/transitions', configController.getAvailableTransitions);

// GET /api/config/statuses/stats - статистика по статусам
router.get('/statuses/stats', configController.getStatusStats);

module.exports = router;