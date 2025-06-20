const { Activity } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const activityController = {
  // Получить последнюю активность
  getRecentActivity: async (req, res) => {
    try {
      // Проверяем, что модель Activity доступна
      if (!Activity) {
        return res.status(500).json({
          success: false,
          error: 'Activity model not available'
        });
      }

      const { 
        limit = 50, 
        offset = 0, 
        entityType, 
        entityId, 
        actionType, 
        search,
        startDate,
        endDate 
      } = req.query;

      const where = {};

      // Фильтры
      if (entityType) where.entityType = entityType;
      if (entityId) where.entityId = entityId;
      if (actionType) where.actionType = actionType;
      if (search) {
        where.description = {
          [Op.like]: `%${search}%`
        };
      }

      // Фильтр по дате
      if (startDate || endDate) {
        where[Op.or] = [];
        
        if (startDate || endDate) {
          const timestampCondition = {};
          const createdAtCondition = {};
          
          if (startDate) {
            timestampCondition[Op.gte] = new Date(startDate);
            createdAtCondition[Op.gte] = new Date(startDate);
          }
          if (endDate) {
            timestampCondition[Op.lte] = new Date(endDate);
            createdAtCondition[Op.lte] = new Date(endDate);
          }
          
          where[Op.or].push(
            { timestamp: timestampCondition },
            { createdAt: createdAtCondition }
          );
        }
      }

      const activities = await Activity.findAll({
        where,
        order: [
          ['timestamp', 'DESC'],
          ['createdAt', 'DESC'],
          ['id', 'DESC']
        ],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: activities,
        count: activities.length
      });
    } catch (error) {
      logger.error('Error fetching recent activity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recent activity',
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
      // Проверяем, что модель Activity доступна
      if (!Activity) {
        return res.status(500).json({
          success: false,
          error: 'Activity model not available'
        });
      }

      const { period = '7d' } = req.query;

      // Определяем начальную дату на основе периода
      let startDate = new Date();
      switch (period) {
        case '1d':
          startDate.setUTCHours(0, 0, 0, 0);
          startDate.setUTCDate(startDate.getUTCDate() - 1);
          break;
        case '7d':
          startDate.setUTCHours(0, 0, 0, 0);
          startDate.setUTCDate(startDate.getUTCDate() - 7);
          break;
        case '30d':
          startDate.setUTCHours(0, 0, 0, 0);
          startDate.setUTCDate(startDate.getUTCDate() - 30);
          break;
        default:
          startDate.setUTCHours(0, 0, 0, 0);
          startDate.setUTCDate(startDate.getUTCDate() - 7);
      }

      // Общая статистика за период - используем простое условие без Op.or
      const totalCount = await Activity.count({
        where: {
          createdAt: { [Op.gte]: startDate }
        }
      });

      // Статистика за сегодня
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

      const todayCount = await Activity.count({
        where: {
          createdAt: { 
            [Op.gte]: today,
            [Op.lt]: tomorrow 
          }
        }
      });

      // Статистика по типам действий
      const actionStats = await Activity.findAll({
        attributes: [
          'actionType',
          [Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: { [Op.gte]: startDate }
        },
        group: ['actionType'],
        order: [[Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'DESC']],
        raw: true
      });

      // Статистика по типам сущностей
      const entityStats = await Activity.findAll({
        attributes: [
          'entityType',
          [Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: { [Op.gte]: startDate }
        },
        group: ['entityType'],
        order: [[Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'DESC']],
        raw: true
      });

      // Активность по дням
      const dailyStats = await Activity.findAll({
        attributes: [
          [Activity.sequelize.fn('DATE', Activity.sequelize.col('createdAt')), 'date'],
          [Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: { [Op.gte]: startDate }
        },
        group: [Activity.sequelize.fn('DATE', Activity.sequelize.col('createdAt'))],
        order: [[Activity.sequelize.fn('DATE', Activity.sequelize.col('createdAt')), 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        data: {
          period,
          totalCount,
          todayCount,
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
      logger.error('Error fetching activity stats:', error);
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
        metadata
      });

      return activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }
};

module.exports = activityController;