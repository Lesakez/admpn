// backend/src/controllers/accountController.js
const { Account, sequelize } = require('../models');
const { Op, DataTypes } = require('sequelize');
const logger = require('../utils/logger');

/**
 * ДИНАМИЧЕСКИЙ КОНТРОЛЛЕР БЕЗ ХАРДКОДА
 * - Автоматически определяет поля модели
 * - Динамически получает возможные значения для фильтров
 * - Поддерживает импорт/экспорт всех полей
 * - Гибкая система статусов и форматов
 */

// Получить метаданные модели аккаунтов
const getModelMetadata = () => {
  const attributes = Account.rawAttributes;
  const fields = {};
  const sensitiveFields = ['password', 'emailPassword', 'emailPasswordRecovery', 'twoFA'];
  const publicFields = [];
  const exportableFields = [];
  const importableFields = [];

  Object.keys(attributes).forEach(fieldName => {
    const field = attributes[fieldName];
    const fieldInfo = {
      name: fieldName,
      type: field.type.constructor.name,
      allowNull: field.allowNull,
      primaryKey: field.primaryKey,
      autoIncrement: field.autoIncrement,
      isSensitive: sensitiveFields.includes(fieldName),
      dbField: field.field || fieldName
    };

    fields[fieldName] = fieldInfo;

    // Публичные поля (для обычного отображения)
    if (!fieldInfo.isSensitive && !fieldInfo.primaryKey) {
      publicFields.push(fieldName);
    }

    // Экспортируемые поля (включая чувствительные, но исключая автогенерируемые)
    if (!fieldInfo.autoIncrement) {
      exportableFields.push(fieldName);
    }

    // Импортируемые поля (исключая первичные ключи и автогенерируемые)
    if (!fieldInfo.primaryKey && !fieldInfo.autoIncrement) {
      importableFields.push(fieldName);
    }
  });

  return {
    fields,
    publicFields,
    exportableFields,
    importableFields,
    sensitiveFields
  };
};

// ======================
// НОВЫЕ МЕТОДЫ ИМПОРТА/ЭКСПОРТА
// ======================

/**
 * Получить конфигурацию импорта
 * Возвращает только серверные данные
 */
