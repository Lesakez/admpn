const { Phone, Project, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * РЕПОЗИТОРИЙ ДЛЯ РАБОТЫ С ТЕЛЕФОНАМИ
 * Инкапсулирует все запросы к БД
 * Решает проблемы N+1 запросов
 * Обеспечивает переиспользование сложных запросов
 */
class PhoneRepository {
  
  /**
   * Найти телефон по ID с проектом
   */
  async findWithProject(id) {
    return await Phone.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });
  }

  /**
   * Найти телефоны с фильтрацией и пагинацией
   * Решает проблему N+1 запросов включением связанных данных
   */
  async findWithFilters(filters = {}, pagination = {}) {
    const where = this.buildWhereClause(filters);
    
    return await Phone.findAndCountAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ],
      ...pagination,
      order: [['createdAt', 'DESC']],
      distinct: true // Важно для правильного подсчета при JOIN
    });
  }

  /**
   * Создать телефон
   */
  async create(phoneData) {
    return await Phone.create(phoneData);
  }

  /**
   * Обновить телефон
   */
  async update(id, updateData) {
    const [updatedRowsCount] = await Phone.update(updateData, {
      where: { id }
    });
    return updatedRowsCount;
  }

  /**
   * Удалить телефон
   */
  async delete(id) {
    return await Phone.destroy({
      where: { id }
    });
  }

  /**
   * Массовое обновление телефонов
   */
  async bulkUpdate(phoneIds, updateData) {
    const [updatedRowsCount] = await Phone.update(updateData, {
      where: {
        id: {
          [Op.in]: phoneIds
        }
      }
    });
    return updatedRowsCount;
  }

  /**
   * Получить статистику по статусам
   * Оптимизированный запрос с группировкой
   */
  async getStatusStats() {
    return await Phone.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
  }

  /**
   * Найти телефоны по проекту
   */
  async findByProject(projectId, options = {}) {
    return await Phone.findAll({
      where: { projectId },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      ...options
    });
  }

  /**
   * Найти свободные телефоны
   */
  async findAvailable(limit = null) {
    const options = {
      where: { status: 'free' },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ],
      order: [['dateSetStatusFree', 'ASC']] // Сначала те, что дольше свободны
    };

    if (limit) {
      options.limit = limit;
    }

    return await Phone.findAll(options);
  }

  /**
   * Поиск телефонов по тексту
   * Поиск по модели, устройству, IP адресу
   */
  async searchByText(searchText, options = {}) {
    const where = {
      [Op.or]: [
        { model: { [Op.like]: `%${searchText}%` } },
        { device: { [Op.like]: `%${searchText}%` } },
        { ipAddress: { [Op.like]: `%${searchText}%` } },
        { name: { [Op.like]: `%${searchText}%` } }
      ]
    };

    return await Phone.findAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      ...options
    });
  }

  /**
   * Получить телефоны с истекшими статусами
   * Для автоматической очистки зависших статусов
   */
  async findWithExpiredStatus(hoursThreshold = 24) {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

    return await Phone.findAll({
      where: {
        status: 'busy',
        dateSetStatusBusy: {
          [Op.lt]: thresholdDate
        }
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });
  }

  /**
   * Получить детальную статистику по телефонам
   */
  async getDetailedStats() {
    const [statusStats, projectStats, recentActivity] = await Promise.all([
      // Статистика по статусам
      this.getStatusStats(),
      
      // Статистика по проектам
      Phone.findAll({
        attributes: [
          'projectId',
          [sequelize.fn('COUNT', sequelize.col('Phone.id')), 'count']
        ],
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['name']
          }
        ],
        group: ['projectId', 'project.id'],
        raw: true
      }),

      // Последняя активность
      Phone.findAll({
        attributes: ['status', 'dateSetStatusBusy', 'dateSetStatusFree', 'dateLastReboot'],
        where: {
          [Op.or]: [
            { dateSetStatusBusy: { [Op.gte]: sequelize.literal('DATE_SUB(NOW(), INTERVAL 1 HOUR)') } },
            { dateSetStatusFree: { [Op.gte]: sequelize.literal('DATE_SUB(NOW(), INTERVAL 1 HOUR)') } },
            { dateLastReboot: { [Op.gte]: sequelize.literal('DATE_SUB(NOW(), INTERVAL 1 HOUR)') } }
          ]
        },
        order: [['updatedAt', 'DESC']],
        limit: 10
      })
    ]);

    return {
      statusStats,
      projectStats,
      recentActivity: recentActivity.length
    };
  }

  // ========================================================================
  // ПРИВАТНЫЕ МЕТОДЫ
  // ========================================================================

  /**
   * Построить WHERE условие из фильтров
   */
  buildWhereClause(filters) {
    const where = {};

    // Фильтр по статусу
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        where.status = { [Op.in]: filters.status };
      } else {
        where.status = filters.status;
      }
    }

    // Фильтр по проекту
    if (filters.projectId) {
      if (Array.isArray(filters.projectId)) {
        where.projectId = { [Op.in]: filters.projectId };
      } else {
        where.projectId = filters.projectId;
      }
    }

    // Поиск по тексту
    if (filters.search) {
      where[Op.or] = [
        { model: { [Op.like]: `%${filters.search}%` } },
        { device: { [Op.like]: `%${filters.search}%` } },
        { ipAddress: { [Op.like]: `%${filters.search}%` } },
        { androidVersion: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    // Фильтр по дате создания
    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {};
      
      if (filters.createdFrom) {
        where.createdAt[Op.gte] = new Date(filters.createdFrom);
      }
      
      if (filters.createdTo) {
        where.createdAt[Op.lte] = new Date(filters.createdTo);
      }
    }

    // Фильтр по IP адресу
    if (filters.ipAddress) {
      where.ipAddress = { [Op.like]: `%${filters.ipAddress}%` };
    }

    // Фильтр по модели
    if (filters.model) {
      where.model = { [Op.like]: `%${filters.model}%` };
    }

    return where;
  }
}

module.exports = PhoneRepository;