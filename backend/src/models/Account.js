const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Account = sequelize.define('Account', {
    id: {
      type: DataTypes.INTEGER,
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
    phone: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Номер телефона'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'blocked', 'deleted'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Статус аккаунта'
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'birth_date',
      comment: 'Дата рождения'
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true,
      comment: 'Пол'
    },
    firstName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'first_name',
      comment: 'Имя'
    },
    lastName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'last_name',
      comment: 'Фамилия'
    },
    country: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Страна'
    },
    city: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Город'
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ссылка на аватар'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Биография'
    },
    followers: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Количество подписчиков'
    },
    following: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Количество подписок'
    },
    posts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Количество постов'
    },
    cookies: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Куки'
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Токен'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
      comment: 'User Agent'
    },
    proxy: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Прокси'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Заметки'
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_activity',
      comment: 'Последняя активность'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login',
      comment: 'Последний вход'
    },
    twoFactorSecret: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'two_factor_secret',
      comment: 'Секрет для 2FA'
    },
    backupCodes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'backup_codes',
      comment: 'Резервные коды'
    },
    sessionId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'session_id',
      comment: 'ID сессии'
    },
    csrfToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'csrf_token',
      comment: 'CSRF токен'
    },
    instagramId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'instagram_id',
      comment: 'Instagram ID'
    },
    facebookId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'facebook_id',
      comment: 'Facebook ID'
    },
    linkedData: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'linked_data',
      comment: 'Связанные данные'
    },
    recoveryEmail: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'recovery_email',
      comment: 'Email для восстановления'
    },
    phoneNumber: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'phone_number',
      comment: 'Номер телефона'
    },
    challenge: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Челлендж'
    },
    checkpoint: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Чекпоинт'
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
      field: 'lsposed_json', // ИСПРАВЛЕНО: правильное название поля
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
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE(3),
      allowNull: false,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'old_accounts',
    timestamps: true,
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
    // Account.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
    // Account.hasMany(models.Activity, { foreignKey: 'entityId', constraints: false });
  };

  return Account;
};