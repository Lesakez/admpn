// backend/src/models/Project.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Название проекта'
    },
    transliterateName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'transliterate_name',
      comment: 'Транслитерированное название'
    },
    // Добавляем поле которого нет в БД, но есть в коде
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Описание проекта'
    }
  }, {
    tableName: 'projects',
    timestamps: false, // В БД нет created_at/updated_at
    underscored: true
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