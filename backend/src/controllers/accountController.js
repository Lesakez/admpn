const { Account, Activity, sequelize } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Создать аккаунт
const createAccount = async (req, res, next) => {
  try {
    const account = await Account.create(req.body);
    
    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Создан аккаунт: ${account.login}`,
      entityType: 'account',
      entityId: account.id,
      actionType: 'create'
    });

    logger.info('Account created', { accountId: account.id, login: account.login });

    res.status(201).json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// Получить список аккаунтов
const getAccounts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      source,
      userId,
      search,
      dateFrom,
      dateTo
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Фильтры
    if (status) {
      where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }

    if (source) {
      where.source = Array.isArray(source) ? { [Op.in]: source } : source;
    }

    if (userId) {
      where.userId = Array.isArray(userId) ? { [Op.in]: userId } : userId;
    }

    if (search) {
      where[Op.or] = [
        { login: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { userId: { [Op.like]: `%${search}%` } }
      ];
    }

    if (dateFrom) {
      where.createdAt = { [Op.gte]: new Date(dateFrom) };
    }

    if (dateTo) {
      where.createdAt = { 
        ...where.createdAt,
        [Op.lte]: new Date(dateTo) 
      };
    }

    const { count, rows } = await Account.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        accounts: rows,
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

// Получить аккаунт по ID
const getAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const account = await Account.findByPk(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Аккаунт не найден'
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

    const oldData = { ...account.dataValues };
    await account.update(req.body);

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Обновлен аккаунт: ${account.login}`,
      entityType: 'account',
      entityId: account.id,
      actionType: 'update',
      metadata: {
        oldData: oldData,
        newData: req.body
      }
    });

    logger.info('Account updated', { accountId: account.id, login: account.login });

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// Удалить аккаунт
const deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const account = await Account.findByPk(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Аккаунт не найден'
      });
    }

    const deletedData = { login: account.login, id: account.id };

    await account.destroy();

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Удален аккаунт: ${deletedData.login}`,
      entityType: 'account',
      entityId: deletedData.id,
      actionType: 'delete'
    });

    logger.info('Account deleted', { accountId: deletedData.id, login: deletedData.login });

    res.json({
      success: true,
      message: 'Аккаунт успешно удален'
    });
  } catch (error) {
    next(error);
  }
};

// Изменить статус аккаунта
const changeAccountStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Статус обязателен'
      });
    }

    const account = await Account.findByPk(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Аккаунт не найден'
      });
    }

    const oldStatus = account.status;
    await account.update({ status });

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Изменен статус аккаунта ${account.login} с "${oldStatus}" на "${status}"`,
      entityType: 'account',
      entityId: account.id,
      actionType: 'status_change',
      metadata: {
        oldStatus,
        newStatus: status
      }
    });

    logger.info('Account status changed', { 
      accountId: account.id, 
      login: account.login,
      oldStatus,
      newStatus: status 
    });

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// Статистика аккаунтов
const getAccountStats = async (req, res, next) => {
  try {
    const stats = await Account.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const totalCount = await Account.count();

    const statsObject = stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.dataValues.count);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: totalCount,
        byStatus: statsObject
      }
    });
  } catch (error) {
    next(error);
  }
};

