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
      sortBy = 'createdAt',
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
      : [['createdAt', 'DESC']];

    // Получаем проекты и общее количество
    const [projects, totalCount] = await Promise.all([
      Project.findAll({
        where,
        limit: validatedLimit,
        offset,
        order
      }),
      Project.count({ where })
    ]);

    // Получаем статистику для каждого проекта
    const projectsWithStats = [];
    
    for (const project of projects) {
      try {
        // Получаем статистику по прокси
        const proxiesData = await Proxy.findAll({
          where: { projectId: project.id },
          attributes: ['status'],
          raw: true
        }).catch(() => []);

        // Получаем статистику по телефонам
        const phonesData = await Phone.findAll({
          where: { projectId: project.id },
          attributes: ['status'],
          raw: true
        }).catch(() => []);

        // Получаем статистику по профилям (если модель существует)
        const profilesData = Profile ? await Profile.findAll({
          where: { projectId: project.id },
          attributes: ['status'],
          raw: true
        }).catch(() => []) : [];

        // Подсчитываем статистику
        const proxiesStats = {
          total: proxiesData.length,
          free: proxiesData.filter(p => p.status === 'free').length,
          busy: proxiesData.filter(p => p.status === 'busy').length,
          blocked: proxiesData.filter(p => p.status === 'blocked').length,
          error: proxiesData.filter(p => p.status === 'error').length
        };

        const phonesStats = {
          total: phonesData.length,
          free: phonesData.filter(p => p.status === 'free').length,
          busy: phonesData.filter(p => p.status === 'busy').length
        };

        const profilesStats = {
          total: profilesData.length,
          active: profilesData.filter(p => p.status === 'active').length,
          created: profilesData.filter(p => p.status === 'created').length,
          working: profilesData.filter(p => p.status === 'working').length
        };

        projectsWithStats.push({
          ...project.toJSON(),
          stats: {
            proxies: proxiesStats,
            phones: phonesStats,
            profiles: profilesStats
          }
        });
      } catch (statsError) {
        logger.warn(`Error getting stats for project ${project.id}:`, statsError);
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

    // Возвращаем правильную структуру для frontend
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

    // Получаем связанные данные отдельными запросами
    const [proxies, phones, profiles] = await Promise.all([
      Proxy.findAll({
        where: { projectId: id },
        attributes: ['id', 'status', 'country', 'type', 'ipPort']
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
        byType: proxies.reduce((acc, proxy) => {
          if (proxy.type) {
            acc[proxy.type] = (acc[proxy.type] || 0) + 1;
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

    // Отвязываем все ресурсы от проекта
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

    const updatePromises = [];
    
    if (proxyIds.length > 0) {
      updatePromises.push(
        Proxy.update(
          { projectId: id },
          { 
            where: { 
              id: { [Op.in]: proxyIds },
              projectId: null
            }, 
            transaction 
          }
        )
      );
    }
    
    if (phoneIds.length > 0) {
      updatePromises.push(
        Phone.update(
          { projectId: id },
          { 
            where: { 
              id: { [Op.in]: phoneIds },
              projectId: null
            }, 
            transaction 
          }
        )
      );
    }
    
    if (profileIds.length > 0 && Profile) {
      updatePromises.push(
        Profile.update(
          { projectId: id },
          { 
            where: { 
              id: { [Op.in]: profileIds },
              projectId: null
            }, 
            transaction 
          }
        )
      );
    }

    const updateResults = await Promise.all(updatePromises);
    await transaction.commit();

    const assignedCounts = {
      proxies: proxyIds.length > 0 ? updateResults[0][0] : 0,
      phones: phoneIds.length > 0 ? updateResults[proxyIds.length > 0 ? 1 : 0][0] : 0,
      profiles: profileIds.length > 0 && Profile ? updateResults[updateResults.length - 1][0] : 0
    };

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

    const project = await Project.findByPk(id, { transaction });
    if (!project) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

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

/**
 * Массовое удаление проектов
 */
const bulkDeleteProjects = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Необходимо передать массив ID проектов'
      });
    }

    // Проверяем существование проектов
    const projects = await Project.findAll({
      where: { id: { [Op.in]: ids } },
      transaction
    });

    if (projects.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Проекты не найдены'
      });
    }

    // Отвязываем ресурсы от всех проектов
    await Promise.all([
      Proxy.update(
        { projectId: null },
        { where: { projectId: { [Op.in]: ids } }, transaction }
      ).catch(() => [0]),
      Phone.update(
        { projectId: null },
        { where: { projectId: { [Op.in]: ids } }, transaction }
      ).catch(() => [0]),
      Profile ? Profile.update(
        { projectId: null },
        { where: { projectId: { [Op.in]: ids } }, transaction }
      ).catch(() => [0]) : Promise.resolve([0])
    ]);

    // Удаляем проекты
    const deletedCount = await Project.destroy({
      where: { id: { [Op.in]: ids } },
      transaction
    });

    await transaction.commit();

    logger.info('Bulk delete projects:', { ids, deletedCount });

    res.json({
      success: true,
      data: {
        deletedCount,
        deletedIds: ids
      },
      message: `Удалено проектов: ${deletedCount}`
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error bulk deleting projects:', error);
    next(error);
  }
};

/**
 * Массовое обновление проектов
 */
const bulkUpdateProjects = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { ids, data } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Необходимо передать массив ID проектов'
      });
    }

    if (!data || Object.keys(data).length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Необходимо передать данные для обновления'
      });
    }

    // Обновляем проекты
    const [updatedCount] = await Project.update(data, {
      where: { id: { [Op.in]: ids } },
      transaction
    });

    await transaction.commit();

    logger.info('Bulk update projects:', { ids, updatedCount });

    res.json({
      success: true,
      data: {
        updatedCount,
        updatedIds: ids
      },
      message: `Обновлено проектов: ${updatedCount}`
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error bulk updating projects:', error);
    next(error);
  }
};

