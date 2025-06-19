const Joi = require('joi');

// Схема для создания прокси
const createProxySchema = Joi.object({
  ipPort: Joi.string().required().messages({
    'string.empty': 'IP:Port не может быть пустым',
    'any.required': 'IP:Port обязателен'
  }),
  protocol: Joi.string().valid('http', 'https', 'socks4', 'socks5').default('http').messages({
    'any.only': 'Протокол должен быть одним из: http, https, socks4, socks5'
  }),
  login: Joi.string().allow('', null).messages({
    'string.base': 'Логин должен быть строкой'
  }),
  password: Joi.string().allow('', null).messages({
    'string.base': 'Пароль должен быть строкой'
  }),
  country: Joi.string().allow('', null).messages({
    'string.base': 'Страна должна быть строкой'
  }),
  status: Joi.string().valid('free', 'busy', 'blocked', 'error').default('free').messages({
    'any.only': 'Статус должен быть одним из: free, busy, blocked, error'
  }),
  projectId: Joi.number().integer().allow(null).messages({
    'number.base': 'ID проекта должен быть числом',
    'number.integer': 'ID проекта должен быть целым числом'
  }),
  notes: Joi.string().allow('', null).max(1000).messages({
    'string.max': 'Заметки не могут быть длиннее 1000 символов'
  })
});

// Схема для обновления прокси
const updateProxySchema = Joi.object({
  ipPort: Joi.string().messages({
    'string.empty': 'IP:Port не может быть пустым'
  }),
  protocol: Joi.string().valid('http', 'https', 'socks4', 'socks5').messages({
    'any.only': 'Протокол должен быть одним из: http, https, socks4, socks5'
  }),
  login: Joi.string().allow('', null).messages({
    'string.base': 'Логин должен быть строкой'
  }),
  password: Joi.string().allow('', null).messages({
    'string.base': 'Пароль должен быть строкой'
  }),
  country: Joi.string().allow('', null).messages({
    'string.base': 'Страна должна быть строкой'
  }),
  status: Joi.string().valid('free', 'busy', 'blocked', 'error').messages({
    'any.only': 'Статус должен быть одним из: free, busy, blocked, error'
  }),
  projectId: Joi.number().integer().allow(null).messages({
    'number.base': 'ID проекта должен быть числом',
    'number.integer': 'ID проекта должен быть целым числом'
  }),
  notes: Joi.string().allow('', null).max(1000).messages({
    'string.max': 'Заметки не могут быть длиннее 1000 символов'
  })
});

// Middleware для валидации создания прокси
const validateProxy = (req, res, next) => {
  const { error } = createProxySchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации прокси',
      details: errors
    });
  }
  
  next();
};

// Middleware для валидации обновления прокси
const validateProxyUpdate = (req, res, next) => {
  const { error } = updateProxySchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации обновления прокси',
      details: errors
    });
  }
  
  next();
};

module.exports = {
  validateProxy,
  validateProxyUpdate,
  createProxySchema,
  updateProxySchema
};