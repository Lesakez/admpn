const Joi = require('joi');
const { accountStatusSchema } = require('./statusValidator');

// Схема для создания аккаунта
const createAccountSchema = Joi.object({
  login: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Логин не может быть пустым',
    'string.max': 'Логин не может быть длиннее 255 символов',
    'any.required': 'Логин обязателен'
  }),
  password: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Пароль не может быть пустым',
    'string.max': 'Пароль не может быть длиннее 255 символов',
    'any.required': 'Пароль обязателен'
  }),
  email: Joi.string().email().max(255).allow('', null).messages({
    'string.email': 'Некорректный формат email',
    'string.max': 'Email не может быть длиннее 255 символов'
  }),
  emailPassword: Joi.string().max(255).allow('', null),
  emailRecovery: Joi.string().email().max(255).allow('', null).messages({
    'string.email': 'Некорректный формат резервного email'
  }),
  emailPasswordRecovery: Joi.string().max(255).allow('', null),
  userAgent: Joi.string().allow('', null),
  twoFA: Joi.string().max(255).allow('', null),
  dob: Joi.date().allow(null),
  nameProfiles: Joi.string().max(255).allow('', null),
  userId: Joi.string().max(255).allow('', null),
  cookies: Joi.string().allow('', null),
  status: accountStatusSchema.default('active'),
  friendsCounts: Joi.number().integer().min(0).allow(null),
  note: Joi.string().allow('', null),
  statusCheck: Joi.string().max(50).allow('', null),
  eaab: Joi.string().allow('', null),
  namePage: Joi.string().max(255).allow('', null),
  data: Joi.string().allow('', null),
  dataRegistration: Joi.date().allow(null),
  idActive: Joi.string().max(255).allow('', null),
  counter: Joi.number().integer().allow(null),
  code: Joi.string().max(255).allow('', null),
  device: Joi.string().max(255).allow('', null),
  emailJsonData: Joi.string().allow('', null),
  lsposedJson: Joi.string().allow('', null),
  accessToken: Joi.string().allow('', null),
  clientId: Joi.string().max(255).allow('', null),
  refreshToken: Joi.string().allow('', null),
  source: Joi.string().max(100).allow('', null),
  importDate: Joi.date().allow(null)
});

// Схема для обновления аккаунта
const updateAccountSchema = Joi.object({
  login: Joi.string().min(1).max(255).messages({
    'string.empty': 'Логин не может быть пустым',
    'string.max': 'Логин не может быть длиннее 255 символов'
  }),
  password: Joi.string().min(1).max(255).messages({
    'string.empty': 'Пароль не может быть пустым',
    'string.max': 'Пароль не может быть длиннее 255 символов'
  }),
  email: Joi.string().email().max(255).allow('', null),
  emailPassword: Joi.string().max(255).allow('', null),
  emailRecovery: Joi.string().email().max(255).allow('', null),
  emailPasswordRecovery: Joi.string().max(255).allow('', null),
  userAgent: Joi.string().allow('', null),
  twoFA: Joi.string().max(255).allow('', null),
  dob: Joi.date().allow(null),
  nameProfiles: Joi.string().max(255).allow('', null),
  userId: Joi.string().max(255).allow('', null),
  cookies: Joi.string().allow('', null),
  status: accountStatusSchema,
  friendsCounts: Joi.number().integer().min(0).allow(null),
  note: Joi.string().allow('', null),
  statusCheck: Joi.string().max(50).allow('', null),
  eaab: Joi.string().allow('', null),
  namePage: Joi.string().max(255).allow('', null),
  data: Joi.string().allow('', null),
  dataRegistration: Joi.date().allow(null),
  idActive: Joi.string().max(255).allow('', null),
  counter: Joi.number().integer().allow(null),
  code: Joi.string().max(255).allow('', null),
  device: Joi.string().max(255).allow('', null),
  emailJsonData: Joi.string().allow('', null),
  lsposedJson: Joi.string().allow('', null),
  accessToken: Joi.string().allow('', null),
  clientId: Joi.string().max(255).allow('', null),
  refreshToken: Joi.string().allow('', null),
  source: Joi.string().max(100).allow('', null),
  importDate: Joi.date().allow(null)
});

// Middleware для валидации создания аккаунта
const validateAccount = (req, res, next) => {
  const { error } = createAccountSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации',
      details: errors
    });
  }
  
  next();
};

// Middleware для валидации обновления аккаунта
const validateAccountUpdate = (req, res, next) => {
  const { error } = updateAccountSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации',
      details: errors
    });
  }
  
  next();
};

module.exports = {
  validateAccount,
  validateAccountUpdate,
  createAccountSchema,
  updateAccountSchema
};