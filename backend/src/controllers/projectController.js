const { Project, Proxy, Phone, Profile, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Получить список проектов с оптимизированной статистикой
const getProjects = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'created_at', // ИСПРАВЛЕНО: используем snake_case как в БД
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Поиск по названию или описанию
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Получаем проекты с подсчетом статистики через подзапросы
    const projects = await Project.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      attributes: [
        'id',
        'name', 
        'description',
        'created_at', // ИСПРАВЛЕНО: используем названия полей как в БД
        'updated_at',
        // Подсчет прокси - используем правильные названия таблиц и полей
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM proxies
            WHERE proxies.project_id = Project.id
          )`),
          'totalProxies'
        ],
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM proxies
            WHERE proxies.project_id = Project.id AND proxies.status = 'free'
          )`),
          'freeProxies'
        ],
        // Подсчет телефонов - используем правильное название таблицы
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM phones
            WHERE phones.project_id = Project.id
          )`),
          'totalPhones'
        ],
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM phones
            WHERE phones.project_id = Project.id AND phones.status = 'free'
          )`),
          'freePhones'
        ],
        // Подсчет профилей - убираем так как нет связи project_id в таблице profiles
        // [
        //   sequelize.literal(`(
        //     SELECT COUNT(*)
        //     FROM profiles
        //     WHERE profiles.project_id = Project.id
        //   )`),
        //   'totalProfiles'
        // ],
        // [
        //   sequelize.literal(`(
        //     SELECT COUNT(*)
        //     FROM profiles
        //     WHERE profiles.project_id = Project.id AND profiles.status = 'active'
        //   )`),
        //   'activeProfiles'
        // ]
      ]
    });

    // Общий подсчет для пагинации
    const total = await Project.count({ where });

    // Форматируем ответ
    const projectsWithStats = projects.map(project => {
      const data = project.toJSON();
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: data.created_at, // Преобразуем в camelCase для frontend
        updatedAt: data.updated_at,
        stats: {
          proxies: {
            total: parseInt(data.totalProxies) || 0,
            free: parseInt(data.freeProxies) || 0
          },
          phones: {
            total: parseInt(data.totalPhones) || 0,
            free: parseInt(data.freePhones) || 0
          },
          profiles: {
            total: 0, // Отключаем так как нет связи
            active: 0
          }
        }
      };
    });

    res.json({
      success: true,
      data: {
        projects: projectsWithStats,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
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

    // Получаем связанные данные отдельными запросами для надежности
    const [proxies, phones] = await Promise.all([
      Proxy.findAll({
        where: { project_id: id },
        attributes: ['id', 'ip_port', 'status', 'country']
      }),
      Phone.findAll({
        where: { project_id: id },
        attributes: ['id', 'model', 'status', 'device']
      })
      // Убираем Profile так как нет связи project_id
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
      },
      profiles: {
        total: 0, // Отключаем так как нет связи
        byStatus: {}
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

    // Статистика профилей - отключено
    // profiles.forEach(profile => {
    //   stats.profiles.byStatus[profile.status] = 
    //     (stats.profiles.byStatus[profile.status] || 0) + 1;
    // });

    const projectData = project.toJSON();

    res.json({
      success: true,
      data: {
        id: projectData.id,
        name: projectData.name,
        description: projectData.description,
        createdAt: projectData.created_at,
        updatedAt: projectData.updated_at,
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
        // Убираем profiles так как нет связи
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
    
    logger.info('Project created successfully', { projectId: project.id });

    res.status(201).json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.created_at,
        updatedAt: project.updated_at
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
    
    logger.info('Project updated successfully', { projectId: id });

    res.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.created_at,
        updatedAt: project.updated_at
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

    // Проверяем, есть ли связанные ресурсы (убираем profiles)
    const [proxiesCount, phonesCount] = await Promise.all([
      Proxy.count({ where: { project_id: id } }),
      Phone.count({ where: { project_id: id } })
    ]);

    if (proxiesCount > 0 || phonesCount > 0) {
      // Отвязываем ресурсы вместо удаления (убираем profiles)
      await Promise.all([
        Proxy.update({ project_id: null }, { where: { project_id: id } }),
        Phone.update({ project_id: null }, { where: { project_id: id } })
      ]);
      
      logger.info('Project resources unlinked', { 
        projectId: id, 
        proxies: proxiesCount, 
        phones: phonesCount
      });
    }

    await project.destroy();
    
    logger.info('Project deleted successfully', { projectId: id });

    res.json({
      success: true,
      message: 'Проект успешно удален. Связанные ресурсы отвязаны.'
    });
  } catch (error) {
    next(error);
  }
};

// Получить общую статистику по всем проектам
const getProjectsStats = async (req, res, next) => {
  try {
    // Используем простые запросы для совместимости (убираем profiles)
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
        // Убираем profiles так как нет связи
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
    const { proxyIds = [], phoneIds = [] } = req.body; // Убираем profileIds

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

      // Убираем profileIds так как нет связи

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