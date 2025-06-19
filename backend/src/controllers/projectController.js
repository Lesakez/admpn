const { Project, Proxy, Phone, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Получить список проектов с фильтрацией и пагинацией
const getProjects = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'id',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Project.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    // Получаем статистику для каждого проекта
    const projectsWithStats = await Promise.all(
      rows.map(async (project) => {
        const [proxiesCount, phonesCount] = await Promise.all([
          Proxy.count({ where: { project_id: project.id } }),
          Phone.count({ where: { project_id: project.id } })
        ]);

        return {
          ...project.toJSON(),
          stats: {
            proxies: proxiesCount,
            phones: phonesCount
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        projects: projectsWithStats,
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

// Получить проект по ID с детальной статистикой
const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    // Получаем связанные данные
    const [proxies, phones] = await Promise.all([
      Proxy.findAll({
        where: { project_id: id },
        attributes: ['id', 'ip_port', 'status', 'country']
      }),
      Phone.findAll({
        where: { project_id: id },
        attributes: ['id', 'model', 'status', 'device']
      })
    ]);

    // Формируем детальную статистику
    const stats = {
      proxies: {
        total: proxies.length,
        byStatus: {},
        byCountry: {}
      },
      phones: {
        total: phones.length,
        byStatus: {},
        byModel: {}
      }
    };

    // Статистика прокси
    proxies.forEach(proxy => {
      // По статусу
      stats.proxies.byStatus[proxy.status] = 
        (stats.proxies.byStatus[proxy.status] || 0) + 1;
      
      // По стране
      if (proxy.country) {
        stats.proxies.byCountry[proxy.country] = 
          (stats.proxies.byCountry[proxy.country] || 0) + 1;
      }
    });

    // Статистика телефонов
    phones.forEach(phone => {
      // По статусу
      stats.phones.byStatus[phone.status] = 
        (stats.phones.byStatus[phone.status] || 0) + 1;
      
      // По модели
      if (phone.model) {
        stats.phones.byModel[phone.model] = 
          (stats.phones.byModel[phone.model] || 0) + 1;
      }
    });

    const projectData = project.toJSON();

    res.json({
      success: true,
      data: {
        id: projectData.id,
        name: projectData.name,
        description: projectData.description,
        transliterateName: projectData.transliterateName,
        stats,
        // Добавляем связанные данные
        proxies: proxies.map(p => ({
          id: p.id,
          ipPort: p.ip_port,
          status: p.status,
          country: p.country
        })),
        phones: phones.map(p => ({
          id: p.id,
          model: p.model,
          status: p.status,
          device: p.device
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Создать новый проект
const createProject = async (req, res, next) => {
  try {
    const project = await Project.create(req.body);

    logger.info('Project created', { projectId: project.id, name: project.name });

    res.status(201).json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        transliterateName: project.transliterateName
      }
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

    await project.update(req.body);

    logger.info('Project updated', { projectId: project.id, name: project.name });

    res.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        transliterateName: project.transliterateName
      }
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

    // Используем транзакцию для атомарности
    await sequelize.transaction(async (t) => {
      // Отвязываем прокси
      await Proxy.update(
        { project_id: null },
        { 
          where: { project_id: id },
          transaction: t 
        }
      );

      // Отвязываем телефоны
      await Phone.update(
        { project_id: null },
        { 
          where: { project_id: id },
          transaction: t 
        }
      );

      // Удаляем проект
      await project.destroy({ transaction: t });
    });

    logger.info('Project deleted', { projectId: id, name: project.name });

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
    const [totalProjects, totalAssignedProxies, totalUnassignedProxies, 
           totalAssignedPhones, totalUnassignedPhones] = await Promise.all([
      Project.count(),
      Proxy.count({ where: { project_id: { [Op.ne]: null } } }),
      Proxy.count({ where: { project_id: null } }),
      Phone.count({ where: { project_id: { [Op.ne]: null } } }),
      Phone.count({ where: { project_id: null } })
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

    // Используем транзакцию для атомарности операции
    const result = await sequelize.transaction(async (t) => {
      const updates = [];

      if (proxyIds.length > 0) {
        updates.push(
          Proxy.update(
            { project_id: id }, 
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
            { project_id: id }, 
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
      phones: phoneIds.length
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

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectsStats,
  assignResources
};