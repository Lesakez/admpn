const express = require('express');
const activityController = require('../controllers/activityController');

const router = express.Router();

// GET /api/activity - получить последнюю активность
router.get('/', activityController.getRecentActivity);

// GET /api/activity/stats - статистика активности
router.get('/stats', activityController.getActivityStats);

// GET /api/activity/:entityType/:entityId - активность по сущности
router.get('/:entityType/:entityId', activityController.getActivityByEntity);

module.exports = router;