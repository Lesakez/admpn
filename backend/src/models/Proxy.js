const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Proxy = sequelize.define('Proxy', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Тип прокси (http, socks5, etc.)'
    },
    ipPort: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'ip_port',
      comment: 'IP:Port прокси'
    },
    login: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Логин для прокси'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Пароль для прокси'
    },
    changeIpUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'change_ip_url',
      comment: 'URL для смены IP'
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
    dateLastChangeIp: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'date_last_change_ip',
      comment: 'Дата последней смены IP'
    },
    status: {
      type: DataTypes.ENUM('free', 'busy', 'inactive'),
      defaultValue: 'free',
      comment: 'Статус прокси'
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Страна прокси'
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
    tableName: 'proxies',
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
        fields: ['country']
      },
      {
        fields: ['ip_port']
      }
    ]
  });

  Proxy.associate = (models) => {
    Proxy.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
  };

  return Proxy;
};