const getImportConfig = async (req, res, next) => {
  try {
    const metadata = getModelMetadata();
    
    const config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxRecords: 10000,
      importableFields: metadata.importableFields,
      fieldTypes: Object.keys(metadata.fields).reduce((acc, fieldName) => {
        acc[fieldName] = metadata.fields[fieldName].type;
        return acc;
      }, {})
    };
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Получить конфигурацию экспорта
 * Возвращает только серверные ограничения
 */
const getExportConfig = async (req, res, next) => {
  try {
    const config = {
      maxRecords: 100000,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      supportedFormats: ['csv', 'json', 'txt'],
      exportTypes: [
        {
          value: 'all',
          title: 'Все аккаунты',
          description: 'Экспорт всех аккаунтов без фильтров',
          icon: 'cilTask'
        },
        {
          value: 'filtered',
          title: 'Фильтрованный экспорт',
          description: 'С учетом текущих фильтров',
          icon: 'cilFilter'
        },
        {
          value: 'selected',
          title: 'Выбранные записи',
          description: 'Только предварительно выбранные аккаунты',
          icon: 'cilCheck'
        }
      ],
      formats: [
        {
          value: 'csv',
          label: 'CSV (Excel)',
          description: 'Таблица для Excel с выбранными полями',
          extension: 'csv',
          mimeType: 'text/csv',
          supportsFields: true,
          supportsHeaders: true
        },
        {
          value: 'json',
          label: 'JSON',
          description: 'Полные данные в JSON формате',
          extension: 'json',
          mimeType: 'application/json',
          supportsFields: true
        },
        {
          value: 'txt',
          label: 'TXT (Кастомный)',
          description: 'Текстовый формат с настраиваемым шаблоном',
          extension: 'txt',
          mimeType: 'text/plain',
          supportsTemplate: true,
          supportsFields: true,
          defaultTemplate: '{login}:{password}:{email}'
        }
      ]
    };
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Получить доступные поля для экспорта
 * Динамически из модели
 */
const getExportFields = async (req, res, next) => {
  try {
    const metadata = getModelMetadata();
    
    const fieldLabels = {
      id: 'ID',
      login: 'Логин',
      password: 'Пароль',
      email: 'Email',
      emailPassword: 'Пароль Email',
      emailPasswordRecovery: 'Резервный пароль Email',
      status: 'Статус',
      createdAt: 'Дата создания',
      updatedAt: 'Дата обновления',
      twoFA: '2FA код',
      proxy: 'Прокси',
      phoneNumber: 'Номер телефона'
    };
    
    const fields = metadata.exportableFields.map(fieldName => {
      const field = metadata.fields[fieldName];
      return {
        key: fieldName,
        label: fieldLabels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
        type: field.type,
        required: fieldName === 'id',
        defaultSelected: ['id', 'login', 'email', 'status'].includes(fieldName),
        sensitive: metadata.sensitiveFields.includes(fieldName)
      };
    });
    
    res.json({
      success: true,
      data: fields
    });
  } catch (error) {
    next(error);
  }
};

// ======================
// ВСЕ ОСТАЛЬНЫЕ СУЩЕСТВУЮЩИЕ МЕТОДЫ
// ======================

// Динамически получить уникальные значения для полей
const getFieldValues = async (fieldName, limit = 100) => {
  try {
    const results = await Account.findAll({
      attributes: [fieldName],
      where: { 
        [fieldName]: { [Op.ne]: null },
        [fieldName]: { [Op.ne]: '' }
      },
      group: [fieldName],
      limit,
      order: [[sequelize.fn('COUNT', sequelize.col(fieldName)), 'DESC']]
    });

    return results.map(item => item[fieldName]).filter(Boolean);
  } catch (error) {
    logger.warn(`Error getting values for field ${fieldName}:`, error.message);
    return [];
  }
};

// Получить список аккаунтов с динамической фильтрацией
const getAccounts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'id',
      sortOrder = 'DESC',
      fields = 'public', // 'public', 'all', 'custom' или массив полей
      includeSensitive = false,
      ...filters // Все остальные параметры как фильтры
    } = req.query;

    const metadata = getModelMetadata();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Определяем какие поля возвращать
    let selectFields;
    if (fields === 'public') {
      selectFields = metadata.publicFields;
    } else if (fields === 'all') {
      selectFields = Object.keys(metadata.fields);
    } else if (Array.isArray(fields)) {
      selectFields = fields.filter(f => metadata.fields[f]);
    } else if (typeof fields === 'string' && fields !== 'public') {
      selectFields = fields.split(',').filter(f => metadata.fields[f]);
    } else {
      selectFields = metadata.publicFields;
    }

    // Исключаем чувствительные поля если не запрошены явно
    if (!includeSensitive || includeSensitive !== 'true') {
      selectFields = selectFields.filter(f => !metadata.sensitiveFields.includes(f));
    }

    // Всегда включаем ID для работы с записями
    if (!selectFields.includes('id')) {
      selectFields = ['id', ...selectFields];
    }

    // Формируем условия поиска
    const where = {};
    
    // Глобальный поиск по текстовым полям
    if (search) {
      const searchableFields = Object.keys(metadata.fields).filter(fieldName => {
        const field = metadata.fields[fieldName];
        return field.type.includes('STRING') || field.type.includes('TEXT');
      });

      if (searchableFields.length > 0) {
        where[Op.or] = searchableFields.map(field => ({
          [field]: { [Op.like]: `%${search}%` }
        }));
      }
    }
    
    // Динамические фильтры по полям
    Object.keys(filters).forEach(filterKey => {
      if (metadata.fields[filterKey] && filters[filterKey]) {
        const filterValue = filters[filterKey];
        
        // Поддержка различных операторов фильтрации
        if (filterValue.startsWith('!=')) {
          where[filterKey] = { [Op.ne]: filterValue.substring(2) };
        } else if (filterValue.startsWith('>=')) {
          where[filterKey] = { [Op.gte]: filterValue.substring(2) };
        } else if (filterValue.startsWith('<=')) {
          where[filterKey] = { [Op.lte]: filterValue.substring(2) };
        } else if (filterValue.startsWith('>')) {
          where[filterKey] = { [Op.gt]: filterValue.substring(1) };
        } else if (filterValue.startsWith('<')) {
          where[filterKey] = { [Op.lt]: filterValue.substring(1) };
        } else if (filterValue.includes(',')) {
          // Множественный выбор
          where[filterKey] = { [Op.in]: filterValue.split(',') };
        } else {
          where[filterKey] = filterValue;
        }
      }
    });

    const { count, rows: accounts } = await Account.findAndCountAll({
      attributes: selectFields,
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    res.json({
      success: true,
      data: {
        accounts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        },
        metadata: {
          fields: selectFields,
          totalFields: Object.keys(metadata.fields).length,
          appliedFilters: Object.keys(filters),
          searchApplied: !!search
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Получить метаданные и возможные значения полей
const getAccountFields = async (req, res, next) => {
  try {
    const { includeValues = true, valueLimit = 50 } = req.query;
    const metadata = getModelMetadata();
    
    const fieldData = {};
    
    // Получаем возможные значения для каждого поля (если запрошено)
    if (includeValues === 'true') {
      for (const fieldName of Object.keys(metadata.fields)) {
        const field = metadata.fields[fieldName];
        
        // Получаем значения только для не-чувствительных и не-слишком-длинных полей
        if (!field.isSensitive && !field.primaryKey && !field.autoIncrement) {
          const values = await getFieldValues(fieldName, parseInt(valueLimit));
          fieldData[fieldName] = {
            ...field,
            possibleValues: values,
            uniqueCount: values.length
          };
        } else {
          fieldData[fieldName] = field;
        }
      }
    } else {
      Object.assign(fieldData, metadata.fields);
    }

    res.json({
      success: true,
      data: {
        fields: fieldData,
        categories: {
          public: metadata.publicFields,
          exportable: metadata.exportableFields,
          importable: metadata.importableFields,
          sensitive: metadata.sensitiveFields
        },
        totalFields: Object.keys(metadata.fields).length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Получить динамическую статистику
const getAccountStats = async (req, res, next) => {
  try {
    const { groupBy = [], includePercentages = true } = req.query;
    const metadata = getModelMetadata();
    
    // Базовая статистика
    const totalAccounts = await Account.count();
    const recentAccounts = await Account.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    const stats = {
      total: totalAccounts,
      recent24h: recentAccounts
    };

    // Динамическая группировка по запрошенным полям
    const groupFields = Array.isArray(groupBy) ? groupBy : 
                       typeof groupBy === 'string' ? groupBy.split(',') : 
                       ['status', 'source']; // По умолчанию

    for (const fieldName of groupFields) {
      if (metadata.fields[fieldName] && !metadata.sensitiveFields.includes(fieldName)) {
        try {
          const groupStats = await Account.findAll({
            attributes: [
              fieldName,
              [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: { [fieldName]: { [Op.ne]: null } },
            group: [fieldName],
            raw: true
          });

          const groupStatsObj = groupStats.reduce((acc, item) => {
            acc[item[fieldName] || 'unknown'] = parseInt(item.count);
            return acc;
          }, {});

          stats[`by${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`] = groupStatsObj;

          // Добавляем проценты если запрошено
          if (includePercentages === 'true' && totalAccounts > 0) {
            const percentages = {};
            Object.entries(groupStatsObj).forEach(([key, value]) => {
              percentages[key] = ((value / totalAccounts) * 100).toFixed(1);
            });
            stats[`${fieldName}Percentages`] = percentages;
          }
        } catch (error) {
          logger.warn(`Error calculating stats for field ${fieldName}:`, error.message);
        }
      }
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// Универсальный импорт аккаунтов
const importAccountsFromText = async (req, res, next) => {
  try {
    const { 
      text, 
      format = 'auto', // 'auto', 'custom', или готовый формат
      delimiter = ':',
      fieldMapping = null, // Маппинг полей {0: 'login', 1: 'password', ...}
      source = 'import',
      batchSize = 100,
      skipErrors = true,
      updateExisting = false
    } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Текст для импорта обязателен'
      });
    }

    const metadata = getModelMetadata();
    const lines = text.split('\n').filter(line => line.trim());
    const imported = [];
    const updated = [];
    const errors = [];

    // Определяем маппинг полей
    let mapping = {};
    
    if (fieldMapping) {
      mapping = fieldMapping;
    } else if (format === 'auto') {
      // Автоматическое определение формата по первой строке
      const firstLine = lines[0]?.trim();
      if (firstLine) {
        const parts = firstLine.split(delimiter);
        if (parts.length >= 2) {
          // Базовое определение: login:password или email:password
          if (parts[0].includes('@')) {
            mapping = { 0: 'email', 1: 'password' };
          } else {
            mapping = { 0: 'login', 1: 'password' };
          }
          
          // Дополнительные поля если есть
          if (parts.length > 2) {
            if (!parts[0].includes('@') && parts[2].includes('@')) {
              mapping[2] = 'email';
            }
          }
        }
      }
    } else {
      // Предустановленные форматы
      const formats = {
        'login:password': { 0: 'login', 1: 'password' },
        'email:password': { 0: 'email', 1: 'password' },
        'login:password:email': { 0: 'login', 1: 'password', 2: 'email' },
        'email:password:login': { 0: 'email', 1: 'password', 2: 'login' }
      };
      mapping = formats[format] || formats['login:password'];
    }

    // Обрабатываем строки батчами
    for (let i = 0; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      
      for (const line of batch) {
        try {
          const parts = line.trim().split(delimiter);
          const accountData = { source };

          // Применяем маппинг полей
          Object.entries(mapping).forEach(([index, fieldName]) => {
            const value = parts[parseInt(index)]?.trim();
            if (value && metadata.importableFields.includes(fieldName)) {
              accountData[fieldName] = value;
            }
          });

          // Проверяем минимальные требования
          if (!accountData.login && !accountData.email) {
            if (skipErrors) {
              errors.push(`Строка пропущена (нет логина или email): ${line}`);
              continue;
            } else {
              throw new Error('Требуется логин или email');
            }
          }

          // Проверяем существование аккаунта для обновления
          let existingAccount = null;
          if (updateExisting) {
            const whereCondition = {};
            if (accountData.login) whereCondition.login = accountData.login;
            if (accountData.email) whereCondition.email = accountData.email;
            
            existingAccount = await Account.findOne({ where: whereCondition });
          }

          if (existingAccount) {
            // Обновляем существующий
            await existingAccount.update(accountData);
            updated.push({
              id: existingAccount.id,
              login: existingAccount.login,
              email: existingAccount.email,
              action: 'updated'
            });
          } else {
            // Создаем новый
            const account = await Account.create(accountData);
            imported.push({
              id: account.id,
              login: account.login,
              email: account.email,
              action: 'created'
            });
          }
        } catch (error) {
          const errorMsg = `Ошибка обработки строки "${line}": ${error.message}`;
          if (skipErrors) {
            errors.push(errorMsg);
          } else {
            return res.status(400).json({
              success: false,
              error: errorMsg,
              processedLines: imported.length + updated.length
            });
          }
        }
      }
    }

    logger.info('Accounts import completed', { 
      totalLines: lines.length,
      imported: imported.length,
      updated: updated.length,
      errors: errors.length,
      mapping
    });

    res.json({
      success: true,
      data: {
        processed: lines.length,
        imported: imported.length,
        updated: updated.length,
        errors: errors.length,
        mapping: mapping,
        accounts: [...imported, ...updated],
        errorDetails: errors.slice(0, 100) // Ограничиваем количество ошибок в ответе
      },
      message: `Обработано: ${lines.length}, создано: ${imported.length}, обновлено: ${updated.length}, ошибок: ${errors.length}`
    });
  } catch (error) {
    next(error);
  }
};

// Универсальный экспорт аккаунтов
const exportAccounts = async (req, res, next) => {
  try {
    const { 
      format = 'json', // 'json', 'csv', 'txt', 'xml'
      fields = 'exportable', // 'all', 'public', 'exportable' или массив полей
      includeSensitive = false,
      filters = {},
      template = null, // Шаблон для txt формата: "{login}:{password}"
      delimiter = ':',
      csvSeparator = ',',
      limit = 10000,
      ...queryFilters
    } = req.body;

    const metadata = getModelMetadata();
    
    // Определяем поля для экспорта
    let exportFields;
    if (fields === 'all') {
      exportFields = Object.keys(metadata.fields);
    } else if (fields === 'public') {
      exportFields = metadata.publicFields;
    } else if (fields === 'exportable') {
      exportFields = metadata.exportableFields;
    } else if (Array.isArray(fields)) {
      exportFields = fields.filter(f => metadata.fields[f]);
    } else {
      exportFields = metadata.exportableFields;
    }

    // Исключаем чувствительные поля если не запрошены
    if (!includeSensitive || includeSensitive !== 'true') {
      exportFields = exportFields.filter(f => !metadata.sensitiveFields.includes(f));
    }

    // Формируем условия фильтрации
    const where = {};
    Object.keys({...filters, ...queryFilters}).forEach(filterKey => {
      if (metadata.fields[filterKey] && (filters[filterKey] || queryFilters[filterKey])) {
        const filterValue = filters[filterKey] || queryFilters[filterKey];
        where[filterKey] = Array.isArray(filterValue) ? 
          { [Op.in]: filterValue } : filterValue;
      }
    });

    const accounts = await Account.findAll({
      attributes: exportFields,
      where,
      limit: parseInt(limit),
      order: [['id', 'ASC']]
    });

    let result = '';
    let contentType = 'text/plain';
    let filename = `accounts_${new Date().toISOString().split('T')[0]}`;

    switch (format.toLowerCase()) {
      case 'json':
        result = JSON.stringify({
          exportedAt: new Date().toISOString(),
          totalCount: accounts.length,
          fields: exportFields,
          filters: where,
          accounts: accounts.map(account => account.toJSON())
        }, null, 2);
        contentType = 'application/json';
        filename += '.json';
        break;

      case 'csv':
        const csvHeaders = exportFields;
        const csvRows = accounts.map(account => 
          exportFields.map(field => {
            const value = account[field];
            return value !== null && value !== undefined ? 
              `"${String(value).replace(/"/g, '""')}"` : '""';
          })
        );
        result = [csvHeaders, ...csvRows]
          .map(row => row.join(csvSeparator))
          .join('\n');
        contentType = 'text/csv';
        filename += '.csv';
        break;

      case 'txt':
        if (template) {
          // Используем шаблон
          result = accounts.map(account => {
            let line = template;
            exportFields.forEach(field => {
              const value = account[field] || '';
              line = line.replace(new RegExp(`{${field}}`, 'g'), value);
            });
            return line;
          }).join('\n');
        } else {
          // Стандартное форматирование
          result = accounts.map(account => 
            exportFields.map(field => account[field] || '').join(delimiter)
          ).join('\n');
        }
        filename += '.txt';
        break;

      case 'xml':
        result = `<?xml version="1.0" encoding="UTF-8"?>\n<accounts>\n`;
        result += `  <metadata>\n`;
        result += `    <exportedAt>${new Date().toISOString()}</exportedAt>\n`;
        result += `    <totalCount>${accounts.length}</totalCount>\n`;
        result += `    <fields>${exportFields.join(',')}</fields>\n`;
        result += `  </metadata>\n`;
        
        accounts.forEach(account => {
          result += `  <account>\n`;
          exportFields.forEach(field => {
            const value = account[field] || '';
            result += `    <${field}>${String(value).replace(/[<>&]/g, char => 
              ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[char]))}</${field}>\n`;
          });
          result += `  </account>\n`;
        });
        result += `</accounts>`;
        contentType = 'application/xml';
        filename += '.xml';
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Неподдерживаемый формат. Доступные: json, csv, txt, xml'
        });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(result);

    logger.info('Accounts exported', {
      format,
      fieldsCount: exportFields.length,
      accountsCount: accounts.length,
      filters: Object.keys(where)
    });
  } catch (error) {
    next(error);
  }
};

// Остальные стандартные методы CRUD
const getAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeSensitive = false } = req.query;
    const metadata = getModelMetadata();

    let attributes = metadata.publicFields;
    if (includeSensitive === 'true') {
      attributes = Object.keys(metadata.fields);
    }
    
    if (!attributes.includes('id')) {
      attributes = ['id', ...attributes];
    }

    const account = await Account.findByPk(id, { attributes });

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

const createAccount = async (req, res, next) => {
  try {
    const metadata = getModelMetadata();
    
    // Фильтруем только допустимые для импорта поля
    const accountData = {};
    Object.keys(req.body).forEach(key => {
      if (metadata.importableFields.includes(key)) {
        accountData[key] = req.body[key];
      }
    });

    const account = await Account.create(accountData);

    logger.info('Account created', { accountId: account.id, login: account.login });

    // Возвращаем публичные поля
    const publicAccount = {};
    [...metadata.publicFields, 'id'].forEach(field => {
      publicAccount[field] = account[field];
    });

    res.status(201).json({
      success: true,
      data: publicAccount,
      message: 'Аккаунт успешно создан'
    });
  } catch (error) {
    next(error);
  }
};

const updateAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const metadata = getModelMetadata();
    
    const account = await Account.findByPk(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Аккаунт не найден'
      });
    }

    // Фильтруем только допустимые для обновления поля
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (metadata.importableFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    await account.update(updateData);

    logger.info('Account updated', { accountId: id, fieldsUpdated: Object.keys(updateData) });

    // Возвращаем публичные поля
    const publicAccount = {};
    [...metadata.publicFields, 'id'].forEach(field => {
      publicAccount[field] = account[field];
    });

    res.json({
      success: true,
      data: publicAccount,
      message: 'Аккаунт успешно обновлен'
    });
  } catch (error) {
    next(error);
  }
};

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

    logger.info('Account deleted', { accountId: id });

    res.json({
      success: true,
      message: 'Аккаунт успешно удален'
    });
  } catch (error) {
    next(error);
  }
};

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

    logger.info('Account status changed', { 
      accountId: id, 
      oldStatus, 
      newStatus: status 
    });

    res.json({
      success: true,
      data: {
        id: account.id,
        oldStatus,
        newStatus: status
      },
      message: `Статус аккаунта изменен с "${oldStatus}" на "${status}"`
    });
  } catch (error) {
    next(error);
  }
};

const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать массив ID аккаунтов'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать новый статус'
      });
    }

    const [updatedCount] = await Account.update(
      { status },
      { where: { id: { [Op.in]: ids } } }
    );

    logger.info('Bulk status update', { 
      accountIds: ids,
      newStatus: status,
      updatedCount
    });

    res.json({
      success: true,
      message: `Статус обновлен для ${updatedCount} аккаунтов`,
      data: {
        updatedCount,
        newStatus: status,
        accountIds: ids
      }
    });
  } catch (error) {
    next(error);
  }
};

