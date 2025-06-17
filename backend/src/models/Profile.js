const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Profile = sequelize.define('Profile', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    profileId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'profile_id',
      comment: 'Уникальный ID профиля'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Название профиля'
    },
    folderId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'folder_id',
      comment: 'ID папки'
    },
    folderName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'folder_name',
      comment: 'Название папки'
    },
    workspaceId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'workspace_id',
      comment: 'ID рабочего пространства'
    },
    workspaceName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'workspace_name',
      comment: 'Название рабочего пространства'
    },
    proxy: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Прокси настройки'
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'user_id',
      comment: 'ID пользователя'
    },
    status: {
      type: DataTypes.ENUM('created', 'active', 'inactive', 'working', 'banned'),
      defaultValue: 'created',
      comment: 'Статус профиля'
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
    tableName: 'profiles',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['profile_id'],
        unique: true
      },
      {
        fields: ['name']
      },
      {
        fields: ['folder_name']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  Profile.associate = (models) => {
    // Associations можно добавить позже
  };

  return Profile;
};