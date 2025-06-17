const { Proxy, Project, Activity, sequelize } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Получить список прокси
const getProxies = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      country,
      projectId,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Фильтры
    if (status) {
      where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }

    if (country) {
      where.country = Array.isArray(country) ? { [Op.in]: country } : country;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (search) {
      where[Op.or] = [
        { ipPort: { [Op.like]: `%${search}%` } },
        { login: { [Op.like]: `%${search}%` } },
        { country: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Proxy.findAndCountAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        proxies: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
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
          as: 'project',
          attributes: ['id', 'name']
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
      data: proxy
    });
  } catch (error) {
    next(error);
  }
};

// Создать прокси
const createProxy = async (req, res, next) => {
  try {
    const proxyData = {
      ...req.body,
      dateSetStatusFree: req.body.status === 'free' ? new Date() : null,
      dateSetStatusBusy: req.body.status === 'busy' ? new Date() : null,
      dateLastChangeIp: new Date()
    };

    const proxy = await Proxy.create(proxyData);

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Создан прокси: ${proxy.ipPort}`,
      entityType: 'proxy',
      entityId: proxy.id,
      actionType: 'create'
    });

    logger.info('Proxy created', { proxyId: proxy.id, ipPort: proxy.ipPort });

    // Получаем созданный прокси с проектом
    const createdProxy = await Proxy.findByPk(proxy.id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdProxy
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

    const oldData = { ...proxy.dataValues };
    
    // Обновляем даты статуса при изменении статуса
    if (req.body.status && req.body.status !== proxy.status) {
      const now = new Date();
      if (req.body.status === 'free') {
        req.body.dateSetStatusFree = now;
        req.body.dateSetStatusBusy = null;
      } else if (req.body.status === 'busy') {
        req.body.dateSetStatusBusy = now;
        req.body.dateSetStatusFree = null;
      }
    }

    await proxy.update(req.body);

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Обновлен прокси: ${proxy.ipPort}`,
      entityType: 'proxy',
      entityId: proxy.id,
      actionType: 'update',
      metadata: {
        oldData: oldData,
        newData: req.body
      }
    });

    logger.info('Proxy updated', { proxyId: proxy.id, ipPort: proxy.ipPort });

    // Получаем обновленный прокси с проектом
    const updatedProxy = await Proxy.findByPk(proxy.id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedProxy
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

    const deletedData = { ipPort: proxy.ipPort, id: proxy.id };

    await proxy.destroy();

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Удален прокси: ${deletedData.ipPort}`,
      entityType: 'proxy',
      entityId: deletedData.id,
      actionType: 'delete'
    });

    logger.info('Proxy deleted', { proxyId: deletedData.id, ipPort: deletedData.ipPort });

    res.json({
      success: true,
      message: 'Прокси успешно удален'
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

    const newStatus = proxy.status === 'free' ? 'busy' : 'free';
    const now = new Date();

    const updateData = { status: newStatus };
    
    if (newStatus === 'free') {
      updateData.dateSetStatusFree = now;
      updateData.dateSetStatusBusy = null;
    } else {
      updateData.dateSetStatusBusy = now;
      updateData.dateSetStatusFree = null;
    }

    await proxy.update(updateData);

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Изменен статус прокси ${proxy.ipPort} с "${proxy.status}" на "${newStatus}"`,
      entityType: 'proxy',
      entityId: proxy.id,
      actionType: 'status_toggle',
      metadata: {
        oldStatus: proxy.status,
        newStatus: newStatus
      }
    });

    logger.info('Proxy status toggled', { 
      proxyId: proxy.id, 
      ipPort: proxy.ipPort,
      oldStatus: proxy.status,
      newStatus: newStatus 
    });

    res.json({
      success: true,
      data: proxy
    });
  } catch (error) {
    next(error);
  }
};

// Получить статистику прокси
const getProxyStats = async (req, res, next) => {
  try {
    const stats = await Proxy.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const totalCount = await Proxy.count();

    const statsObject = stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.dataValues.count);
      return acc;
    }, {});

    // Статистика по странам
    const countryStats = await Proxy.findAll({
      attributes: [
        'country',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        country: { [Op.not]: null }
      },
      group: ['country'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total: totalCount,
        byStatus: statsObject,
        byCountry: countryStats.map(stat => ({
          country: stat.country,
          count: parseInt(stat.dataValues.count)
        }))
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
  toggleProxyStatus,
  getProxyStats
};