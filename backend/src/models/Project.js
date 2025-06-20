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
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Название проекта не может быть пустым'
        },
        len: {
          args: [1, 255],
          msg: 'Название проекта должно быть от 1 до 255 символов'
        }
      },
      comment: 'Название проекта'
    },
    transliterateName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'transliterate_name',
      validate: {
        len: {
          args: [0, 255],
          msg: 'Транслитерированное название не может быть длиннее 255 символов'
        }
      },
      comment: 'Транслитерированное название'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Описание не может быть длиннее 1000 символов'
        }
      },
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
    hooks: {
      beforeUpdate: (project) => {
        project.updatedAt = new Date();
      }
    },
    indexes: [
      {
        unique: false,
        fields: ['name']
      },
      {
        unique: false,
        fields: ['created_at']
      }
    ]
  });

  Project.associate = (models) => {
    // Ассоциация с прокси
    Project.hasMany(models.Proxy, {
      foreignKey: 'projectId',
      sourceKey: 'id',
      as: 'proxies',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    // Ассоциация с телефонами
    Project.hasMany(models.Phone, {
      foreignKey: 'projectId',
      sourceKey: 'id',
      as: 'phones',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Ассоциация с профилями (если есть)
    if (models.Profile) {
      Project.hasMany(models.Profile, {
        foreignKey: 'projectId',
        sourceKey: 'id',
        as: 'profiles',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }
  };

  // Статические методы
  Project.getWithStats = async function(projectId) {
    const project = await this.findByPk(projectId, {
      include: [
        {
          model: sequelize.models.Proxy,
          as: 'proxies',
          attributes: ['id', 'status', 'country']
        },
        {
          model: sequelize.models.Phone,
          as: 'phones',
          attributes: ['id', 'status', 'model']
        }
      ]
    });

    if (!project) return null;

    // Вычисляем статистику
    const stats = {
      proxies: {
        total: project.proxies.length,
        byStatus: {},
        byCountry: {}
      },
      phones: {
        total: project.phones.length,
        byStatus: {},
        byModel: {}
      }
    };

    // Группируем прокси по статусам и странам
    project.proxies.forEach(proxy => {
      stats.proxies.byStatus[proxy.status] = 
        (stats.proxies.byStatus[proxy.status] || 0) + 1;
      
      if (proxy.country) {
        stats.proxies.byCountry[proxy.country] = 
          (stats.proxies.byCountry[proxy.country] || 0) + 1;
      }
    });

    // Группируем телефоны по статусам и моделям
    project.phones.forEach(phone => {
      stats.phones.byStatus[phone.status] = 
        (stats.phones.byStatus[phone.status] || 0) + 1;
      
      if (phone.model) {
        stats.phones.byModel[phone.model] = 
          (stats.phones.byModel[phone.model] || 0) + 1;
      }
    });

    return {
      ...project.toJSON(),
      stats
    };
  };

  return Project;
};