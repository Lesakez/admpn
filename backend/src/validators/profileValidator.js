const Joi = require('joi');

// Схема для одного профиля
const profileSchema = Joi.object({
  profileId: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Profile ID не может быть пустым',
    'string.max': 'Profile ID не может быть длиннее 255 символов',
    'any.required': 'Profile ID обязателен'
  }),
  name: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Название профиля не может быть пустым',
    'string.max': 'Название профиля не может быть длиннее 255 символов',
    'any.required': 'Название профиля обязательно'
  }),
  folderId: Joi.string().max(255).allow('', null),
  folderName: Joi.string().max(255).allow('', null),
  workspaceId: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'Workspace ID не может быть пустым',
    'string.max': 'Workspace ID не может быть длиннее 50 символов',
    'any.required': 'Workspace ID обязателен'
  }),
  workspaceName: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Название workspace не может быть пустым',
    'string.max': 'Название workspace не может быть длиннее 255 символов',
    'any.required': 'Название workspace обязательно'
  }),
  proxy: Joi.string().required().messages({
    'string.empty': 'Прокси настройки не могут быть пустыми',
    'any.required': 'Прокси настройки обязательны'
  }),
  userId: Joi.string().max(255).allow('', null),
  status: Joi.string().valid('created', 'active', 'inactive', 'working', 'banned').default('created')
});

// Схема для массива профилей
const profilesArraySchema = Joi.array().items(profileSchema).min(1).messages({
  'array.min': 'Необходимо передать хотя бы один профиль'
});

// Схема для обновления профиля
const updateProfileSchema = Joi.object({
  profileId: Joi.string().min(1).max(255),
  name: Joi.string().min(1).max(255),
  folderId: Joi.string().max(255).allow('', null),
  folderName: Joi.string().max(255).allow('', null),
  workspaceId: Joi.string().min(1).max(50),
  workspaceName: Joi.string().min(1).max(255),
  proxy: Joi.string(),
  userId: Joi.string().max(255).allow('', null),
  status: Joi.string().valid('created', 'active', 'inactive', 'working', 'banned')
});

// Middleware для валидации одного профиля
const validateProfile = (req, res, next) => {
  const { error } = profileSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации профиля',
      details: errors
    });
  }
  
  next();
};

// Middleware для валидации массива профилей
const validateProfiles = (req, res, next) => {
  const { error } = profilesArraySchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации профилей',
      details: errors
    });
  }
  
  next();
};

// Middleware для валидации обновления профиля
const validateProfileUpdate = (req, res, next) => {
  const { error } = updateProfileSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации обновления профиля',
      details: errors
    });
  }
  
  next();
};

module.exports = {
  validateProfile,
  validateProfiles,
  validateProfileUpdate,
  profileSchema,
  profilesArraySchema,
  updateProfileSchema
};