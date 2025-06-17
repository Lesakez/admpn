const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Phone = sequelize.define('Phone', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    model: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Модель телефона'
    },
    device: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Устройство'
    },
    androidVersion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'android_version',
      comment: 'Версия Android'
    },
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
    dateSetStatusFree: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'date_set_status_free',
      comment: 'Дата установки статуса "свободен"'
    },
    dateSetStatusBusy: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'date_set_status_busy',
      comment: 'Дата установки статуса "занят"'
    },
    dateLastReboot: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'date_last_reboot',
      comment: 'Дата последней перезагрузки'
    },
    status: {
      type: DataTypes.ENUM('free', 'busy', 'inactive', 'maintenance'),
      defaultValue: 'free',
      comment: 'Статус устройства'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'project_id',
      comment: 'ID проекта'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'phones',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['project_id']
      },
      {
        fields: ['model']
      }
    ]
  });

  Phone.associate = (models) => {
    Phone.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
  };

  return Phone;
};