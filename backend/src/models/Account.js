const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Account = sequelize.define('Account', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    login: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Логин аккаунта'
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Пароль аккаунта'
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Email аккаунта'
    },
    emailPassword: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'email_password',
      comment: 'Пароль от email'
    },
    emailRecovery: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'email_recovery',
      comment: 'Резервный email'
    },
    emailPasswordRecovery: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'email_password_recovery',
      comment: 'Пароль от резервного email'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
      comment: 'User Agent'
    },
    twoFA: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'two_fa',
      comment: '2FA ключ'
    },
    dob: {
      type: DataTypes.DATE(3),
      allowNull: true,
      comment: 'Дата рождения'
    },
    nameProfiles: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'name_profiles',
      comment: 'Имя профиля'
    },
    userId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_id',
      comment: 'ID пользователя'
    },
    cookies: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Cookies'
    },
    status: {
      type: DataTypes.TEXT,
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
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Заметки'
    },
    statusCheck: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'status_check',
      comment: 'Статус проверки'
    },
    eaab: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'EAAB токен'
    },
    namePage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'name_page',
      comment: 'Имя страницы'
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Дополнительные данные'
    },
    dataRegistration: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'data_registration',
      comment: 'Дата регистрации аккаунта'
    },
    idActive: {
      type: DataTypes.TEXT,
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
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Код'
    },
    device: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Устройство'
    },
    emailJsonData: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'email_json_data',
      comment: 'JSON данные email'
    },
    lsposedJson: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'ls_posed_json',
      comment: 'LSPosed JSON данные'
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'access_token',
      comment: 'Access token'
    },
    clientId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'client_id',
      comment: 'Client ID'
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'refresh_token',
      comment: 'Refresh token'
    },
    source: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Источник аккаунта'
    },
    importDate: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'import_date',
      comment: 'Дата импорта'
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
    tableName: 'old_accounts',
    timestamps: false, // Отключаем автоматические timestamps так как поля nullable
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
        fields: ['source']
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