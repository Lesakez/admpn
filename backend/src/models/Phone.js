const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Phone = sequelize.define('Phone', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    model: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Модель устройства'
    },
    device: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Идентификатор устройства'
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Название устройства'
    },
    androidVersion: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'android_version',
      comment: 'Версия Android'
    },
    dateSetStatusBusy: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'date_set_status_busy',
      comment: 'Дата установки статуса "занят"'
    },
    dateSetStatusFree: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'date_set_status_free',
      comment: 'Дата установки статуса "свободен"'
    },
    dateLastReboot: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'date_last_reboot',
      comment: 'Дата последней перезагрузки'
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Статус устройства'
    },
    projectId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'project_id',
      comment: 'ID проекта'
    },
    // Реальные поля (теперь есть в БД)
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address',
      comment: 'IP адрес устройства'
    },
    macAddress: {
      type: DataTypes.STRING(17),
      allowNull: true,
      field: 'mac_address',
      comment: 'MAC адрес устройства'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Заметки об устройстве'
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
    tableName: 'phones',
    timestamps: true, // Включаем автоматические timestamps
    underscored: true
  });

  Phone.associate = (models) => {
    Phone.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
  };

  return Phone;
};