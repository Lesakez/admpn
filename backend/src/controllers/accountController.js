const { Account } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Создать новый аккаунт
const createAccount = async (req, res, next) => {
  try {
    const account = await Account.create(req.body);
    
    logger.info('Account created successfully', { accountId: account.id });
    
    res.status(201).json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// Получить список аккаунтов с фильтрацией и пагинацией
const getAccounts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      source,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Фильтры
    if (status) where.status = status;
    if (source) where.source = source;
    if (search) {
      where[Op.or] = [
        { login: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Account.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      attributes: { exclude: ['password'] } // Исключаем пароль из списка
    });

    res.json({
      success: true,
      data: {
        accounts: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit), // Исправлено: pages вместо totalPages
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Получить аккаунт по ID (без пароля)
const getAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const account = await Account.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

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

// НОВЫЙ МЕТОД: Получить полные данные аккаунта по ID (включая пароль)
const getAccountWithPassword = async (req, res, next) => {
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

    await account.update(req.body);
    
    logger.info('Account updated successfully', { accountId: id });
    
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

    await account.destroy();
    
    logger.info('Account deleted successfully', { accountId: id });
    
    res.json({
      success: true,
      message: 'Аккаунт успешно удалён'
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

    await account.update({ status });
    
    logger.info('Account status changed', { accountId: id, status });
    
    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// Получить статистику аккаунтов
const getAccountStats = async (req, res, next) => {
  try {
    const total = await Account.count();
    const active = await Account.count({ where: { status: 'active' } });
    const blocked = await Account.count({ where: { status: 'blocked' } });
    const suspended = await Account.count({ where: { status: 'suspended' } });

    res.json({
      success: true,
      data: {
        total,
        active,
        blocked,
        suspended
      }
    });
  } catch (error) {
    next(error);
  }
};

// Экспорт аккаунтов в JSON
const exportAccountsJSON = async (req, res, next) => {
  try {
    const { filters = {} } = req.query;
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;

    const accounts = await Account.findAll({ 
      where,
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    next(error);
  }
};

// Экспорт аккаунтов в CSV
const exportAccountsCSV = async (req, res, next) => {
  try {
    const { filters = {} } = req.query;
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;

    const accounts = await Account.findAll({ 
      where,
      attributes: ['login', 'email', 'status', 'source', 'createdAt']
    });

    // Формируем CSV
    const headers = ['Login', 'Email', 'Status', 'Source', 'Created At'];
    const rows = accounts.map(account => [
      account.login || '',
      account.email || '',
      account.status || '',
      account.source || '',
      account.createdAt ? account.createdAt.toISOString() : ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=accounts.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// Экспорт аккаунтов в TXT
const exportAccountsTXT = async (req, res, next) => {
  try {
    const { 
      format = 'login:password',
      filters = {}
    } = req.query;

    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;

    const accounts = await Account.findAll({ 
      where,
      attributes: ['login', 'password', 'email']
    });

    let txt = '';
    if (format === 'login:password') {
      txt = accounts
        .filter(account => account.login && account.password)
        .map(account => `${account.login}:${account.password}`)
        .join('\n');
    } else if (format === 'email:password') {
      txt = accounts
        .filter(account => account.email && account.password)
        .map(account => `${account.email}:${account.password}`)
        .join('\n');
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=accounts.txt');
    res.send(txt);
  } catch (error) {
    next(error);
  }
};

// Кастомный экспорт аккаунтов
const exportAccountsCustom = async (req, res, next) => {
  try {
    const { 
      fields = ['login', 'password'], 
      format = 'json',
      template,
      filters = {}
    } = req.body;

    // Валидация
    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Массив полей обязателен и не может быть пустым'
      });
    }

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
          const value = account[field] || '';
          line = line.replace(`{${field}}`, value);
        });
        return line;
      }).join('\n');

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename=accounts_custom.txt');
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

// Импорт аккаунтов из текста
const importAccountsFromText = async (req, res, next) => {
  try {
    const { text, format = 'login:password', delimiter = '\n' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Текст для импорта обязателен'
      });
    }

    const lines = text.split(delimiter).filter(line => line.trim());
    const accounts = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      try {
        let accountData = {};

        if (format === 'login:password') {
          const [login, password] = line.split(':');
          if (!login || !password) {
            throw new Error('Неверный формат строки');
          }
          accountData = { login, password };
        } else if (format === 'email:password') {
          const [email, password] = line.split(':');
          if (!email || !password) {
            throw new Error('Неверный формат строки');
          }
          accountData = { email, password };
        }

        accountData.source = 'import';
        accountData.status = 'active';

        const account = await Account.create(accountData);
        accounts.push(account);
      } catch (error) {
        errors.push({
          line: i + 1,
          text: line,
          error: error.message
        });
      }
    }

    logger.info('Accounts imported', { 
      total: lines.length, 
      success: accounts.length, 
      errors: errors.length 
    });

    res.json({
      success: true,
      data: {
        imported: accounts.length,
        errors: errors.length,
        accounts,
        importErrors: errors
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
        id: {
          [Op.in]: ids
        }
      }
    });

    logger.info('Bulk delete accounts', { count: deletedCount });

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

    const [updatedCount] = await Account.update(
      { status },
      {
        where: {
          id: {
            [Op.in]: ids
          }
        }
      }
    );

    logger.info('Bulk update account status', { count: updatedCount, status });

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
  createAccount,
  getAccounts,
  getAccount,
  getAccountWithPassword, // НОВЫЙ МЕТОД
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