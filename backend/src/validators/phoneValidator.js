const Joi = require('joi');
const { phoneStatusSchema } = require('./statusValidator');

// Схема для создания телефона
const createPhoneSchema = Joi.object({
  model: Joi.string().max(255).allow('', null),
  device: Joi.string().max(255).allow('', null),
  androidVersion: Joi.string().max(50).allow('', null),
  ipAddress: Joi.string().ip().allow('', null).messages({
    'string.ip': 'IP адрес должен быть корректным'
  }),
  macAddress: Joi.string().pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).allow('', null).messages({
    'string.pattern.base': 'MAC адрес должен быть в формате XX:XX:XX:XX:XX:XX'
  }),
  status: phoneStatusSchema.default('free'),
  projectId: Joi.number().integer().positive().allow(null).messages({
    'number.positive': 'ID проекта должен быть положительным числом'
  })
});

// Схема для обновления телефона
const updatePhoneSchema = Joi.object({
  model: Joi.string().max(255).allow('', null),
  device: Joi.string().max(255).allow('', null),
  androidVersion: Joi.string().max(50).allow('', null),
  ipAddress: Joi.string().ip().allow('', null).messages({
    'string.ip': 'IP адрес должен быть корректным'
  }),
  macAddress: Joi.string().pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).allow('', null).messages({
    'string.pattern.base': 'MAC адрес должен быть в формате XX:XX:XX:XX:XX:XX'
  }),
  status: phoneStatusSchema,
  projectId: Joi.number().integer().positive().allow(null).messages({
    'number.positive': 'ID проекта должен быть положительным числом'
  })
});

// Middleware для валидации создания телефона
const validatePhone = (req, res, next) => {
  const { error } = createPhoneSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации телефона',
      details: errors
    });
  }
  
  next();
};

// Middleware для валидации обновления телефона
const validatePhoneUpdate = (req, res, next) => {
  const { error } = updatePhoneSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации обновления телефона',
      details: errors
    });
  }
  
  next();
};

module.exports = {
  validatePhone,
  validatePhoneUpdate,
  createPhoneSchema,
  updatePhoneSchema
};