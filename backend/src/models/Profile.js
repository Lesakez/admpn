// backend/src/models/Phone.js
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
    // Добавляем поля которых нет в БД, но есть в коде
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP адрес'
    },
    macAddress: {
      type: DataTypes.STRING(17),
      allowNull: true,
      comment: 'MAC адрес'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Заметки'
    }
  }, {
    tableName: 'phones',
    timestamps: false, // В БД нет created_at/updated_at
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