// backend/src/controllers/projectController.js

const { Project, Proxy, Phone, Profile, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Получить список проектов с пагинацией и статистикой
 */
const getProjects = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const validatedPage = Math.max(1, parseInt(page));
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (validatedPage - 1) * validatedLimit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { transliterateName: { [Op.like]: `%${search}%` } }
      ];
    }

    const validSortOrders = ['ASC', 'DESC', 'asc', 'desc'];
    const order = validSortOrders.includes(sortOrder) 
      ? [[sortBy, sortOrder.toUpperCase()]]
      : [['created_at', 'DESC']];

    // ИСПРАВЛЕНО: Убираем distinct и делаем отдельные запросы
    const [projects, totalCount] = await Promise.all([
      Project.findAll({
        where,
        limit: validatedLimit,
        offset,
        order
      }),
      Project.count({ where })
    ]);

    // Получаем статистику для найденных проектов
    const projectsWithStats = [];
    
    for (const project of projects) {
      try {
        // Получаем статистику по каждому проекту отдельными запросами
        const [proxiesStats, phonesStats, profilesStats] = await Promise.all([
          Proxy.findAll({
            where: { projectId: project.id },
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['status'],
            raw: true
          }).catch(() => []),
          
          Phone.findAll({
            where: { projectId: project.id },
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['status'],
            raw: true
          }).catch(() => []),
          
          Profile ? Profile.findAll({
            where: { projectId: project.id },
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['status'],
            raw: true
          }).catch(() => []) : Promise.resolve([])
        ]);

        // Формируем статистику
        const proxyStats = {
          total: proxiesStats.reduce((sum, item) => sum + parseInt(item.count), 0),
          free: proxiesStats.find(item => item.status === 'free')?.count || 0,
          busy: proxiesStats.find(item => item.status === 'busy')?.count || 0,
          blocked: proxiesStats.find(item => item.status === 'blocked')?.count || 0,
          error: proxiesStats.find(item => item.status === 'error')?.count || 0
        };

        const phoneStats = {
          total: phonesStats.reduce((sum, item) => sum + parseInt(item.count), 0),
          free: phonesStats.find(item => item.status === 'free')?.count || 0,
          busy: phonesStats.find(item => item.status === 'busy')?.count || 0
        };

        const profileStats = {
          total: profilesStats.reduce((sum, item) => sum + parseInt(item.count), 0),
          active: profilesStats.find(item => item.status === 'active')?.count || 0,
          created: profilesStats.find(item => item.status === 'created')?.count || 0,
          working: profilesStats.find(item => item.status === 'working')?.count || 0
        };

        projectsWithStats.push({
          ...project.toJSON(),
          stats: {
            proxies: proxyStats,
            phones: phoneStats,
            profiles: profileStats
          }
        });
      } catch (error) {
        logger.error(`Error getting stats for project ${project.id}:`, error);
        // Добавляем проект без статистики
        projectsWithStats.push({
          ...project.toJSON(),
          stats: {
            proxies: { total: 0, free: 0, busy: 0, blocked: 0, error: 0 },
            phones: { total: 0, free: 0, busy: 0 },
            profiles: { total: 0, active: 0, created: 0, working: 0 }
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        projects: projectsWithStats,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total: totalCount,
          pages: Math.ceil(totalCount / validatedLimit),
          hasNext: validatedPage < Math.ceil(totalCount / validatedLimit),
          hasPrev: validatedPage > 1
        }
      }
    });
  } catch (error) {
    logger.error('Error getting projects:', error);
    next(error);
  }
};

/**
 * Получить проект по ID с детальной статистикой
 */
const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID проекта'
      });
    }

    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    // ИСПРАВЛЕНО: Получаем связанные данные отдельными запросами
    const [proxies, phones, profiles] = await Promise.all([
      Proxy.findAll({
        where: { projectId: id },
        attributes: ['id', 'status', 'country', 'protocol', 'ipPort']
      }).catch(() => []),
      
      Phone.findAll({
        where: { projectId: id },
        attributes: ['id', 'status', 'model', 'androidVersion']
      }).catch(() => []),
      
      Profile ? Profile.findAll({
        where: { projectId: id },
        attributes: ['id', 'status', 'name', 'workspaceName']
      }).catch(() => []) : []
    ]);

    // Детальная статистика
    const stats = {
      proxies: {
        total: proxies.length,
        byStatus: proxies.reduce((acc, proxy) => {
          acc[proxy.status] = (acc[proxy.status] || 0) + 1;
          return acc;
        }, {}),
        byCountry: proxies.reduce((acc, proxy) => {
          if (proxy.country) {
            acc[proxy.country] = (acc[proxy.country] || 0) + 1;
          }
          return acc;
        }, {}),
        byProtocol: proxies.reduce((acc, proxy) => {
          if (proxy.protocol) {
            acc[proxy.protocol] = (acc[proxy.protocol] || 0) + 1;
          }
          return acc;
        }, {})
      },
      phones: {
        total: phones.length,
        byStatus: phones.reduce((acc, phone) => {
          acc[phone.status] = (acc[phone.status] || 0) + 1;
          return acc;
        }, {}),
        byModel: phones.reduce((acc, phone) => {
          if (phone.model) {
            acc[phone.model] = (acc[phone.model] || 0) + 1;
          }
          return acc;
        }, {})
      },
      profiles: {
        total: profiles.length,
        byStatus: profiles.reduce((acc, profile) => {
          acc[profile.status] = (acc[profile.status] || 0) + 1;
          return acc;
        }, {})
      }
    };

    res.json({
      success: true,
      data: {
        ...project.toJSON(),
        proxies,
        phones,
        profiles,
        stats
      }
    });
  } catch (error) {
    logger.error('Error getting project:', error);
    next(error);
  }
};

