const { Account, Profile, Proxy, Project, Phone, Activity, Registration } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Таймаут ресурсов (по умолчанию 15 минут)
let resourceTimeout = 15 * 60 * 1000;

// === ТЕЛЕФОНЫ ===

// Получить свободный телефон
const getFreePhone = async (req, res, next) => {
  try {
    const { project_id } = req.query;
    let projectName = 'не указан';

    // Базовый запрос для свободных телефонов
    const where = { status: 'free' };

    // Если указан проект, ищем в этом проекте + стоковый проект
    if (project_id) {
      const stockProject = await getStockProject();
      const projectIds = [parseInt(project_id)];
      
      if (stockProject) {
        projectIds.push(stockProject.id);
      }

      where.projectId = { [Op.in]: projectIds };

      // Получаем название проекта для логов
      const project = await Project.findByPk(project_id);
      if (project) {
        projectName = project.name;
      }
    }

    // Ищем телефон, который не использовался дольше всего
    const phone = await Phone.findOne({
      where,
      order: [
        ['dateLastReboot', 'ASC'],
        ['createdAt', 'ASC']
      ]
    });

    if (!phone) {
      return res.status(404).json({
        success: false,
        error: 'Свободные устройства не найдены'
      });
    }

    // Обновляем статус телефона
    await phone.update({
      status: 'busy',
      dateSetStatusBusy: new Date(),
      dateSetStatusFree: null,
      dateLastReboot: new Date()
    });

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Устройство выдано для ZennoPoster (проект: ${projectName})`,
      entityType: 'phone',
      entityId: phone.id,
      actionType: 'allocate',
      metadata: {
        projectId: project_id,
        projectName: projectName
      }
    });

    logger.info('Phone allocated for ZennoPoster', {
      phoneId: phone.id,
      projectId: project_id,
      projectName: projectName
    });

    res.json({
      success: true,
      data: phone
    });
  } catch (error) {
    next(error);
  }
};

// Освободить телефон
const releasePhone = async (req, res, next) => {
  try {
    const { id } = req.params;

    const phone = await Phone.findByPk(id);

    if (!phone) {
      return res.status(404).json({
        success: false,
        error: 'Устройство не найдено'
      });
    }

    // Обновляем статус телефона
    await phone.update({
      status: 'free',
      dateSetStatusFree: new Date(),
      dateSetStatusBusy: null
    });

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Устройство освобождено от ZennoPoster`,
      entityType: 'phone',
      entityId: phone.id,
      actionType: 'release'
    });

    logger.info('Phone released from ZennoPoster', { phoneId: phone.id });

    res.json({
      success: true,
      message: 'Устройство освобождено',
      data: phone
    });
  } catch (error) {
    next(error);
  }
};

// === ПРОКСИ ===

// Получить свободный прокси
const getFreeProxy = async (req, res, next) => {
  try {
    const { project_id } = req.query;
    let projectName = 'не указан';

    const where = { status: 'free' };

    if (project_id) {
      const stockProject = await getStockProject();
      const projectIds = [parseInt(project_id)];
      
      if (stockProject) {
        projectIds.push(stockProject.id);
      }

      where.projectId = { [Op.in]: projectIds };

      const project = await Project.findByPk(project_id);
      if (project) {
        projectName = project.name;
      }
    }

    const proxy = await Proxy.findOne({
      where,
      order: [
        ['dateLastChangeIp', 'ASC'],
        ['createdAt', 'ASC']
      ]
    });

    if (!proxy) {
      return res.status(404).json({
        success: false,
        error: 'Свободные прокси не найдены'
      });
    }

    await proxy.update({
      status: 'busy',
      dateSetStatusBusy: new Date(),
      dateSetStatusFree: null
    });

    await Activity.create({
      timestamp: new Date(),
      description: `Прокси выдан для ZennoPoster (проект: ${projectName})`,
      entityType: 'proxy',
      entityId: proxy.id,
      actionType: 'allocate',
      metadata: {
        projectId: project_id,
        projectName: projectName
      }
    });

    logger.info('Proxy allocated for ZennoPoster', {
      proxyId: proxy.id,
      projectId: project_id,
      projectName: projectName
    });

    res.json({
      success: true,
      data: proxy
    });
  } catch (error) {
    next(error);
  }
};

