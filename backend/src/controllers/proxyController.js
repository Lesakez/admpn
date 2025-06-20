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
      sortBy = 'id',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Фильтры
    if (status) where.status = status;
    if (country) where.country = country;
    if (projectId) where.projectId = projectId;
    if (search) {
      where[Op.or] = [
        { ipPort: { [Op.like]: `%${search}%` } },
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
          as: 'project', // Используем алиас 'project'
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    // Преобразуем данные для frontend
    const proxies = rows.map(proxy => ({
      id: proxy.id,
      ipPort: proxy.ipPort,
      protocol: proxy.protocol,
      login: proxy.login,
      password: proxy.password,
      country: proxy.country,
      status: proxy.status,
      projectId: proxy.projectId,
      project: proxy.project ? {
        id: proxy.project.id,
        name: proxy.project.name
      } : null,
      notes: proxy.notes,
      changeIpUrl: proxy.changeIpUrl, // Добавляем changeIpUrl в ответ
      dateLastChangeIp: proxy.dateLastChangeIp,
      createdAt: proxy.createdAt,
      updatedAt: proxy.updatedAt
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
          as: 'project', // Используем алиас 'project'
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
        ipPort: proxy.ipPort,
        protocol: proxy.protocol,
        login: proxy.login,
        password: proxy.password,
        country: proxy.country,
        status: proxy.status,
        projectId: proxy.projectId,
        project: proxy.project ? {
          id: proxy.project.id,
          name: proxy.project.name
        } : null,
        notes: proxy.notes,
        changeIpUrl: proxy.changeIpUrl,
        dateLastChangeIp: proxy.dateLastChangeIp,
        createdAt: proxy.createdAt,
        updatedAt: proxy.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Создать новый прокси
const createProxy = async (req, res, next) => {
  try {
    const proxy = await Proxy.create(req.body);
    
    // Получаем созданный прокси с проектом
    const createdProxy = await Proxy.findByPk(proxy.id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    logger.info('Proxy created', { proxyId: proxy.id });

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

    await proxy.update(req.body);

    // Получаем обновленный прокси с проектом
    const updatedProxy = await Proxy.findByPk(proxy.id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    logger.info('Proxy updated', { proxyId: proxy.id });

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

    await proxy.destroy();

    logger.info('Proxy deleted', { proxyId: id });

    res.json({
      success: true,
      message: 'Прокси успешно удален'
    });
  } catch (error) {
    next(error);
  }
};

// Изменить статус прокси
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

    const updateData = {
      status: newStatus
    };

    if (newStatus === 'free') {
      updateData.dateSetStatusFree = now;
      updateData.dateSetStatusBusy = null;
    } else {
      updateData.dateSetStatusBusy = now;
      updateData.dateSetStatusFree = null;
    }

    await proxy.update(updateData);

    logger.info('Proxy status toggled', { proxyId: proxy.id, newStatus });

    res.json({
      success: true,
      data: proxy
    });
  } catch (error) {
    next(error);
  }
};

// Сменить IP прокси
const changeProxyIP = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const proxy = await Proxy.findByPk(id);
    
    if (!proxy) {
      return res.status(404).json({
        success: false,
        error: 'Прокси не найден'
      });
    }

    if (!proxy.changeIpUrl) {
      return res.status(400).json({
        success: false,
        error: 'URL для смены IP не настроен для этого прокси'
      });
    }

    try {
      // Выполняем HTTP запрос по ссылке смены IP
      const https = require('https');
      const http = require('http');
      const url = require('url');
      
      const parsedUrl = url.parse(proxy.changeIpUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      logger.info('Attempting to change IP', { 
        proxyId: proxy.id, 
        changeIpUrl: proxy.changeIpUrl 
      });
      
      const responseData = await new Promise((resolve, reject) => {
        const request = client.request(parsedUrl, (response) => {
          let data = '';
          
          response.on('data', chunk => {
            data += chunk;
          });
          
          response.on('end', () => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
              logger.info('IP change request successful', { 
                proxyId: proxy.id, 
                statusCode: response.statusCode,
                responseData: data.slice(0, 200)
              });
              resolve(data);
            } else if (response.statusCode === 400) {
              // HTTP 400 обычно означает ограничения прокси-сервера (например, нужно ждать)
              logger.warn('IP change request rate limited', { 
                proxyId: proxy.id, 
                statusCode: response.statusCode,
                responseData: data
              });
              reject(new Error(`Ограничение прокси-сервера: ${data}`));
            } else {
              logger.error('IP change request failed', { 
                proxyId: proxy.id, 
                statusCode: response.statusCode,
                responseData: data
              });
              reject(new Error(`HTTP ${response.statusCode}: ${data}`));
            }
          });
        });
        
        request.on('error', (error) => {
          logger.error('IP change request error', { 
            proxyId: proxy.id, 
            error: error.message 
          });
          reject(error);
        });
        
        request.setTimeout(30000, () => {
          logger.error('IP change request timeout', { proxyId: proxy.id });
          reject(new Error('Timeout: запрос превысил 30 секунд'));
        });
        
        request.end();
      });
      
      // Обновляем дату последней смены IP
      await proxy.update({
        dateLastChangeIp: new Date()
      });

      logger.info('Proxy IP changed successfully', { 
        proxyId: proxy.id,
        newTimestamp: proxy.dateLastChangeIp
      });

      res.json({
        success: true,
        message: 'IP успешно изменен',
        data: {
          id: proxy.id,
          ipPort: proxy.ipPort,
          dateLastChangeIp: proxy.dateLastChangeIp,
          changeIpUrl: proxy.changeIpUrl,
          responseData: responseData.slice(0, 500) // Первые 500 символов ответа
        }
      });
      
    } catch (error) {
      logger.error('Failed to change proxy IP', { 
        proxyId: proxy.id, 
        error: error.message,
        changeIpUrl: proxy.changeIpUrl 
      });
      
      return res.status(500).json({
        success: false,
        error: `Ошибка смены IP: ${error.message}`
      });
    }
  } catch (error) {
    logger.error('Change IP controller error', { error: error.message });
    next(error);
  }
};

// Получить статистику прокси
const getProxyStats = async (req, res, next) => {
  try {
    const totalCount = await Proxy.count();
    
    const statusStats = await Proxy.findAll({
      attributes: [
        'status',
        [Proxy.sequelize.fn('COUNT', Proxy.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const countryStats = await Proxy.findAll({
      attributes: [
        'country',
        [Proxy.sequelize.fn('COUNT', Proxy.sequelize.col('id')), 'count']
      ],
      where: {
        country: { [Op.not]: null }
      },
      group: ['country'],
      order: [[Proxy.sequelize.fn('COUNT', Proxy.sequelize.col('id')), 'DESC']],
      limit: 10
    });

    const protocolStats = await Proxy.findAll({
      attributes: [
        'protocol',
        [Proxy.sequelize.fn('COUNT', Proxy.sequelize.col('id')), 'count']
      ],
      where: {
        protocol: { [Op.not]: null }
      },
      group: ['protocol'],
      order: [[Proxy.sequelize.fn('COUNT', Proxy.sequelize.col('id')), 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total: totalCount,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        byCountry: countryStats.map(stat => ({
          country: stat.country,
          count: parseInt(stat.dataValues.count)
        })),
        byProtocol: protocolStats.map(stat => ({
          protocol: stat.protocol,
          count: parseInt(stat.dataValues.count)
        }))
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

module.exports = {
  getProxies,
  getProxy,
  createProxy,
  updateProxy,
  deleteProxy,
  toggleProxyStatus,
  changeProxyIP, // ДОБАВЛЕНА ФУНКЦИЯ СМЕНЫ IP
  getProxyStats,
  bulkDeleteProxies,
  bulkUpdateStatus
};