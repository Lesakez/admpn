// backend/src/models/Proxy.js

const { DataTypes, Op } = require('sequelize');

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
      field: 'type', // Сохраняем маппинг для совместимости с БД
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
        isIPPort(value) {
          const ipPortRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):(?:[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;
          if (!ipPortRegex.test(value)) {
            throw new Error('Неверный формат IP:PORT');
          }
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
    projectId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'project_id',
      comment: 'ID проекта'
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
        
        // Автоматически устанавливаем даты смены статуса
        if (proxy.changed('status')) {
          const newStatus = proxy.status;
          const now = new Date();
          
          if (newStatus === 'busy') {
            proxy.dateSetStatusBusy = now;
          } else if (newStatus === 'free') {
            proxy.dateSetStatusFree = now;
          }
        }
      }
    },
    
    indexes: [
      {
        unique: false,
        fields: ['status']
      },
      {
        unique: false,
        fields: ['project_id']
      },
      {
        unique: false,
        fields: ['country']
      },
      {
        unique: false,
        fields: ['ip_port']
      },
      {
        unique: false,
        fields: ['created_at']
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

  /**
   * Найти свободные прокси с фильтрами
   */
  Proxy.findFree = async function(filters = {}) {
    const where = { status: 'free' };
    
    if (filters.country) where.country = filters.country;
    if (filters.protocol) where.protocol = filters.protocol;
    if (filters.projectId !== undefined) {
      where.projectId = filters.projectId;
    }

    return this.findAll({
      where,
      include: [{
        model: sequelize.models.Project,
        as: 'project',
        attributes: ['id', 'name']
      }],
      order: [
        ['dateSetStatusFree', 'ASC'],
        ['createdAt', 'ASC']
      ]
    });
  };

  /**
   * Смена IP для прокси
   */
  Proxy.changeIP = async function(proxyId) {
    const proxy = await this.findByPk(proxyId);
    if (!proxy || !proxy.changeIpUrl) {
      throw new Error('Прокси не найден или URL смены IP не настроен');
    }

    try {
      const https = require('https');
      const http = require('http');
      const url = require('url');
      
      const parsedUrl = url.parse(proxy.changeIpUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      await new Promise((resolve, reject) => {
        const req = client.request(parsedUrl, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
        req.end();
      });
      
      await proxy.update({
        dateLastChangeIp: new Date()
      });
      
      return true;
    } catch (error) {
      throw new Error('Ошибка смены IP: ' + error.message);
    }
  };

  /**
   * Массовое назначение прокси проекту
   */
  Proxy.assignToProject = async function(proxyIds, projectId) {
    if (!Array.isArray(proxyIds) || proxyIds.length === 0) {
      throw new Error('Массив ID прокси не может быть пустым');
    }

    const transaction = await sequelize.transaction();
    
    try {
      // Проверяем существование проекта
      if (projectId) {
        const project = await sequelize.models.Project.findByPk(projectId);
        if (!project) {
          throw new Error('Проект не найден');
        }
      }

      // Обновляем прокси
      const [updatedCount] = await this.update(
        { 
          projectId,
          updatedAt: new Date()
        },
        {
          where: {
            id: {
              [Op.in]: proxyIds
            }
          },
          transaction
        }
      );

      await transaction.commit();
      
      return {
        success: true,
        assignedCount: updatedCount,
        projectId
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Получить статистику прокси
   */
  Proxy.getStats = async function(where = {}) {
    try {
      const [total, byStatus, byCountry, byProtocol] = await Promise.all([
        this.count({ where }),
        
        // Группировка по статусам
        this.findAll({
          where,
          attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('*')), 'count']
          ],
          group: ['status'],
          raw: true
        }),
        
        // Группировка по странам
        this.findAll({
          where: {
            ...where,
            country: { [Op.ne]: null }
          },
          attributes: [
            'country',
            [sequelize.fn('COUNT', sequelize.col('*')), 'count']
          ],
          group: ['country'],
          order: [[sequelize.fn('COUNT', sequelize.col('*')), 'DESC']],
          limit: 10,
          raw: true
        }),
        
        // Группировка по протоколам
        this.findAll({
          where: {
            ...where,
            protocol: { [Op.ne]: null }
          },
          attributes: [
            'protocol',
            [sequelize.fn('COUNT', sequelize.col('*')), 'count']
          ],
          group: ['protocol'],
          raw: true
        })
      ]);

      return {
        total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        byCountry: byCountry.reduce((acc, item) => {
          acc[item.country] = parseInt(item.count);
          return acc;
        }, {}),
        byProtocol: byProtocol.reduce((acc, item) => {
          acc[item.protocol] = parseInt(item.count);
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting proxy stats:', error);
      return { total: 0, byStatus: {}, byCountry: {}, byProtocol: {} };
    }
  };

  /**
   * Получить список с пагинацией и фильтрацией
   */
  Proxy.getListWithPagination = async function(options = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status,
      country,
      protocol,
      projectId
    } = options;

    const validatedPage = Math.max(1, parseInt(page));
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (validatedPage - 1) * validatedLimit;

    const where = {};
    
    if (search) {
      where[Op.or] = [
        { ipPort: { [Op.like]: `%${search}%` } },
        { login: { [Op.like]: `%${search}%` } },
        { country: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) where.status = status;
    if (country) where.country = country;
    if (protocol) where.protocol = protocol;
    if (projectId !== undefined) where.projectId = projectId;

    const validSortOrders = ['ASC', 'DESC', 'asc', 'desc'];
    const order = validSortOrders.includes(sortOrder) 
      ? [[sortBy, sortOrder.toUpperCase()]]
      : [['createdAt', 'DESC']];

    try {
      const { count, rows } = await this.findAndCountAll({
        where,
        include: [{
          model: sequelize.models.Project,
          as: 'project',
          attributes: ['id', 'name']
        }],
        limit: validatedLimit,
        offset,
        order,
        distinct: true
      });

      return {
        data: rows,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total: count,
          pages: Math.ceil(count / validatedLimit),
          hasNext: validatedPage < Math.ceil(count / validatedLimit),
          hasPrev: validatedPage > 1
        }
      };
    } catch (error) {
      console.error('Error in getListWithPagination for Proxy:', error);
      throw error;
    }
  };

  /**
   * Массовое удаление прокси
   */
  Proxy.bulkDelete = async function(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('IDs must be a non-empty array');
    }

    try {
      const deletedCount = await this.destroy({
        where: {
          id: {
            [Op.in]: ids
          }
        }
      });

      return {
        success: true,
        deletedCount,
        ids: ids.slice(0, deletedCount)
      };
    } catch (error) {
      console.error('Error in bulk delete for Proxy:', error);
      throw error;
    }
  };

  return Proxy;
};