// Импорт аккаунтов из текста
const importAccountsFromText = async (req, res, next) => {
  try {
    const { text, format = 'login:password', source = 'import' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Текст для импорта обязателен'
      });
    }

    const lines = text.split('\n').filter(line => line.trim());
    const accounts = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const parts = line.split(':');
        
        if (format === 'login:password' && parts.length >= 2) {
          accounts.push({
            login: parts[0],
            password: parts[1],
            source: source
          });
        } else if (format === 'login:password:email' && parts.length >= 3) {
          accounts.push({
            login: parts[0],
            password: parts[1],
            email: parts[2],
            source: source
          });
        } else {
          errors.push(`Строка ${i + 1}: неверный формат`);
        }
      } catch (error) {
        errors.push(`Строка ${i + 1}: ${error.message}`);
      }
    }

    if (accounts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Не удалось обработать ни одного аккаунта',
        details: errors
      });
    }

    const createdAccounts = await Account.bulkCreate(accounts, {
      ignoreDuplicates: true
    });

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Импортировано ${createdAccounts.length} аккаунтов`,
      entityType: 'account',
      entityId: 0,
      actionType: 'bulk_import',
      metadata: {
        count: createdAccounts.length,
        source: source,
        format: format
      }
    });

    logger.info('Accounts imported', { 
      count: createdAccounts.length,
      errors: errors.length 
    });

    res.json({
      success: true,
      data: {
        imported: createdAccounts.length,
        errors: errors
      }
    });
  } catch (error) {
    next(error);
  }
};

// Массовое удаление аккаунтов
const bulkDeleteAccounts = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Массив ID обязателен'
      });
    }

    const deletedCount = await Account.destroy({
      where: {
        id: { [Op.in]: ids }
      }
    });

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Массово удалено ${deletedCount} аккаунтов`,
      entityType: 'account',
      entityId: 0,
      actionType: 'bulk_delete',
      metadata: {
        count: deletedCount,
        ids: ids
      }
    });

    logger.info('Accounts bulk deleted', { count: deletedCount });

    res.json({
      success: true,
      data: {
        deleted: deletedCount
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

    const [updatedCount] = await Account.update(
      { status },
      {
        where: {
          id: { [Op.in]: ids }
        }
      }
    );

    // Логируем активность
    await Activity.create({
      timestamp: new Date(),
      description: `Массово обновлен статус ${updatedCount} аккаунтов на "${status}"`,
      entityType: 'account',
      entityId: 0,
      actionType: 'bulk_status_update',
      metadata: {
        count: updatedCount,
        status: status,
        ids: ids
      }
    });

    logger.info('Accounts bulk status updated', { 
      count: updatedCount, 
      status: status 
    });

    res.json({
      success: true,
      data: {
        updated: updatedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Экспорт в JSON
const exportAccountsJSON = async (req, res, next) => {
  try {
    const {
      status,
      source,
      userId,
      search,
      dateFrom,
      dateTo
    } = req.query;

    const where = {};

    // Применяем те же фильтры что и в getAccounts
    if (status) where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    if (source) where.source = Array.isArray(source) ? { [Op.in]: source } : source;
    if (userId) where.userId = Array.isArray(userId) ? { [Op.in]: userId } : userId;
    if (search) {
      where[Op.or] = [
        { login: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { userId: { [Op.like]: `%${search}%` } }
      ];
    }
    if (dateFrom) where.createdAt = { [Op.gte]: new Date(dateFrom) };
    if (dateTo) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(dateTo) };

    const accounts = await Account.findAll({ where });

    const filename = `accounts_export_${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.json(accounts);
  } catch (error) {
    next(error);
  }
};

// Экспорт в CSV
const exportAccountsCSV = async (req, res, next) => {
  try {
    const accounts = await Account.findAll();
    
    const fields = ['id', 'login', 'password', 'email', 'status', 'source', 'createdAt'];
    const csv = [
      fields.join(','),
      ...accounts.map(account => 
        fields.map(field => `"${account[field] || ''}"`).join(',')
      )
    ].join('\n');

    const filename = `accounts_export_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// Экспорт в TXT
const exportAccountsTXT = async (req, res, next) => {
  try {
    const { format = 'login:password' } = req.query;
    const accounts = await Account.findAll();
    
    let txt = '';
    
    accounts.forEach(account => {
      switch (format) {
        case 'login:password':
          txt += `${account.login}:${account.password}\n`;
          break;
        case 'login:password:email':
          txt += `${account.login}:${account.password}:${account.email || ''}\n`;
          break;
        default:
          txt += `${account.login}:${account.password}\n`;
      }
    });

    const filename = `accounts_export_${new Date().toISOString().split('T')[0]}.txt`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(txt);
  } catch (error) {
    next(error);
  }
};

// Кастомный экспорт
const exportAccountsCustom = async (req, res, next) => {
  try {
    const { 
      fields = ['login', 'password'], 
      format = 'json',
      template,
      filters = {}
    } = req.body;

    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;

    const accounts = await Account.findAll({ 
      where,
      attributes: fields 
    });

    if (format === 'template' && template) {
      // Кастомный шаблон
      const txt = accounts.map(account => {
        let line = template;
        fields.forEach(field => {
          line = line.replace(`{${field}}`, account[field] || '');
        });
        return line;
      }).join('\n');

      res.setHeader('Content-Type', 'text/plain');
      res.send(txt);
    } else {
      res.json({
        success: true,
        data: accounts
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
  changeAccountStatus,
  getAccountStats,
  importAccountsFromText,
  bulkDeleteAccounts,
  bulkUpdateStatus,
  exportAccountsJSON,
  exportAccountsCSV,
  exportAccountsTXT,
  exportAccountsCustom
};