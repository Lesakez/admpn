const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Registration = sequelize.define('Registration', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    serviceName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'service_name',
      comment: 'Название сервиса'
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'pending', 'cancelled'),
      allowNull: false,
      comment: 'Статус регистрации'
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Страна регистрации'
    },
    smsService: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'sms_service',
      comment: 'SMS сервис'
    },
    proxyUsed: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'proxy_used',
      comment: 'Использованный прокси'
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'phone_number',
      comment: 'Номер телефона'
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'account_id',
      comment: 'ID созданного аккаунта'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
      comment: 'Сообщение об ошибке'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Дополнительные данные в JSON'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Длительность процесса в секундах'
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
    tableName: 'registrations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['service_name']
      },
      {
        fields: ['status']
      },
      {
        fields: ['country']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['account_id']
      }
    ]
  });

  Registration.associate = (models) => {
    Registration.belongsTo(models.Account, {
      foreignKey: 'accountId',
      as: 'account'
    });
  };

  return Registration;
};