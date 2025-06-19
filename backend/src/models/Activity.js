const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Account = sequelize.define('Account', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    login: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Логин аккаунта'
    },
    password: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Пароль аккаунта'
    },
    email: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Email аккаунта'
    },
    emailPassword: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'email_password',
      comment: 'Пароль от email'
    },
    userAgent: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'user_agent',
      comment: 'User Agent'
    },
    twoFa: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'two_fa',
      comment: '2FA данные'
    },
    dob: {
      type: DataTypes.DATE(3),
      allowNull: true,
      comment: 'Дата рождения'
    },
    nameProfiles: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'name_profiles',
      comment: 'Имена профилей'
    },
    userId: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'user_id',
      comment: 'User ID'
    },
    cookies: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Cookies'
    },
    status: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Статус аккаунта'
    },
    friendsCounts: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'friends_counts',
      comment: 'Количество друзей'
    },
    note: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Заметка'
    },
    statusCheck: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'status_check',
      comment: 'Статус проверки'
    },
    eaab: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'EAAB токен'
    },
    namePage: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'name_page',
      comment: 'Название страницы'
    },
    data: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Дополнительные данные'
    },
    dataRegistration: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'data_registration',
      comment: 'Дата регистрации'
    },
    idActive: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'id_active',
      comment: 'ID активности'
    },
    counter: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Счетчик'
    },
    code: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Код'
    },
    device: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Устройство'
    },
    emailJsonData: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'email_json_data',
      comment: 'JSON данные email'
    },
    lsposedJson: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'ls_posed_json',
      comment: 'LSPosed JSON данные'
    },
    accessToken: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'access_token',
      comment: 'Access token'
    },
    clientId: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'client_id',
      comment: 'Client ID'
    },
    refreshToken: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'refresh_token',
      comment: 'Refresh token'
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
    tableName: 'accounts',
    timestamps: false, // Отключаем автоматическое управление timestamps
    underscored: true,
    indexes: [
      {
        fields: ['login']
      },
      {
        fields: ['email']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  Account.associate = (models) => {
    // Связи можно добавить позже при необходимости
  };

  return Account;
};