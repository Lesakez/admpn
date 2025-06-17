const { Activity } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Получить последнюю активность
const getRecentActivity = async (req, res, next) => {
  try {
    const {
      limit = 50,
      entityType,
      actionType,
      dateFrom,
      dateTo,
      search
    } = req.query;

    const where = {};

    // Фильтры
    if (entityType) {
      where.entityType = Array.isArray(entityType) ? { [Op.in]: entityType } : entityType;
    }

    if (actionType) {
      where.actionType = Array.isArray(actionType) ? { [Op.in]: actionType } : actionType;
    }

    if (dateFrom) {
      where.timestamp = { [Op.gte]: new Date(dateFrom) };
    }

    if (dateTo) {
      where.timestamp = { 
        ...where.timestamp,
        [Op.lte]: new Date(dateTo) 
      };
    }

    if (search) {
      where.description = { [Op.like]: `%${search}%` };
    }

    const activities = await Activity.findAll({
      where,
      limit: parseInt(limit),
      order: [['timestamp', 'DESC']]
    });

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

// Получить активность по сущности
const getActivityByEntity = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = 20 } = req.query;

    const activities = await Activity.findAll({
      where: {
        entityType,
        entityId: parseInt(entityId)
      },
      limit: parseInt(limit),
      order: [['timestamp', 'DESC']]
    });

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

// Получить статистику активности
const getActivityStats = async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    
    let dateFrom;
    const now = new Date();
    
    switch (period) {
      case '1d':
        dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Статистика по типам действий
    const actionStats = await Activity.findAll({
      attributes: [
        'actionType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        timestamp: { [Op.gte]: dateFrom }
      },
      group: ['actionType'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    // Статистика по типам сущностей
    const entityStats = await Activity.findAll({
      attributes: [
        'entityType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        timestamp: { [Op.gte]: dateFrom }
      },
      group: ['entityType'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    // Активность по дням
    const dailyStats = await Activity.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('timestamp')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        timestamp: { [Op.gte]: dateFrom }
      },
      group: [sequelize.fn('DATE', sequelize.col('timestamp'))],
      order: [[sequelize.fn('DATE', sequelize.col('timestamp')), 'ASC']]
    });

    const totalActivity = await Activity.count({
      where: {
        timestamp: { [Op.gte]: dateFrom }
      }
    });

    res.json({
      success: true,
      data: {
        period,
        total: totalActivity,
        byAction: actionStats.map(stat => ({
          action: stat.actionType,
          count: parseInt(stat.dataValues.count)
        })),
        byEntity: entityStats.map(stat => ({
          entity: stat.entityType,
          count: parseInt(stat.dataValues.count)
        })),
        daily: dailyStats.map(stat => ({
          date: stat.dataValues.date,
          count: parseInt(stat.dataValues.count)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecentActivity,
  getActivityByEntity,
  getActivityStats
};