const { Activity } = require('../models');
const logger = require('../utils/logger');

/**
 * СЕРВИС ДЛЯ РАБОТЫ С АКТИВНОСТЬЮ
 * Централизует логирование всех действий в системе
 * Обеспечивает единообразие записей активности
 */
class ActivityService {

  /**
   * Логировать активность для телефона
   */
  async logPhoneActivity(phoneId, actionType, description, metadata = null) {
    return await this.logActivity('phone', phoneId, actionType, description, metadata);
  }

  /**
   * Логировать активность для прокси
   */
  async logProxyActivity(proxyId, actionType, description, metadata = null) {
    return await this.logActivity('proxy', proxyId, actionType, description, metadata);
  }

  /**
   * Логировать активность для проекта
   */
  async logProjectActivity(projectId, actionType, description, metadata = null) {
    return await this.logActivity('project', projectId, actionType, description, metadata);
  }

  /**
   * Логировать активность для аккаунта
   */
  async logAccountActivity(accountId, actionType, description, metadata = null) {
    return await this.logActivity('account', accountId, actionType, description, metadata);
  }

  /**
   * Логировать активность для профиля
   */
  async logProfileActivity(profileId, actionType, description, metadata = null) {
    return await this.logActivity('profile', profileId, actionType, description, metadata);
  }

  /**
   * Логировать массовую активность
   */
  async logBulkActivity(entityType, entityIds, actionType, description, metadata = null) {
    try {
      if (!Array.isArray(entityIds) || entityIds.length === 0) {
        return [];
      }

      const activities = entityIds.map(entityId => ({
        timestamp: new Date(),
        description,
        entityType,
        entityId,
        actionType,
        metadata: metadata ? JSON.stringify(metadata) : null
      }));

      const createdActivities = await Activity.bulkCreate(activities);
      
      logger.info('Bulk activity logged', { 
        entityType, 
        count: entityIds.length, 
        actionType 
      });

      return createdActivities;
    } catch (error) {
      logger.error('Error logging bulk activity:', error);
      // Не прерываем выполнение, если не удалось залогировать
      return [];
    }
  }

  /**
   * Получить последнюю активность
   */
  async getRecentActivity(limit = 50, entityType = null) {
    try {
      const where = {};
      
      if (entityType) {
        where.entityType = entityType;
      }

      return await Activity.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit,
        attributes: ['id', 'timestamp', 'description', 'entityType', 'entityId', 'actionType']
      });
    } catch (error) {
      logger.error('Error getting recent activity:', error);
      throw new Error('Ошибка получения активности');
    }
  }

  /**
   * Получить активность для конкретной сущности
   */
  async getEntityActivity(entityType, entityId, limit = 20) {
    try {
      return await Activity.findAll({
        where: {
          entityType,
          entityId
        },
        order: [['timestamp', 'DESC']],
        limit,
        attributes: ['id', 'timestamp', 'description', 'actionType', 'metadata']
      });
    } catch (error) {
      logger.error('Error getting entity activity:', error);
      throw new Error('Ошибка получения активности сущности');
    }
  }

  /**
   * Получить статистику активности
   */
  async getActivityStats(period = '24h') {
    try {
      let timeCondition;
      
      switch (period) {
        case '1h':
          timeCondition = "timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)";
          break;
        case '24h':
          timeCondition = "timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";
          break;
        case '7d':
          timeCondition = "timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
          break;
        case '30d':
          timeCondition = "timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
          break;
        default:
          timeCondition = "timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";
      }

      const [entityStats, actionStats, hourlyStats] = await Promise.all([
        // Статистика по типам сущностей
        Activity.findAll({
          attributes: [
            'entityType',
            [Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'count']
          ],
          where: Activity.sequelize.literal(timeCondition),
          group: ['entityType'],
          raw: true
        }),

        // Статистика по типам действий
        Activity.findAll({
          attributes: [
            'actionType',
            [Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'count']
          ],
          where: Activity.sequelize.literal(timeCondition),
          group: ['actionType'],
          raw: true
        }),

        // Почасовая статистика (последние 24 часа)
        Activity.findAll({
          attributes: [
            [Activity.sequelize.fn('HOUR', Activity.sequelize.col('timestamp')), 'hour'],
            [Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'count']
          ],
          where: Activity.sequelize.literal("timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"),
          group: [Activity.sequelize.fn('HOUR', Activity.sequelize.col('timestamp'))],
          order: [[Activity.sequelize.fn('HOUR', Activity.sequelize.col('timestamp')), 'ASC']],
          raw: true
        })
      ]);

      return {
        entityStats,
        actionStats,
        hourlyStats,
        period
      };
    } catch (error) {
      logger.error('Error getting activity stats:', error);
      throw new Error('Ошибка получения статистики активности');
    }
  }

  /**
   * Очистить старую активность
   */
  async cleanupOldActivity(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await Activity.destroy({
        where: {
          timestamp: {
            [Activity.sequelize.Op.lt]: cutoffDate
          }
        }
      });

      logger.info('Old activity cleaned up', { 
        deletedCount, 
        daysToKeep, 
        cutoffDate 
      });

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old activity:', error);
      throw new Error('Ошибка очистки старой активности');
    }
  }

  // ========================================================================
  // ПРИВАТНЫЕ МЕТОДЫ
  // ========================================================================

  /**
   * Базовый метод для логирования активности
   */
  async logActivity(entityType, entityId, actionType, description, metadata = null) {
    try {
      const activity = await Activity.create({
        timestamp: new Date(),
        description,
        entityType,
        entityId,
        actionType,
        metadata: metadata ? JSON.stringify(metadata) : null
      });

      logger.debug('Activity logged', { 
        entityType, 
        entityId, 
        actionType, 
        activityId: activity.id 
      });

      return activity;
    } catch (error) {
      logger.error('Error logging activity:', error);
      // Не прерываем выполнение основной операции, если не удалось залогировать
      return null;
    }
  }
}

module.exports = ActivityService;