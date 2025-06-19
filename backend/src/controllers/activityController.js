const { Activity } = require('../models');
const { Op } = require('sequelize');

const activityController = {
  // Получить последнюю активность
  getRecentActivity: async (req, res) => {
    try {
      const {
        limit = 50,
        offset = 0,
        entityType,
        actionType,
        entityId,
        userId,
        startDate,
        endDate
      } = req.query;

      const where = {};

      // Фильтры
      if (entityType) where.entityType = entityType;
      if (actionType) where.actionType = actionType;
      if (entityId) where.entityId = entityId;
      if (userId) where.userId = userId;

      // Фильтр по дате
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp[Op.gte] = new Date(startDate);
        if (endDate) where.timestamp[Op.lte] = new Date(endDate);
      }

      const activities = await Activity.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: [
          'id',
          'timestamp',
          'description',
          'entityType',
          'entityId',
          'actionType',
          'userId',
          'createdAt'
        ]
      });

      res.json({
        success: true,
        data: activities,
        count: activities.length
      });
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch activity data',
        message: error.message
      });
    }
  },

  // Получить активность по сущности
  getActivityByEntity: async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const { 
        limit = 50, 
        offset = 0,
        actionType,
        startDate,
        endDate
      } = req.query;

      const where = {
        entityType,
        entityId
      };

      if (actionType) where.actionType = actionType;

      // Фильтр по дате
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp[Op.gte] = new Date(startDate);
        if (endDate) where.timestamp[Op.lte] = new Date(endDate);
      }

      const activities = await Activity.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: activities,
        count: activities.length,
        entityType,
        entityId
      });
    } catch (error) {
      console.error('Error fetching activity by entity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch entity activity',
        message: error.message
      });
    }
  },

  // Получить статистику активности
  getActivityStats: async (req, res) => {
    try {
      const { period = '7d' } = req.query;

      // Определяем начальную дату на основе периода
      let startDate = new Date();
      switch (period) {
        case '1d':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      // Общая статистика
      const totalCount = await Activity.count({
        where: {
          timestamp: {
            [Op.gte]: startDate
          }
        }
      });

      // Статистика по типам действий
      const actionStats = await Activity.findAll({
        attributes: [
          'actionType',
          [Activity.sequelize.fn('COUNT', Activity.sequelize.col('actionType')), 'count']
        ],
        where: {
          timestamp: {
            [Op.gte]: startDate
          }
        },
        group: ['actionType'],
        order: [[Activity.sequelize.fn('COUNT', Activity.sequelize.col('actionType')), 'DESC']],
        raw: true
      });

      // Статистика по типам сущностей
      const entityStats = await Activity.findAll({
        attributes: [
          'entityType',
          [Activity.sequelize.fn('COUNT', Activity.sequelize.col('entityType')), 'count']
        ],
        where: {
          timestamp: {
            [Op.gte]: startDate
          }
        },
        group: ['entityType'],
        order: [[Activity.sequelize.fn('COUNT', Activity.sequelize.col('entityType')), 'DESC']],
        raw: true
      });

      // Активность по дням (для графика)
      const dailyStats = await Activity.findAll({
        attributes: [
          [Activity.sequelize.fn('DATE', Activity.sequelize.col('timestamp')), 'date'],
          [Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'count']
        ],
        where: {
          timestamp: {
            [Op.gte]: startDate
          }
        },
        group: [Activity.sequelize.fn('DATE', Activity.sequelize.col('timestamp'))],
        order: [[Activity.sequelize.fn('DATE', Activity.sequelize.col('timestamp')), 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        data: {
          period,
          totalCount,
          actionStats: actionStats.map(item => ({
            actionType: item.actionType,
            count: parseInt(item.count)
          })),
          entityStats: entityStats.map(item => ({
            entityType: item.entityType,
            count: parseInt(item.count)
          })),
          dailyStats: dailyStats.map(item => ({
            date: item.date,
            count: parseInt(item.count)
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch activity statistics',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Создать новую запись активности
  createActivity: async (entityType, entityId, actionType, description, userId = null, metadata = null) => {
    try {
      const activity = await Activity.create({
        timestamp: new Date(),
        description,
        entityType,
        entityId,
        actionType,
        userId,
        createdAt: new Date()
      });

      return activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }
};

module.exports = activityController;