const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Account = sequelize.define('Account', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    login: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Логин аккаунта'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Пароль аккаунта'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Email аккаунта'
    },
    emailPassword: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'email_password',
      comment: 'Пароль от email'
    },
    emailRecovery: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'email_recovery',
      comment: 'Резервный email'
    },
    emailPasswordRecovery: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'email_password_recovery',
      comment: 'Пароль от резервного email'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
      comment: 'User Agent браузера'
    },
    twoFA: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'twofa',
      comment: '2FA код'
    },
    dob: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Дата рождения'
    },
    nameProfiles: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'name_profiles',
      comment: 'Имя профиля'
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'user_id',
      comment: 'ID пользователя'
    },
    cookies: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Cookies аккаунта'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'banned', 'working', 'free', 'busy'),
      defaultValue: 'active',
      comment: 'Статус аккаунта'
    },
    friendsCounts: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.STRING(50),
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
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'name_page',
      comment: 'Название страницы'
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Дополнительные данные'
    },
    dataRegistration: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'data_registration',
      comment: 'Дата регистрации аккаунта'
    },
    idActive: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'id_active',
      comment: 'ID активности'
    },
    counter: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Счетчик'
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Код'
    },
    device: {
      type: DataTypes.STRING(255),
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
      field: 'lsposed_json',
      comment: 'LSPosed JSON данные'
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'access_token',
      comment: 'Access token'
    },
    clientId: {
      type: DataTypes.STRING(255),
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
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Источник аккаунта'
    },
    importDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'import_date',
      comment: 'Дата импорта'
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
    tableName: 'old_accounts',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['source']
      },
      {
        fields: ['login']
      }
    ]
  });

  Account.associate = (models) => {
    // Associations можно добавить позже
  };

  return Account;
};