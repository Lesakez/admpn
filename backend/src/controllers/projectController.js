// backend/src/controllers/projectController.js
const { Project, Proxy, Phone, Profile, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * ИСПРАВЛЕНИЯ В КОНТРОЛЛЕРЕ:
 * 1. Обрезанные методы дополнены полностью
 * 2. Добавлена правильная обработка ошибок
 * 3. Унифицированы форматы ответов
 * 4. Добавлена пагинация и фильтрация
 * 5. Исправлены SQL запросы с правильными полями
 */

// Получить список проектов с пагинацией и фильтрацией
const getProjects = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'created_at', // ИСПРАВЛЕНО: snake_case как в БД
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchCondition = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    // Получаем проекты с подсчетом связанных ресурсов
    const { count, rows: projects } = await Project.findAndCountAll({
      where: searchCondition,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
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
      ]
    });

    // Формируем статистику для каждого проекта
    const projectsWithStats = projects.map(project => {
      const proxies = project.proxies || [];
      const phones = project.phones || [];

      const stats = {
        proxies: {
          total: proxies.length,
          free: proxies.filter(p => p.status === 'free').length,
          busy: proxies.filter(p => p.status === 'busy').length
        },
        phones: {
          total: phones.length,
          free: phones.filter(p => p.status === 'free').length,
          busy: phones.filter(p => p.status === 'busy').length
        }
      };

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        transliterateName: project.transliterateName,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        stats
      };
    });

    res.json({
      success: true,
      data: {
        projects: projectsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Получить проект по ID с детальной статистикой
const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ИСПРАВЛЕНИЕ: Используем новый статический метод из модели
    const projectWithStats = await Project.getWithStats(id);
    
    if (!projectWithStats) {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    res.json({
      success: true,
      data: projectWithStats
    });
  } catch (error) {
    next(error);
  }
};

// Создать новый проект
const createProject = async (req, res, next) => {
  try {
    // ИСПРАВЛЕНИЕ: Добавлена полная валидация и обработка
    const { name, description, transliterateName } = req.body;

    // Проверяем уникальность имени
    const existingProject = await Project.findOne({ where: { name } });
    if (existingProject) {
      return res.status(400).json({
        success: false,
        error: 'Проект с таким именем уже существует'
      });
    }

    const project = await Project.create({
      name,
      description: description || null,
      transliterateName: transliterateName || null
    });

    logger.info('Project created', { 
      projectId: project.id, 
      name: project.name,
      userId: req.user?.id // Если есть аутентификация
    });

    res.status(201).json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        transliterateName: project.transliterateName,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      message: 'Проект успешно создан'
    });
  } catch (error) {
    next(error);
  }
};

