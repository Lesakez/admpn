const express = require('express');
const activityController = require('../controllers/activityController');

const router = express.Router();

// GET /api/activity - получить последнюю активность
router.get('/', activityController.getRecentActivity);

// GET /api/activity/stats - статистика активности
router.get('/stats', activityController.getActivityStats);

// GET /api/activity/:entityType/:entityId - активность по сущности  
router.get('/:entityType/:entityId', activityController.getActivityByEntity);

// POST /api/activity - создать новую запись активности (для тестирования)
router.post('/', async (req, res) => {
  try {
    const { entityType, entityId, actionType, description, userId } = req.body;
    
    if (!entityType || !entityId || !actionType || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: entityType, entityId, actionType, description'
      });
    }

    const activity = await activityController.createActivity(
      entityType,
      entityId,
      actionType,
      description,
      userId
    );

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create activity',
      message: error.message
    });
  }
});

module.exports = router;