const bulkDeleteAccounts = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать массив ID аккаунтов'
      });
    }

    const accountsToDelete = await Account.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: ['id', 'login']
    });

    const deletedCount = await Account.destroy({
      where: { id: { [Op.in]: ids } }
    });

    logger.info('Bulk delete accounts', { 
      accountIds: ids,
      deletedCount,
      accounts: accountsToDelete.map(a => ({ id: a.id, login: a.login }))
    });

    res.json({
      success: true,
      message: `Удалено аккаунтов: ${deletedCount}`,
      data: {
        deletedCount,
        deletedAccounts: accountsToDelete.map(a => ({ id: a.id, login: a.login }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Совместимость с существующими методами экспорта
const exportAccountsJSON = (req, res, next) => {
  req.body = { ...req.query, format: 'json' };
  return exportAccounts(req, res, next);
};

const exportAccountsCSV = (req, res, next) => {
  req.body = { ...req.query, format: 'csv' };
  return exportAccounts(req, res, next);
};

const exportAccountsTXT = (req, res, next) => {
  req.body = { ...req.query, format: 'txt' };
  return exportAccounts(req, res, next);
};

const exportAccountsCustom = (req, res, next) => {
  return exportAccounts(req, res, next);
};

// Получить полные данные аккаунта (включая пароль) - для совместимости
const getAccountWithPassword = async (req, res, next) => {
  req.query.includeSensitive = 'true';
  return getAccount(req, res, next);
};

module.exports = {
  // Основные CRUD операции
  getAccounts,
  getAccount,
  getAccountWithPassword,
  createAccount,
  updateAccount,
  deleteAccount,
  
  // Управление статусами
  changeAccountStatus,
  bulkUpdateStatus,
  bulkDeleteAccounts,
  
  // Метаданные и статистика
  getAccountFields,
  getAccountStats,
  
  // НОВЫЕ МЕТОДЫ импорта/экспорта
  getImportConfig,
  getExportConfig,
  getExportFields,
  
  // Импорт/экспорт операции
  importAccountsFromText,
  exportAccounts,
  
  // Совместимость с существующими методами
  exportAccountsJSON,
  exportAccountsCSV,
  exportAccountsTXT,
  exportAccountsCustom
};