// Обновить проект
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, transliterateName } = req.body;
    
    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    // ИСПРАВЛЕНИЕ: Проверяем уникальность имени только если оно изменяется
    if (name && name !== project.name) {
      const existingProject = await Project.findOne({ 
        where: { 
          name,
          id: { [Op.ne]: id } // Исключаем текущий проект
        }
      });
      
      if (existingProject) {
        return res.status(400).json({
          success: false,
          error: 'Проект с таким именем уже существует'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (transliterateName !== undefined) updateData.transliterateName = transliterateName;

    await project.update(updateData);

    logger.info('Project updated', { 
      projectId: project.id, 
      changes: Object.keys(updateData),
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        transliterateName: project.transliterateName,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      message: 'Проект успешно обновлен'
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

    // ИСПРАВЛЕНИЕ: Используем транзакцию для безопасного удаления
    await sequelize.transaction(async (t) => {
      // Отвязываем все связанные ресурсы
      await Promise.all([
        Proxy.update(
          { projectId: null }, 
          { where: { projectId: id }, transaction: t }
        ),
        Phone.update(
          { projectId: null }, 
          { where: { projectId: id }, transaction: t }
        )
      ]);

      // Удаляем проект
      await project.destroy({ transaction: t });
    });

    logger.info('Project deleted', { 
      projectId: id, 
      name: project.name,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Проект удален. Связанные ресурсы отвязаны.'
    });
  } catch (error) {
    next(error);
  }
};

// Получить общую статистику по всем проектам
const getProjectsStats = async (req, res, next) => {
  try {
    // ИСПРАВЛЕНИЕ: Оптимизированные запросы с правильными полями
    const [totalProjects, totalAssignedProxies, totalUnassignedProxies, 
           totalAssignedPhones, totalUnassignedPhones] = await Promise.all([
      Project.count(),
      Proxy.count({ where: { projectId: { [Op.ne]: null } } }),
      Proxy.count({ where: { projectId: null } }),
      Phone.count({ where: { projectId: { [Op.ne]: null } } }),
      Phone.count({ where: { projectId: null } })
    ]);

    res.json({
      success: true,
      data: {
        projects: {
          total: totalProjects
        },
        proxies: {
          assigned: totalAssignedProxies,
          unassigned: totalUnassignedProxies,
          total: totalAssignedProxies + totalUnassignedProxies
        },
        phones: {
          assigned: totalAssignedPhones,
          unassigned: totalUnassignedPhones,
          total: totalAssignedPhones + totalUnassignedPhones
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Массовое назначение ресурсов проекту
const assignResources = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { proxyIds = [], phoneIds = [] } = req.body;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    // ИСПРАВЛЕНИЕ: Валидация существования ресурсов
    if (proxyIds.length > 0) {
      const existingProxies = await Proxy.count({
        where: { id: { [Op.in]: proxyIds } }
      });
      
      if (existingProxies !== proxyIds.length) {
        return res.status(400).json({
          success: false,
          error: 'Некоторые прокси не найдены'
        });
      }
    }

    if (phoneIds.length > 0) {
      const existingPhones = await Phone.count({
        where: { id: { [Op.in]: phoneIds } }
      });
      
      if (existingPhones !== phoneIds.length) {
        return res.status(400).json({
          success: false,
          error: 'Некоторые телефоны не найдены'
        });
      }
    }

    // Используем транзакцию для атомарности операции
    const result = await sequelize.transaction(async (t) => {
      const updates = [];

      if (proxyIds.length > 0) {
        updates.push(
          Proxy.update(
            { projectId: id }, 
            { 
              where: { id: { [Op.in]: proxyIds } },
              transaction: t 
            }
          )
        );
      }

      if (phoneIds.length > 0) {
        updates.push(
          Phone.update(
            { projectId: id }, 
            { 
              where: { id: { [Op.in]: phoneIds } },
              transaction: t 
            }
          )
        );
      }

      const results = await Promise.all(updates);
      return results;
    });

    logger.info('Resources assigned to project', { 
      projectId: id,
      proxies: proxyIds.length,
      phones: phoneIds.length,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Ресурсы успешно назначены проекту',
      data: {
        assignedProxies: proxyIds.length,
        assignedPhones: phoneIds.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// НОВЫЙ МЕТОД: Массовое удаление проектов
const bulkDeleteProjects = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать массив ID проектов'
      });
    }

    // Проверяем существование проектов
    const existingProjects = await Project.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: ['id', 'name']
    });

    if (existingProjects.length !== ids.length) {
      return res.status(400).json({
        success: false,
        error: 'Некоторые проекты не найдены'
      });
    }

    await sequelize.transaction(async (t) => {
      // Отвязываем ресурсы
      await Promise.all([
        Proxy.update(
          { projectId: null }, 
          { where: { projectId: { [Op.in]: ids } }, transaction: t }
        ),
        Phone.update(
          { projectId: null }, 
          { where: { projectId: { [Op.in]: ids } }, transaction: t }
        )
      ]);

      // Удаляем проекты
      await Project.destroy({
        where: { id: { [Op.in]: ids } },
        transaction: t
      });
    });

    logger.info('Bulk delete projects', { 
      projectIds: ids,
      count: ids.length,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: `Удалено проектов: ${ids.length}. Связанные ресурсы отвязаны.`,
      data: {
        deletedCount: ids.length,
        deletedProjects: existingProjects.map(p => ({ id: p.id, name: p.name }))
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
  getProjectsStats,
  assignResources,
  bulkDeleteProjects // НОВЫЙ МЕТОД
};