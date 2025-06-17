const { Project, Proxy, Phone, Activity, sequelize } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Получить список проектов
const getProjects = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { transliterateName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Project.findAndCountAll({
      where,
      include: [
        {
          model: Proxy,
          as: 'proxies',
          attributes: ['id', 'status'],
          required: false
        },
        {
          model: Phone,
          as: 'phones',
          attributes: ['id', 'status'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Добавляем статистику для каждого проекта
    const projectsWithStats = rows.map(project => {
      const projectData = project.toJSON();
      
      // Подсчитываем статистику прокси
      const proxyStats = {
        total: projectData.proxies ? projectData.proxies.length : 0,
        free: projectData.proxies ? projectData.proxies.filter(p => p.status === 'free').length : 0,
        busy: projectData.proxies ? projectData.proxies.filter(p => p.status === 'busy').length : 0
      };

      // Подсчитываем статистику телефонов
      const phoneStats = {
        total: projectData.phones ? projectData.phones.length : 0,
        free: projectData.phones ? projectData.phones.filter(p => p.status === 'free').length : 0,
        busy: projectData.phones ? projectData.phones.filter(p => p.status === 'busy').length : 0
      };

      return {
        ...projectData,
        stats: {
          proxies: proxyStats,
          phones: phoneStats
        },
        proxies: undefined, // Убираем детали прокси из ответа
        phones: undefined   // Убираем детали телефонов из ответа
      };
    });

    res.json({
      success: true,
      data: {
        projects: projectsWithStats,
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

// Получить проект по ID
const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id, {
      include: [
        {
          model: Proxy,
          as: 'proxies',
          attributes: ['id', 'ipPort', 'status', 'country']
        },
        {
          model: Phone,
          as: 'phones',
          attributes: ['id', 'model', 'device', 'status']
        }
      ]
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// Создать проект
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Название проекта обязательно'
      });
    }

    // Создаем транслитерированное имя
    const transliterateName = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, '')
      .replace(/\s+/g, '_')
      .trim();

    const project = await Project.create({
      name,
      transliterateName,
      description
    });

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Создан проект: ${project.name}`,
      entityType: 'project',
      entityId: project.id,
      actionType: 'create'
    });

    logger.info('Project created', { projectId: project.id, name: project.name });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// Обновить проект
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    const oldData = { ...project.dataValues };

    // Обновляем транслитерированное имя если изменилось название
    if (req.body.name && req.body.name !== project.name) {
      req.body.transliterateName = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/gi, '')
        .replace(/\s+/g, '_')
        .trim();
    }

    await project.update(req.body);

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Обновлен проект: ${project.name}`,
      entityType: 'project',
      entityId: project.id,
      actionType: 'update',
      metadata: {
        oldData: oldData,
        newData: req.body
      }
    });

    logger.info('Project updated', { projectId: project.id, name: project.name });

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// Удалить проект
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    // Проверяем есть ли связанные ресурсы
    const proxyCount = await Proxy.count({ where: { projectId: id } });
    const phoneCount = await Phone.count({ where: { projectId: id } });

    if (proxyCount > 0 || phoneCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Нельзя удалить проект. К нему привязано ${proxyCount} прокси и ${phoneCount} телефонов`,
        details: {
          proxies: proxyCount,
          phones: phoneCount
        }
      });
    }

    const deletedData = { name: project.name, id: project.id };

    await project.destroy();

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Удален проект: ${deletedData.name}`,
      entityType: 'project',
      entityId: deletedData.id,
      actionType: 'delete'
    });

    logger.info('Project deleted', { projectId: deletedData.id, name: deletedData.name });

    res.json({
      success: true,
      message: 'Проект успешно удален'
    });
  } catch (error) {
    next(error);
  }
};

// Получить статистику проекта
const getProjectStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    // Статистика прокси
    const proxyStats = await Proxy.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { projectId: id },
      group: ['status']
    });

    // Статистика телефонов
    const phoneStats = await Phone.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { projectId: id },
      group: ['status']
    });

    const proxyStatsObject = proxyStats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.dataValues.count);
      return acc;
    }, {});

    const phoneStatsObject = phoneStats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.dataValues.count);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name
        },
        stats: {
          proxies: {
            total: Object.values(proxyStatsObject).reduce((a, b) => a + b, 0),
            byStatus: proxyStatsObject
          },
          phones: {
            total: Object.values(phoneStatsObject).reduce((a, b) => a + b, 0),
            byStatus: phoneStatsObject
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats
};