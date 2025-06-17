const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Activity = sequelize.define('Activity', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Время события'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Описание действия'
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'entity_type',
      comment: 'Тип сущности (account, profile, proxy, etc.)'
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'entity_id',
      comment: 'ID сущности'
    },
    actionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'action_type',
      comment: 'Тип действия (create, update, delete, etc.)'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
      comment: 'ID пользователя (если применимо)'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Дополнительные данные в JSON формате'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    tableName: 'activity',
    timestamps: false,
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

  Activity.associate = (models) => {
    // Associations можно добавить позже если нужно
  };

  return Activity;
};