/**
 * Автокомплит для поиска проектов
 */
const autocompleteProjects = async (req, res, next) => {
  try {
    const { q: query = '', limit = 10 } = req.query;

    if (!query.trim()) {
      return res.json({
        success: true,
        data: []
      });
    }

    const projects = await Project.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { transliterateName: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'name', 'transliterateName'],
      limit: Math.min(50, parseInt(limit)),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    logger.error('Error autocomplete projects:', error);
    next(error);
  }
};

/**
 * Экспорт проектов
 */
const exportProjects = async (req, res, next) => {
  try {
    const { format = 'json', filters = {} } = req.body;

    const where = {};
    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    const projects = await Project.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    let exportData;
    let contentType;
    let filename;

    if (format === 'csv') {
      const csvHeader = 'ID,Name,Description,Transliterate Name,Created At,Updated At\n';
      const csvData = projects.map(p => 
        `${p.id},"${p.name}","${p.description || ''}","${p.transliterateName || ''}","${p.createdAt}","${p.updatedAt}"`
      ).join('\n');
      
      exportData = csvHeader + csvData;
      contentType = 'text/csv';
      filename = `projects_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      exportData = JSON.stringify(projects, null, 2);
      contentType = 'application/json';
      filename = `projects_${new Date().toISOString().split('T')[0]}.json`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    logger.error('Error exporting projects:', error);
    next(error);
  }
};

/**
 * Импорт проектов
 */
const importProjects = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { data, format = 'json' } = req.body;

    if (!data) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Необходимо передать данные для импорта'
      });
    }

    let projectsData = [];
    
    if (format === 'json') {
      projectsData = Array.isArray(data) ? data : [data];
    } else if (format === 'csv') {
      // Простой парсинг CSV
      const lines = data.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const project = {};
        headers.forEach((header, index) => {
          project[header.trim()] = values[index] ? values[index].replace(/"/g, '').trim() : '';
        });
        projectsData.push(project);
      }
    }

    const importedProjects = [];
    const errors = [];

    for (const projectData of projectsData) {
      try {
        // Проверяем обязательные поля
        if (!projectData.name) {
          errors.push(`Пропущено название для проекта: ${JSON.stringify(projectData)}`);
          continue;
        }

        // Проверяем уникальность
        const existing = await Project.findOne({
          where: { name: projectData.name },
          transaction
        });

        if (existing) {
          errors.push(`Проект с именем "${projectData.name}" уже существует`);
          continue;
        }

        const newProject = await Project.create({
          name: projectData.name,
          description: projectData.description || null,
          transliterateName: projectData.transliterateName || null
        }, { transaction });

        importedProjects.push(newProject);
      } catch (error) {
        errors.push(`Ошибка создания проекта "${projectData.name}": ${error.message}`);
      }
    }

    await transaction.commit();

    logger.info('Import projects:', { 
      imported: importedProjects.length, 
      errors: errors.length 
    });

    res.json({
      success: true,
      data: {
        importedCount: importedProjects.length,
        imported: importedProjects,
        errors: errors
      },
      message: `Импортировано проектов: ${importedProjects.length}`
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error importing projects:', error);
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
  unassignResources,
  bulkDeleteProjects,
  bulkUpdateProjects,
  autocompleteProjects,
  exportProjects,
  importProjects
};