const { sequelize } = require('../config/database');

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

      // Строим WHERE условия
      const whereConditions = [];
      const replacements = [];

      if (entityType) {
        whereConditions.push('entity_type = ?');
        replacements.push(entityType);
      }
      if (actionType) {
        whereConditions.push('action_type = ?');
        replacements.push(actionType);
      }
      if (entityId) {
        whereConditions.push('entity_id = ?');
        replacements.push(entityId);
      }
      if (userId) {
        whereConditions.push('user_id = ?');
        replacements.push(userId);
      }
      if (startDate) {
        whereConditions.push('timestamp >= ?');
        replacements.push(new Date(startDate));
      }
      if (endDate) {
        whereConditions.push('timestamp <= ?');
        replacements.push(new Date(endDate));
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      const query = `
        SELECT 
          id,
          timestamp,
          description,
          entity_type,
          entity_id,
          action_type,
          user_id,
          created_at
        FROM activities 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;

      replacements.push(parseInt(limit), parseInt(offset));

      const results = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      // Формируем ответ
      const formattedResults = (results || []).map(row => ({
        id: row.id,
        timestamp: row.timestamp || row.created_at,
        description: row.description,
        entityType: row.entity_type,
        entityId: row.entity_id,
        actionType: row.action_type,
        userId: row.user_id,
        metadata: null,
        createdAt: row.created_at,
        updatedAt: row.created_at
      }));

      res.json({
        success: true,
        data: formattedResults,
        count: formattedResults.length
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

      const whereConditions = ['entity_type = ?', 'entity_id = ?'];
      const replacements = [entityType, entityId];

      if (actionType) {
        whereConditions.push('action_type = ?');
        replacements.push(actionType);
      }
      if (startDate) {
        whereConditions.push('timestamp >= ?');
        replacements.push(new Date(startDate));
      }
      if (endDate) {
        whereConditions.push('timestamp <= ?');
        replacements.push(new Date(endDate));
      }

      const query = `
        SELECT 
          id,
          timestamp,
          description,
          entity_type,
          entity_id,
          action_type,
          user_id,
          created_at
        FROM activities 
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;

      replacements.push(parseInt(limit), parseInt(offset));

      const results = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      const formattedResults = (results || []).map(row => ({
        id: row.id,
        timestamp: row.timestamp || row.created_at,
        description: row.description,
        entityType: row.entity_type,
        entityId: row.entity_id,
        actionType: row.action_type,
        userId: row.user_id,
        metadata: null,
        createdAt: row.created_at,
        updatedAt: row.created_at
      }));

      res.json({
        success: true,
        data: formattedResults,
        count: formattedResults.length,
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

      // Определяем период
      let days = 7;
      switch (period) {
        case '1d': days = 1; break;
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        default: days = 7;
      }

      // Общая статистика за период
      const totalQuery = `
        SELECT COUNT(*) as total 
        FROM activities 
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      
      const totalResults = await sequelize.query(totalQuery, {
        replacements: [days],
        type: sequelize.QueryTypes.SELECT
      });
      
      // Статистика за сегодня
      const todayQuery = `
        SELECT COUNT(*) as today 
        FROM activities 
        WHERE DATE(timestamp) = CURDATE()
      `;
      
      const todayResults = await sequelize.query(todayQuery, {
        type: sequelize.QueryTypes.SELECT
      });
      
      // Статистика по типам действий
      const actionQuery = `
        SELECT 
          action_type,
          COUNT(*) as count 
        FROM activities 
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY action_type 
        ORDER BY count DESC
      `;
      
      const actionStats = await sequelize.query(actionQuery, {
        replacements: [days],
        type: sequelize.QueryTypes.SELECT
      });
      
      // Статистика по типам сущностей
      const entityQuery = `
        SELECT 
          entity_type,
          COUNT(*) as count 
        FROM activities 
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY entity_type 
        ORDER BY count DESC
      `;
      
      const entityStats = await sequelize.query(entityQuery, {
        replacements: [days],
        type: sequelize.QueryTypes.SELECT
      });
      
      // Активность по дням
      const dailyQuery = `
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as count 
        FROM activities 
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(timestamp) 
        ORDER BY date ASC
      `;
      
      const dailyStats = await sequelize.query(dailyQuery, {
        replacements: [days],
        type: sequelize.QueryTypes.SELECT
      });
      
      // Если нет данных за период, берем статистику за все время
      let fallbackActionStats = [];
      let fallbackEntityStats = [];
      
      if (actionStats.length === 0) {
        const fallbackActionQuery = `
          SELECT action_type, COUNT(*) as count 
          FROM activities 
          GROUP BY action_type 
          ORDER BY count DESC 
          LIMIT 10
        `;
        fallbackActionStats = await sequelize.query(fallbackActionQuery, {
          type: sequelize.QueryTypes.SELECT
        });
      }
      
      if (entityStats.length === 0) {
        const fallbackEntityQuery = `
          SELECT entity_type, COUNT(*) as count 
          FROM activities 
          GROUP BY entity_type 
          ORDER BY count DESC 
          LIMIT 10
        `;
        fallbackEntityStats = await sequelize.query(fallbackEntityQuery, {
          type: sequelize.QueryTypes.SELECT
        });
      }

      // Преобразуем данные для фронтенда
      const formattedActionStats = (actionStats.length > 0 ? actionStats : fallbackActionStats).map(item => ({
        actionType: item.action_type,
        count: parseInt(item.count)
      }));
      
      const formattedEntityStats = (entityStats.length > 0 ? entityStats : fallbackEntityStats).map(item => ({
        entityType: item.entity_type,
        count: parseInt(item.count)
      }));
      
      const formattedDailyStats = dailyStats.map(item => ({
        date: item.date,
        count: parseInt(item.count)
      }));

      res.json({
        success: true,
        data: {
          period,
          totalCount: parseInt(totalResults[0]?.total || 0),
          todayCount: parseInt(todayResults[0]?.today || 0),
          actionStats: formattedActionStats,
          entityStats: formattedEntityStats,
          dailyStats: formattedDailyStats
        }
      });

    } catch (error) {
      console.error('Error fetching activity stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch activity statistics',
        message: error.message
      });
    }
  },

  // Создать новую запись активности
  createActivity: async (entityType, entityId, actionType, description, userId = null, metadata = null) => {
    try {
      const query = `
        INSERT INTO activities (
          entity_type, 
          entity_id, 
          action_type, 
          description, 
          user_id, 
          timestamp,
          created_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      await sequelize.query(query, {
        replacements: [
          entityType, 
          entityId, 
          actionType, 
          description, 
          userId
        ],
        type: sequelize.QueryTypes.INSERT
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }
};

module.exports = activityController;