// backend/src/models/Proxy.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Proxy = sequelize.define('Proxy', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    protocol: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'type', // В БД поле называется 'type'
      comment: 'Тип/протокол прокси'
    },
    ipPort: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'ip_port',
      comment: 'IP:PORT прокси'
    },
    login: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Логин для авторизации'
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Пароль для авторизации'
    },
    changeIpUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'change_ip_url',
      comment: 'URL для смены IP'
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
    dateLastChangeIp: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'date_last_change_ip',
      comment: 'Дата последней смены IP'
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Статус прокси'
    },
    country: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Страна прокси'
    },
    projectId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'project_id',
      comment: 'ID проекта'
    },
    // Добавляем поля которых нет в БД, но есть в коде
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Заметки'
    }
  }, {
    tableName: 'proxies',
    timestamps: false, // В БД нет created_at/updated_at
    underscored: true
  });

  Proxy.associate = (models) => {
    // Используем алиас 'project' для устранения ошибки
    Proxy.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project' // Указываем алиас явно
    });
  };

  return Proxy;
};