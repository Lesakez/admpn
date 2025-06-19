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
    // Виртуальные поля для совместимости с кодом
    ipAddress: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('ip_address') || null;
      }
    },
    macAddress: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('mac_address') || null;
      }
    },
    notes: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('notes') || null;
      }
    },
    // Виртуальное поле для created_at чтобы избежать ошибок сортировки
    createdAt: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('id') ? new Date() : null;
      }
    }
  }, {
    tableName: 'phones',
    timestamps: false, // Отключаем автоматические timestamps
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