/**
 * Создать новый проект
 */
const createProject = async (req, res, next) => {
  try {
    const { name, description, transliterateName } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Название проекта обязательно'
      });
    }

    // Проверяем уникальность имени
    const existingProject = await Project.findOne({ where: { name: name.trim() } });
    if (existingProject) {
      return res.status(400).json({
        success: false,
        error: 'Проект с таким именем уже существует'
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      transliterateName: transliterateName ? transliterateName.trim() : null
    });

    logger.info('Project created:', { 
      projectId: project.id,
      name: project.name
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Проект успешно создан'
    });
  } catch (error) {
    logger.error('Error creating project:', error);
    next(error);
  }
};

/**
 * Обновить проект
 */
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, transliterateName } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID проекта'
      });
    }

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    // Проверяем уникальность имени если оно изменилось
    if (name && name.trim() !== project.name) {
      const existingProject = await Project.findOne({ 
        where: { 
          name: name.trim(),
          id: { [Op.ne]: id }
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
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (transliterateName !== undefined) updateData.transliterateName = transliterateName ? transliterateName.trim() : null;

    await project.update(updateData);

    logger.info('Project updated:', { 
      projectId: project.id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: project,
      message: 'Проект успешно обновлен'
    });
  } catch (error) {
    logger.error('Error updating project:', error);
    next(error);
  }
};

/**
 * Удалить проект
 */
const deleteProject = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID проекта'
      });
    }

    const project = await Project.findByPk(id, { transaction });
    if (!project) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    // ИСПРАВЛЕНО: Отвязываем все ресурсы от проекта с проверкой существования моделей
    const updatePromises = [];
    
    updatePromises.push(
      Proxy.update(
        { projectId: null },
        { where: { projectId: id }, transaction }
      ).catch(error => {
        logger.warn('Error updating proxies during project deletion:', error);
        return [0];
      })
    );
    
    updatePromises.push(
      Phone.update(
        { projectId: null },
        { where: { projectId: id }, transaction }
      ).catch(error => {
        logger.warn('Error updating phones during project deletion:', error);
        return [0];
      })
    );
    
    if (Profile) {
      updatePromises.push(
        Profile.update(
          { projectId: null },
          { where: { projectId: id }, transaction }
        ).catch(error => {
          logger.warn('Error updating profiles during project deletion:', error);
          return [0];
        })
      );
    }

    await Promise.all(updatePromises);

    await project.destroy({ transaction });
    await transaction.commit();

    logger.info('Project deleted:', { 
      projectId: id,
      name: project.name
    });

    res.json({
      success: true,
      message: 'Проект удален. Связанные ресурсы отвязаны.'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting project:', error);
    next(error);
  }
};

/**
 * Получить общую статистику по всем проектам
 */
const getProjectsStats = async (req, res, next) => {
  try {
    // ИСПРАВЛЕНО: Упрощаем запросы статистики
    const [
      totalProjects, 
      totalAssignedProxies, 
      totalUnassignedProxies, 
      totalAssignedPhones, 
      totalUnassignedPhones,
      totalAssignedProfiles,
      totalUnassignedProfiles
    ] = await Promise.all([
      Project.count().catch(() => 0),
      Proxy.count({ where: { projectId: { [Op.ne]: null } } }).catch(() => 0),
      Proxy.count({ where: { projectId: null } }).catch(() => 0),
      Phone.count({ where: { projectId: { [Op.ne]: null } } }).catch(() => 0),
      Phone.count({ where: { projectId: null } }).catch(() => 0),
      Profile ? Profile.count({ where: { projectId: { [Op.ne]: null } } }).catch(() => 0) : 0,
      Profile ? Profile.count({ where: { projectId: null } }).catch(() => 0) : 0
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
        },
        profiles: {
          assigned: totalAssignedProfiles,
          unassigned: totalUnassignedProfiles,
          total: totalAssignedProfiles + totalUnassignedProfiles
        }
      }
    });
  } catch (error) {
    logger.error('Error getting projects stats:', error);
    
    // Возвращаем базовую статистику в случае ошибки
    res.json({
      success: true,
      data: {
        projects: { total: 0 },
        proxies: { assigned: 0, unassigned: 0, total: 0 },
        phones: { assigned: 0, unassigned: 0, total: 0 },
        profiles: { assigned: 0, unassigned: 0, total: 0 }
      }
    });
  }
};

