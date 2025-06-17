const Joi = require('joi');

// Схема для создания прокси
const createProxySchema = Joi.object({
  type: Joi.string().max(50).allow('', null),
  ipPort: Joi.string().pattern(/^.+:\d+$/).required().messages({
    'string.pattern.base': 'IP:Port должен быть в формате "IP:PORT"',
    'any.required': 'IP:Port обязателен'
  }),
  login: Joi.string().max(255).allow('', null),
  password: Joi.string().max(255).allow('', null),
  changeIpUrl: Joi.string().uri().allow('', null).messages({
    'string.uri': 'URL для смены IP должен быть корректным URL'
  }),
  status: Joi.string().valid('free', 'busy', 'inactive').default('free'),
  country: Joi.string().max(100).allow('', null),
  projectId: Joi.number().integer().positive().allow(null).messages({
    'number.positive': 'ID проекта должен быть положительным числом'
  })
});

// Схема для обновления прокси
const updateProxySchema = Joi.object({
  type: Joi.string().max(50).allow('', null),
  ipPort: Joi.string().pattern(/^.+:\d+$/).messages({
    'string.pattern.base': 'IP:Port должен быть в формате "IP:PORT"'
  }),
  login: Joi.string().max(255).allow('', null),
  password: Joi.string().max(255).allow('', null),
  changeIpUrl: Joi.string().uri().allow('', null).messages({
    'string.uri': 'URL для смены IP должен быть корректным URL'
  }),
  status: Joi.string().valid('free', 'busy', 'inactive'),
  country: Joi.string().max(100).allow('', null),
  projectId: Joi.number().integer().positive().allow(null).messages({
    'number.positive': 'ID проекта должен быть положительным числом'
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