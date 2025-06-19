// backend/src/controllers/accountController.js
const { Account } = require('../models');
const { Op, sequelize } = require('sequelize');
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
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: {
        accounts: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
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

// Получить полные данные аккаунта по ID (включая пароль)
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

    // Статистика по источникам
    const sourceStats = await Account.findAll({
      attributes: [
        'source',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['source'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        blocked,
        suspended,
        bySource: sourceStats.reduce((acc, item) => {
          acc[item.source || 'Unknown'] = parseInt(item.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};

// Получить доступные поля для экспорта (на основе реальной модели)
const getAccountFields = async (req, res, next) => {
  try {
    const fields = [
      { key: 'id', label: 'ID', type: 'number', description: 'Уникальный идентификатор аккаунта' },
      { key: 'login', label: 'Логин', type: 'text', description: 'Логин аккаунта' },
      { key: 'password', label: 'Пароль', type: 'password', description: 'Пароль аккаунта' },
      { key: 'email', label: 'Email', type: 'text', description: 'Email аккаунта' },
      { key: 'emailPassword', label: 'Пароль от Email', type: 'password', description: 'Пароль от email' },
      { key: 'emailRecovery', label: 'Резервный Email', type: 'text', description: 'Резервный email' },
      { key: 'emailPasswordRecovery', label: 'Пароль резервного Email', type: 'password', description: 'Пароль от резервного email' },
      { key: 'userAgent', label: 'User Agent', type: 'text', description: 'User Agent браузера' },
      { key: 'twoFA', label: '2FA', type: 'text', description: '2FA ключ' },
      { key: 'dob', label: 'Дата рождения', type: 'date', description: 'Дата рождения' },
      { key: 'nameProfiles', label: 'Имя профиля', type: 'text', description: 'Имя профиля' },
      { key: 'userId', label: 'User ID', type: 'text', description: 'User ID' },
      { key: 'cookies', label: 'Cookies', type: 'textarea', description: 'Cookies' },
      { key: 'status', label: 'Статус', type: 'select', description: 'Статус аккаунта' },
      { key: 'friendsCounts', label: 'Количество друзей', type: 'number', description: 'Количество друзей' },
      { key: 'note', label: 'Заметка', type: 'textarea', description: 'Заметка' },
      { key: 'statusCheck', label: 'Статус проверки', type: 'text', description: 'Статус проверки' },
      { key: 'eaab', label: 'EAAB токен', type: 'text', description: 'EAAB токен' },
      { key: 'namePage', label: 'Название страницы', type: 'text', description: 'Название страницы' },
      { key: 'data', label: 'Дополнительные данные', type: 'textarea', description: 'Дополнительные данные' },
      { key: 'dataRegistration', label: 'Дата регистрации', type: 'date', description: 'Дата регистрации' },
      { key: 'idActive', label: 'ID активности', type: 'text', description: 'ID активности' },
      { key: 'counter', label: 'Счетчик', type: 'number', description: 'Счетчик' },
      { key: 'code', label: 'Код', type: 'text', description: 'Код' },
      { key: 'device', label: 'Устройство', type: 'text', description: 'Устройство' },
      { key: 'emailJsonData', label: 'JSON данные Email', type: 'textarea', description: 'JSON данные email' },
      { key: 'lsposedJson', label: 'LSPosed JSON', type: 'textarea', description: 'LSPosed JSON данные' },
      { key: 'accessToken', label: 'Access Token', type: 'text', description: 'Access token' },
      { key: 'clientId', label: 'Client ID', type: 'text', description: 'Client ID' },
      { key: 'refreshToken', label: 'Refresh Token', type: 'text', description: 'Refresh token' },
      { key: 'source', label: 'Источник', type: 'text', description: 'Источник аккаунта' },
      { key: 'importDate', label: 'Дата импорта', type: 'date', description: 'Дата импорта' },
      { key: 'createdAt', label: 'Создан', type: 'date', description: 'Дата создания' },
      { key: 'updatedAt', label: 'Обновлен', type: 'date', description: 'Дата обновления' }
    ];

    res.json({
      success: true,
      data: { fields }
    });
  } catch (error) {
    next(error);
  }
};

// Улучшенный импорт аккаунтов из текста
const importAccountsFromText = async (req, res, next) => {
  try {
    const { 
      text, 
      format = 'login:password', 
      delimiter = '\n',
      validateEmails = false,
      allowDuplicates = false,
      defaultStatus = 'active',
      defaultSource = 'import'
    } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Текст для импорта обязателен'
      });
    }

    const lines = text.split(delimiter).filter(line => line.trim());
    const results = {
      imported: 0,
      skipped: 0,
      errors: [],
      total: lines.length,
      duplicates: []
    };

    // Валидация email
    const validateEmail = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        let accountData = {
          status: defaultStatus,
          source: defaultSource
        };

        // Парсинг в зависимости от формата
        if (format === 'login:password') {
          const parts = line.split(':');
          if (parts.length < 2) {
            throw new Error('Неверный формат: ожидается login:password');
          }
          accountData.login = parts[0].trim();
          accountData.password = parts.slice(1).join(':').trim(); // На случай если в пароле есть двоеточия
        } else if (format === 'email:password') {
          const parts = line.split(':');
          if (parts.length < 2) {
            throw new Error('Неверный формат: ожидается email:password');
          }
          accountData.email = parts[0].trim();
          accountData.password = parts.slice(1).join(':').trim();
          
          // Валидация email если включена
          if (validateEmails && !validateEmail(accountData.email)) {
            throw new Error('Неверный формат email');
          }
        }

        // Проверка на дубликаты если не разрешены
        if (!allowDuplicates) {
          const existingWhere = {};
          if (accountData.login) existingWhere.login = accountData.login;
          if (accountData.email) existingWhere.email = accountData.email;
          
          if (Object.keys(existingWhere).length > 0) {
            const existing = await Account.findOne({ 
              where: { [Op.or]: [existingWhere] }
            });
            
            if (existing) {
              results.duplicates.push({
                line: i + 1,
                text: line,
                existing: existing.id
              });
              results.skipped++;
              continue;
            }
          }
        }

        // Создание аккаунта
        const account = await Account.create(accountData);
        results.imported++;
        
      } catch (error) {
        results.errors.push({
          line: i + 1,
          text: line,
          error: error.message
        });
      }
    }

    logger.info('Accounts imported', { 
      total: results.total, 
      imported: results.imported, 
      skipped: results.skipped,
      errors: results.errors.length 
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Улучшенный экспорт аккаунтов в JSON
const exportAccountsJSON = async (req, res, next) => {
  try {
    const { 
      fields = [],
      filters = {},
      includePasswords = false
    } = req.query;

    const where = {};
    
    // Применяем фильтры
    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;
    if (filters.search) {
      where[Op.or] = [
        { login: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    // Определяем поля для выборки
    let attributes;
    if (fields && fields.length > 0) {
      attributes = Array.isArray(fields) ? fields : fields.split(',');
    } else {
      attributes = { exclude: includePasswords ? [] : ['password', 'emailPassword', 'emailPasswordRecovery'] };
    }

    const accounts = await Account.findAll({ 
      where,
      attributes
    });

    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    next(error);
  }
};

// Улучшенный экспорт аккаунтов в CSV
const exportAccountsCSV = async (req, res, next) => {
  try {
    const { 
      fields = ['id', 'login', 'email', 'status', 'source', 'createdAt'],
      filters = {}
    } = req.query;

    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;

    const selectedFields = Array.isArray(fields) ? fields : fields.split(',');
    
    const accounts = await Account.findAll({ 
      where,
      attributes: selectedFields
    });

    // Формируем CSV с динамическими заголовками
    const headers = selectedFields.map(field => {
      const fieldMap = {
        id: 'ID',
        login: 'Login',
        email: 'Email',
        password: 'Password',
        status: 'Status',
        source: 'Source',
        createdAt: 'Created At',
        updatedAt: 'Updated At'
      };
      return fieldMap[field] || field;
    });

    const rows = accounts.map(account => 
      selectedFields.map(field => {
        const value = account[field];
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value || '';
      })
    );

    const csv = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=accounts.csv');
    res.send('\uFEFF' + csv); // BOM для корректного отображения в Excel
  } catch (error) {
    next(error);
  }
};

// Улучшенный экспорт аккаунтов в TXT с поддержкой кастомных шаблонов
const exportAccountsTXT = async (req, res, next) => {
  try {
    const { 
      format = 'login:password',
      filters = {},
      customTemplate = '',
      customDelimiter = '\n'
    } = req.query;

    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;

    const accounts = await Account.findAll({ 
      where,
      attributes: ['login', 'password', 'email', 'userAgent', 'cookies', 'twoFA']
    });

    let txt = '';
    
    if (customTemplate) {
      // Кастомный шаблон
      txt = accounts.map(account => {
        let line = customTemplate;
        // Заменяем все возможные плейсхолдеры
        Object.keys(account.dataValues).forEach(key => {
          const value = account[key] || '';
          line = line.replace(new RegExp(`{${key}}`, 'g'), value);
        });
        return line;
      }).join(customDelimiter);
    } else {
      // Стандартные форматы
      if (format === 'login:password') {
        txt = accounts
          .filter(account => account.login && account.password)
          .map(account => `${account.login}:${account.password}`)
          .join(customDelimiter);
      } else if (format === 'email:password') {
        txt = accounts
          .filter(account => account.email && account.password)
          .map(account => `${account.email}:${account.password}`)
          .join(customDelimiter);
      } else if (format === 'login:password:email') {
        txt = accounts
          .filter(account => account.login && account.password)
          .map(account => `${account.login}:${account.password}:${account.email || ''}`)
          .join(customDelimiter);
      }
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=accounts.txt');
    res.send(txt);
  } catch (error) {
    next(error);
  }
};

// Кастомный экспорт (POST метод для сложных параметров)
const exportAccountsCustom = async (req, res, next) => {
  try {
    const { 
      fields = ['login', 'password'], 
      format = 'json',
      template = '',
      filters = {},
      options = {}
    } = req.body;

    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Массив полей обязателен и не может быть пустым'
      });
    }

    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;
    if (filters.search) {
      where[Op.or] = [
        { login: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    const accounts = await Account.findAll({ 
      where,
      attributes: fields 
    });

    if (format === 'template' && template) {
      const delimiter = options.delimiter || '\n';
      const txt = accounts.map(account => {
        let line = template;
        fields.forEach(field => {
          const value = account[field] || '';
          line = line.replace(new RegExp(`{${field}}`, 'g'), value);
        });
        return line;
      }).join(delimiter);

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
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
  getAccountWithPassword,
  updateAccount,
  deleteAccount,
  changeAccountStatus,
  getAccountStats,
  getAccountFields, // НОВЫЙ МЕТОД
  importAccountsFromText,
  bulkDeleteAccounts,
  bulkUpdateStatus,
  exportAccountsJSON,
  exportAccountsCSV,
  exportAccountsTXT,
  exportAccountsCustom
};