/**
 * Массовое назначение ресурсов проекту
 */
const assignResources = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { proxyIds = [], phoneIds = [], profileIds = [] } = req.body;

    if (!id || isNaN(parseInt(id))) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID проекта'
      });
    }

    const project = await Project.findByPk(id, { transaction });
    if (!project) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    // ИСПРАВЛЕНО: Упрощаем валидацию существования ресурсов
    const validationResults = [];
    
    if (proxyIds.length > 0) {
      try {
        const count = await Proxy.count({ 
          where: { id: { [Op.in]: proxyIds } },
          transaction 
        });
        validationResults.push({ type: 'proxy', expected: proxyIds.length, found: count });
      } catch (error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Ошибка проверки прокси'
        });
      }
    }
    
    if (phoneIds.length > 0) {
      try {
        const count = await Phone.count({ 
          where: { id: { [Op.in]: phoneIds } },
          transaction 
        });
        validationResults.push({ type: 'phone', expected: phoneIds.length, found: count });
      } catch (error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Ошибка проверки телефонов'
        });
      }
    }
    
    if (profileIds.length > 0 && Profile) {
      try {
        const count = await Profile.count({ 
          where: { id: { [Op.in]: profileIds } },
          transaction 
        });
        validationResults.push({ type: 'profile', expected: profileIds.length, found: count });
      } catch (error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Ошибка проверки профилей'
        });
      }
    }
    
    // Проверяем что все ресурсы существуют
    for (const result of validationResults) {
      if (result.found !== result.expected) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `Некоторые ${result.type === 'proxy' ? 'прокси' : result.type === 'phone' ? 'телефоны' : 'профили'} не найдены`
        });
      }
    }

    // Назначаем ресурсы проекту
    const assignedCounts = { proxies: 0, phones: 0, profiles: 0 };
    
    if (proxyIds.length > 0) {
      try {
        const [updatedCount] = await Proxy.update(
          { projectId: id },
          { where: { id: { [Op.in]: proxyIds } }, transaction }
        );
        assignedCounts.proxies = updatedCount;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }
    
    if (phoneIds.length > 0) {
      try {
        const [updatedCount] = await Phone.update(
          { projectId: id },
          { where: { id: { [Op.in]: phoneIds } }, transaction }
        );
        assignedCounts.phones = updatedCount;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }
    
    if (profileIds.length > 0 && Profile) {
      try {
        const [updatedCount] = await Profile.update(
          { projectId: id },
          { where: { id: { [Op.in]: profileIds } }, transaction }
        );
        assignedCounts.profiles = updatedCount;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    await transaction.commit();

    logger.info('Resources assigned to project:', {
      projectId: id,
      assignedCounts
    });

    res.json({
      success: true,
      data: {
        projectId: parseInt(id),
        assigned: assignedCounts,
        total: assignedCounts.proxies + assignedCounts.phones + assignedCounts.profiles
      },
      message: 'Ресурсы успешно назначены проекту'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error assigning resources:', error);
    next(error);
  }
};

/**
 * Отвязать ресурсы от проекта
 */
const unassignResources = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { proxyIds = [], phoneIds = [], profileIds = [] } = req.body;

    if (!id || isNaN(parseInt(id))) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID проекта'
      });
    }

    // Отвязываем ресурсы от проекта
    const updatePromises = [];
    
    if (proxyIds.length > 0) {
      updatePromises.push(
        Proxy.update(
          { projectId: null },
          { 
            where: { 
              id: { [Op.in]: proxyIds },
              projectId: id
            }, 
            transaction 
          }
        )
      );
    }
    
    if (phoneIds.length > 0) {
      updatePromises.push(
        Phone.update(
          { projectId: null },
          { 
            where: { 
              id: { [Op.in]: phoneIds },
              projectId: id
            }, 
            transaction 
          }
        )
      );
    }
    
    // ИСПРАВЛЕНО: Проверяем существование модели Profile
    if (profileIds.length > 0 && Profile) {
      updatePromises.push(
        Profile.update(
          { projectId: null },
          { 
            where: { 
              id: { [Op.in]: profileIds },
              projectId: id
            }, 
            transaction 
          }
        )
      );
    }

    const updateResults = await Promise.all(updatePromises);
    await transaction.commit();

    const unassignedCounts = {
      proxies: proxyIds.length > 0 ? updateResults[0][0] : 0,
      phones: phoneIds.length > 0 ? updateResults[proxyIds.length > 0 ? 1 : 0][0] : 0,
      profiles: profileIds.length > 0 && Profile ? updateResults[updateResults.length - 1][0] : 0
    };

    logger.info('Resources unassigned from project:', {
      projectId: id,
      unassignedCounts
    });

    res.json({
      success: true,
      data: {
        projectId: parseInt(id),
        unassigned: unassignedCounts,
        total: unassignedCounts.proxies + unassignedCounts.phones + unassignedCounts.profiles
      },
      message: 'Ресурсы успешно отвязаны от проекта'
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error unassigning resources:', error);
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
  unassignResources
};