// Освободить прокси
const releaseProxy = async (req, res, next) => {
  try {
    const { id } = req.params;

    const proxy = await Proxy.findByPk(id);

    if (!proxy) {
      return res.status(404).json({
        success: false,
        error: 'Прокси не найден'
      });
    }

    await proxy.update({
      status: 'free',
      dateSetStatusFree: new Date(),
      dateSetStatusBusy: null
    });

    await Activity.create({
      timestamp: new Date(),
      description: `Прокси освобожден от ZennoPoster`,
      entityType: 'proxy',
      entityId: proxy.id,
      actionType: 'release'
    });

    logger.info('Proxy released from ZennoPoster', { proxyId: proxy.id });

    res.json({
      success: true,
      message: 'Прокси освобожден',
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

    await proxy.update({
      dateLastChangeIp: new Date()
    });

    await Activity.create({
      timestamp: new Date(),
      description: `Смена IP для прокси`,
      entityType: 'proxy',
      entityId: proxy.id,
      actionType: 'change_ip'
    });

    logger.info('Proxy IP changed', { proxyId: proxy.id });

    res.json({
      success: true,
      message: 'Время смены IP обновлено',
      data: {
        changeIpUrl: proxy.changeIpUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// === АККАУНТЫ ===

// Получить свободный аккаунт
const getFreeAccount = async (req, res, next) => {
  try {
    const { status = 'free', limit = 1 } = req.query;

    const account = await Account.findOne({
      where: { status },
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit)
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Свободные аккаунты не найдены'
      });
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// Освободить аккаунт
const releaseAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const account = await Account.findByPk(id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Аккаунт не найден'
      });
    }

    await account.update({ status: 'free' });

    await Activity.create({
      timestamp: new Date(),
      description: `Аккаунт освобожден от ZennoPoster: ${account.login}`,
      entityType: 'account',
      entityId: account.id,
      actionType: 'release'
    });

    logger.info('Account released from ZennoPoster', { 
      accountId: account.id, 
      login: account.login 
    });

    res.json({
      success: true,
      message: 'Аккаунт освобожден',
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// Обновить аккаунт
const updateAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const account = await Account.findByPk(id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Аккаунт не найден'
      });
    }

    await account.update(req.body);

    await Activity.create({
      timestamp: new Date(),
      description: `Аккаунт обновлен через ZennoPoster: ${account.login}`,
      entityType: 'account',
      entityId: account.id,
      actionType: 'update',
      metadata: req.body
    });

    logger.info('Account updated via ZennoPoster', { 
      accountId: account.id, 
      login: account.login 
    });

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// Количество аккаунтов
const getAccountsCount = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status) {
      where.status = status;
    }

    const count = await Account.count({ where });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};

// Массовое обновление статуса аккаунтов
const bulkUpdateAccountsStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || !status) {
      return res.status(400).json({
        success: false,
        error: 'IDs и статус обязательны'
      });
    }

    const [updatedCount] = await Account.update(
      { status },
      { where: { id: { [Op.in]: ids } } }
    );

    await Activity.create({
      timestamp: new Date(),
      description: `ZennoPoster: массово обновлен статус ${updatedCount} аккаунтов на "${status}"`,
      entityType: 'account',
      entityId: 0,
      actionType: 'bulk_status_update',
      metadata: {
        count: updatedCount,
        status: status,
        ids: ids
      }
    });

    logger.info('Accounts bulk status updated via ZennoPoster', { 
      count: updatedCount, 
      status: status 
    });

    res.json({
      success: true,
      data: { updated: updatedCount }
    });
  } catch (error) {
    next(error);
  }
};

// === ПРОФИЛИ ===

// Получить профиль по user_id
const getProfileByAccount = async (req, res, next) => {
  try {
    const { user_id } = req.params;

    const profile = await Profile.findOne({
      where: { userId: user_id }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Профиль не найден'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// Обновить статус профиля по user_id
const updateProfileAccountStatus = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Статус обязателен'
      });
    }

    const profile = await Profile.findOne({
      where: { userId: user_id }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Профиль не найден'
      });
    }

    const oldStatus = profile.status;
    await profile.update({ status });

    await Activity.create({
      timestamp: new Date(),
      description: `ZennoPoster: обновлен статус профиля ${profile.name} с "${oldStatus}" на "${status}"`,
      entityType: 'profile',
      entityId: profile.id,
      actionType: 'status_change',
      metadata: {
        userId: user_id,
        oldStatus,
        newStatus: status
      }
    });

    logger.info('Profile status updated via ZennoPoster', { 
      profileId: profile.id,
      userId: user_id,
      oldStatus,
      newStatus: status 
    });

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// Получить случайный профиль
const getRandomProfileAccount = async (req, res, next) => {
  try {
    const { status = 'active' } = req.query;

    const profile = await Profile.findOne({
      where: { status },
      order: sequelize.random()
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Профили не найдены'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// === ПРОЕКТЫ ===

// Получить проект по имени
const getProjectByName = async (req, res, next) => {
  try {
    const { name } = req.params;

    const project = await Project.findOne({
      where: { 
        [Op.or]: [
          { name: name },
          { transliterateName: name }
        ]
      }
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

// Получить стоковый проект
const getStockProject = async () => {
  try {
    // Ищем проект с именем "all" или "stock"
    let project = await Project.findOne({
      where: { transliterateName: 'all' }
    });

    if (!project) {
      project = await Project.findOne({
        where: { transliterateName: 'stock' }
      });
    }

    return project;
  } catch (error) {
    logger.error('Error getting stock project', error);
    return null;
  }
};

const getStockProjectController = async (req, res, next) => {
  try {
    const project = await getStockProject();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Стоковый проект не найден'
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

// === КОНФИГУРАЦИЯ ===

// Установить таймаут ресурсов
const setResourceTimeout = async (req, res, next) => {
  try {
    const { timeout_minutes } = req.body;

    if (!timeout_minutes || timeout_minutes < 1 || timeout_minutes > 1440) {
      return res.status(400).json({
        success: false,
        error: 'Неверные данные. Укажите timeout_minutes от 1 до 1440 (24 часа)'
      });
    }

    resourceTimeout = timeout_minutes * 60 * 1000;

    await Activity.create({
      timestamp: new Date(),
      description: `Изменен таймаут ресурсов на ${timeout_minutes} минут`,
      entityType: 'config',
      entityId: 0,
      actionType: 'update'
    });

    logger.info('Resource timeout updated', { timeoutMinutes: timeout_minutes });

    res.json({
      success: true,
      data: {
        message: 'Таймаут ресурсов установлен',
        timeout_minutes: timeout_minutes
      }
    });
  } catch (error) {
    next(error);
  }
};

// === СТАТИСТИКА ===

// Добавить статистику
const addStat = async (req, res, next) => {
  try {
    const { service_name, status, country, sms_service, proxy_used, phone_number, error_message } = req.body;

    if (!service_name || !status) {
      return res.status(400).json({
        success: false,
        error: 'service_name и status обязательны'
      });
    }

    const registration = await Registration.create({
      serviceName: service_name,
      status,
      country,
      smsService: sms_service,
      proxyUsed: proxy_used,
      phoneNumber: phone_number,
      errorMessage: error_message
    });

    await Activity.create({
      timestamp: new Date(),
      description: `ZennoPoster: ${service_name} (${status})`,
      entityType: 'registration',
      entityId: registration.id,
      actionType: 'create',
      metadata: {
        serviceName: service_name,
        status,
        country,
        smsService: sms_service
      }
    });

    logger.info('ZennoPoster stat added', {
      registrationId: registration.id,
      serviceName: service_name,
      status
    });

    res.status(201).json({
      success: true,
      data: {
        message: 'Статистика записана',
        id: registration.id
      }
    });
  } catch (error) {
    next(error);
  }
};

// Сохранить аккаунт
const saveAccount = async (req, res, next) => {
  try {
    const accountData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const account = await Account.create(accountData);

    await Activity.create({
      timestamp: new Date(),
      description: `Создан аккаунт через ZennoPoster: ${account.login}`,
      entityType: 'account',
      entityId: account.id,
      actionType: 'create'
    });

    logger.info('Account created via ZennoPoster', {
      accountId: account.id,
      login: account.login
    });

    res.status(201).json({
      success: true,
      data: {
        message: 'Аккаунт сохранён',
        id: account.id
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Телефоны
  getFreePhone,
  releasePhone,
  
  // Прокси
  getFreeProxy,
  releaseProxy,
  changeProxyIP,
  
  // Аккаунты
  getFreeAccount,
  releaseAccount,
  updateAccount,
  getAccountsCount,
  bulkUpdateAccountsStatus,
  
  // Профили
  getProfileByAccount,
  updateProfileAccountStatus,
  getRandomProfileAccount,
  
  // Проекты
  getProjectByName,
  getStockProject: getStockProjectController,
  
  // Конфигурация
  setResourceTimeout,
  
  // Статистика
  addStat,
  saveAccount
};