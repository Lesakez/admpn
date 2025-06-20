// backend/src/models/Proxy.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Proxy = sequelize.define('Proxy', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    protocol: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'type',
      validate: {
        isIn: {
          args: [['http', 'https', 'socks4', 'socks5']],
          msg: 'Протокол должен быть одним из: http, https, socks4, socks5'
        }
      },
      comment: 'Тип/протокол прокси'
    },
    ipPort: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'ip_port',
      validate: {
        notEmpty: {
          msg: 'IP:PORT обязательно'
        },
        is: {
          args: /^(\d{1,3}\.){3}\d{1,3}:\d{1,5}$/,
          msg: 'Неверный формат IP:PORT'
        }
      },
      comment: 'IP:PORT прокси'
    },
    login: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Логин для авторизации'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Пароль для авторизации'
    },
    changeIpUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'change_ip_url',
      validate: {
        isUrl: {
          msg: 'Неверный формат URL'
        }
      },
      comment: 'URL для смены IP'
    },
    dateSetStatusBusy: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'date_set_status_busy',
      comment: 'Дата установки статуса "занят"'
    },
    dateSetStatusFree: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'date_set_status_free',
      comment: 'Дата установки статуса "свободен"'
    },
    dateLastChangeIp: {
      type: DataTypes.DATE(3),
      allowNull: true,
      field: 'date_last_change_ip',
      comment: 'Дата последней смены IP'
    },
    status: {
      type: DataTypes.ENUM('free', 'busy', 'blocked', 'error', 'maintenance'),
      allowNull: false,
      defaultValue: 'free',
      validate: {
        isIn: {
          args: [['free', 'busy', 'blocked', 'error', 'maintenance']],
          msg: 'Недопустимый статус прокси'
        }
      },
      comment: 'Статус прокси'
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [2, 100],
          msg: 'Название страны должно быть от 2 до 100 символов'
        }
      },
      comment: 'Страна прокси'
    },
    projectId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'project_id',
      references: {
        model: 'projects',
        key: 'id'
      },
      comment: 'ID проекта'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Заметки не могут быть длиннее 1000 символов'
        }
      },
      comment: 'Заметки'
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
    tableName: 'proxies',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (proxy) => {
        proxy.updatedAt = new Date();
        
        // Автоматически обновляем даты при смене статуса
        if (proxy.changed('status')) {
          const now = new Date();
          if (proxy.status === 'busy') {
            proxy.dateSetStatusBusy = now;
            proxy.dateSetStatusFree = null;
          } else if (proxy.status === 'free') {
            proxy.dateSetStatusFree = now;
            proxy.dateSetStatusBusy = null;
          }
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['ip_port'] // Уникальность IP:PORT
      },
      {
        unique: false,
        fields: ['status'] // Индекс для быстрого поиска по статусу
      },
      {
        unique: false,
        fields: ['project_id'] // Индекс для связи с проектами
      },
      {
        unique: false,
        fields: ['country'] // Индекс для фильтрации по стране
      }
    ]
  });

  Proxy.associate = (models) => {
    // Ассоциация с проектом
    Proxy.belongsTo(models.Project, {
      foreignKey: 'projectId',
      targetKey: 'id',
      as: 'project',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  // Статические методы
  Proxy.findFree = async function(filters = {}) {
    const where = { status: 'free' };
    
    // Добавляем фильтры
    if (filters.country) where.country = filters.country;
    if (filters.protocol) where.protocol = filters.protocol;
    if (filters.projectId) where.projectId = filters.projectId;

    return this.findAll({
      where,
      include: [{
        model: sequelize.models.Project,
        as: 'project',
        attributes: ['id', 'name']
      }],
      order: [
        ['dateSetStatusFree', 'ASC'], // Самые давно освобожденные
        ['createdAt', 'ASC']
      ]
    });
  };

  Proxy.changeIP = async function(proxyId) {
    const proxy = await this.findByPk(proxyId);
    if (!proxy || !proxy.changeIpUrl) {
      throw new Error('Прокси не найден или URL смены IP не настроен');
    }

    try {
      // Здесь должен быть HTTP запрос к API смены IP
      // const response = await fetch(proxy.changeIpUrl);
      
      await proxy.update({
        dateLastChangeIp: new Date()
      });
      
      return true;
    } catch (error) {
      throw new Error('Ошибка смены IP: ' + error.message);
    }
  };

  return Proxy;
};