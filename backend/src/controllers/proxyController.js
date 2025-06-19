const { Proxy, Project } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Получить список прокси с фильтрацией и пагинацией
const getProxies = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      country,
      projectId,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Фильтры
    if (status) where.status = status;
    if (country) where.country = country;
    if (projectId) where.project_id = projectId;
    if (search) {
      where[Op.or] = [
        { ip_port: { [Op.like]: `%${search}%` } },
        { login: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Proxy.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Project,
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    // Преобразуем данные для frontend
    const proxies = rows.map(proxy => ({
      id: proxy.id,
      ipPort: proxy.ip_port,
      protocol: proxy.protocol,
      login: proxy.login,
      password: proxy.password,
      country: proxy.country,
      status: proxy.status,
      projectId: proxy.project_id,
      project: proxy.Project ? {
        id: proxy.Project.id,
        name: proxy.Project.name
      } : null,
      notes: proxy.notes,
      createdAt: proxy.created_at,
      updatedAt: proxy.updated_at
    }));

    res.json({
      success: true,
      data: {
        proxies,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Получить прокси по ID
const getProxy = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const proxy = await Proxy.findByPk(id, {
      include: [
        {
          model: Project,
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    if (!proxy) {
      return res.status(404).json({
        success: false,
        error: 'Прокси не найден'
      });
    }

    res.json({
      success: true,
      data: {
        id: proxy.id,
        ipPort: proxy.ip_port,
        protocol: proxy.protocol,
        login: proxy.login,
        password: proxy.password,
        country: proxy.country,
        status: proxy.status,
        projectId: proxy.project_id,
        project: proxy.Project ? {
          id: proxy.Project.id,
          name: proxy.Project.name
        } : null,
        notes: proxy.notes,
        createdAt: proxy.created_at,
        updatedAt: proxy.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Создать новый прокси
const createProxy = async (req, res, next) => {
  try {
    // Преобразуем camelCase в snake_case для БД
    const proxyData = {
      ip_port: req.body.ipPort,
      protocol: req.body.protocol || 'http',
      login: req.body.login,
      password: req.body.password,
      country: req.body.country,
      status: req.body.status || 'free',
      project_id: req.body.projectId || null,
      notes: req.body.notes
    };

    const proxy = await Proxy.create(proxyData);
    
    logger.info('Proxy created successfully', { proxyId: proxy.id });

    res.status(201).json({
      success: true,
      data: {
        id: proxy.id,
        ipPort: proxy.ip_port,
        protocol: proxy.protocol,
        login: proxy.login,
        password: proxy.password,
        country: proxy.country,
        status: proxy.status,
        projectId: proxy.project_id,
        notes: proxy.notes,
        createdAt: proxy.created_at,
        updatedAt: proxy.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Обновить прокси
const updateProxy = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const proxy = await Proxy.findByPk(id);
    if (!proxy) {
      return res.status(404).json({
        success: false,
        error: 'Прокси не найден'
      });
    }

    // Преобразуем camelCase в snake_case для БД
    const updateData = {};
    if (req.body.ipPort !== undefined) updateData.ip_port = req.body.ipPort;
    if (req.body.protocol !== undefined) updateData.protocol = req.body.protocol;
    if (req.body.login !== undefined) updateData.login = req.body.login;
    if (req.body.password !== undefined) updateData.password = req.body.password;
    if (req.body.country !== undefined) updateData.country = req.body.country;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.projectId !== undefined) updateData.project_id = req.body.projectId;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;

    await proxy.update(updateData);
    
    logger.info('Proxy updated successfully', { proxyId: id });

    res.json({
      success: true,
      data: {
        id: proxy.id,
        ipPort: proxy.ip_port,
        protocol: proxy.protocol,
        login: proxy.login,
        password: proxy.password,
        country: proxy.country,
        status: proxy.status,
        projectId: proxy.project_id,
        notes: proxy.notes,
        createdAt: proxy.created_at,
        updatedAt: proxy.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Удалить прокси
const deleteProxy = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const proxy = await Proxy.findByPk(id);
    if (!proxy) {
      return res.status(404).json({
        success: false,
        error: 'Прокси не найден'
      });
    }

    await proxy.destroy();
    
    logger.info('Proxy deleted successfully', { proxyId: id });

    res.json({
      success: true,
      message: 'Прокси успешно удален'
    });
  } catch (error) {
    next(error);
  }
};

// Получить статистику прокси - ДОБАВЛЕНО
const getProxyStats = async (req, res, next) => {
  try {
    // Получаем статистику по статусам
    const statusStats = await Proxy.findAll({
      attributes: [
        'status',
        [Proxy.sequelize.fn('COUNT', Proxy.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Получаем статистику по странам
    const countryStats = await Proxy.findAll({
      attributes: [
        'country',
        [Proxy.sequelize.fn('COUNT', Proxy.sequelize.col('id')), 'count']
      ],
      where: {
        country: { [Op.ne]: null }
      },
      group: ['country'],
      order: [[Proxy.sequelize.fn('COUNT', Proxy.sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Получаем статистику по протоколам
    const protocolStats = await Proxy.findAll({
      attributes: [
        'protocol',
        [Proxy.sequelize.fn('COUNT', Proxy.sequelize.col('id')), 'count']
      ],
      group: ['protocol'],
      raw: true
    });

    // Общая статистика
    const total = await Proxy.count();
    const assignedToProjects = await Proxy.count({
      where: { project_id: { [Op.ne]: null } }
    });

    res.json({
      success: true,
      data: {
        total,
        assignedToProjects,
        unassigned: total - assignedToProjects,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {}),
        byCountry: countryStats.reduce((acc, stat) => {
          acc[stat.country] = parseInt(stat.count);
          return acc;
        }, {}),
        byProtocol: protocolStats.reduce((acc, stat) => {
          acc[stat.protocol] = parseInt(stat.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};

// Массовое удаление прокси
const bulkDeleteProxies = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Массив ID обязателен'
      });
    }

    const deletedCount = await Proxy.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    logger.info('Bulk delete proxies', { count: deletedCount });

    res.json({
      success: true,
      data: {
        deletedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Массовое обновление статуса
const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Массив ID обязателен'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Статус обязателен'
      });
    }

    const [updatedCount] = await Proxy.update(
      { status },
      {
        where: {
          id: {
            [Op.in]: ids
          }
        }
      }
    );

    logger.info('Bulk update proxy status', { count: updatedCount, status });

    res.json({
      success: true,
      data: {
        updatedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Переключить статус прокси
const toggleProxyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const proxy = await Proxy.findByPk(id);
    if (!proxy) {
      return res.status(404).json({
        success: false,
        error: 'Прокси не найден'
      });
    }

    // Переключаем между free и busy
    const newStatus = proxy.status === 'free' ? 'busy' : 'free';
    await proxy.update({ status: newStatus });
    
    logger.info('Proxy status toggled', { proxyId: id, newStatus });

    res.json({
      success: true,
      data: {
        id: proxy.id,
        status: newStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProxies,
  getProxy,
  createProxy,
  updateProxy,
  deleteProxy,
  getProxyStats, // ДОБАВЛЕНО
  bulkDeleteProxies,
  bulkUpdateStatus,
  toggleProxyStatus
};