const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Название проекта'
    },
    transliterateName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'transliterate_name',
      comment: 'Транслитерированное название'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Описание проекта'
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
    tableName: 'projects',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['transliterate_name']
      }
    ]
  });

  Project.associate = (models) => {
    Project.hasMany(models.Proxy, {
      foreignKey: 'projectId',
      as: 'proxies'
    });
    
    Project.hasMany(models.Phone, {
      foreignKey: 'projectId',
      as: 'phones'
    });
  };

  return Project;
};