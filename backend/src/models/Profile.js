const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Profile = sequelize.define('Profile', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    profileId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'profile_id',
      comment: 'ID профиля браузера'
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Название профиля'
    },
    folderName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'folder_name',
      comment: 'Имя папки'
    },
    workspaceId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'workspace_id',
      comment: 'ID рабочего пространства'
    },
    workspaceName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'workspace_name',
      comment: 'Имя рабочего пространства'
    },
    proxy: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Прокси настройки'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
      comment: 'User Agent'
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Разрешение экрана'
    },
    timezone: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Часовой пояс'
    },
    language: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Язык'
    },
    geolocation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Геолокация'
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Статус профиля'
    },
    userId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_id',
      comment: 'ID пользователя'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Заметки'
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Теги'
    },
    lastUsed: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'last_used',
      comment: 'Последнее использование'
    },
    // Добавляем поле created_at если его нет в базе
    createdAt: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'profiles',
    timestamps: false, // Отключаем автоматические timestamps, управляем вручную
    underscored: true
  });

  Profile.associate = (models) => {
    // Ассоциации можно добавить позже при необходимости
  };

  return Profile;
};