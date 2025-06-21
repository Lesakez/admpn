// backend/src/models/Activity.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Activity = sequelize.define('Activity', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    timestamp: {
      type: DataTypes.DATE(3),
      allowNull: true,
      defaultValue: DataTypes.NOW,
      comment: 'Время события'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Описание действия'
    },
    entityType: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'entity_type',
      comment: 'Тип сущности (proxy, account, profile, etc.)'
    },
    entityId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'entity_id',
      comment: 'ID сущности'
    },
    actionType: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'action_type',
      comment: 'Тип действия (create, update, delete, etc.)'
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'user_id',
      comment: 'ID пользователя'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Дополнительные данные в JSON формате'
    },
    createdAt: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'updated_at'
    }
  }, {
    tableName: 'activities',
    timestamps: true, // Включаем автоматические timestamps
    underscored: true,
    
    indexes: [
      {
        fields: ['timestamp']
      },
      {
        fields: ['entity_type', 'entity_id']
      },
      {
        fields: ['action_type']
      },
      {
        fields: ['user_id']
      }
    ]
  });

  // Методы модели
  Activity.addHook('beforeCreate', (activity) => {
    if (!activity.timestamp) {
      activity.timestamp = new Date();
    }
  });

  // Статические методы для удобства
  Activity.logActivity = async function(entityType, entityId, actionType, description, userId = null, metadata = null) {
    try {
      return await this.create({
        timestamp: new Date(),
        description,
        entityType,
        entityId,
        actionType,
        userId,
        metadata
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      throw error;
    }
  };

  Activity.getRecentByEntity = async function(entityType, entityId, limit = 10) {
    return await this.findAll({
      where: {
        entityType,
        entityId
      },
      order: [['timestamp', 'DESC']],
      limit
    });
  };

  return Activity;
};