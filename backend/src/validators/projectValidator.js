const Joi = require('joi');

// Схема для создания проекта
const createProjectSchema = Joi.object({
  name: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Название проекта не может быть пустым',
    'string.max': 'Название проекта не может быть длиннее 255 символов',
    'any.required': 'Название проекта обязательно'
  }),
  description: Joi.string().max(1000).allow('', null).messages({
    'string.max': 'Описание не может быть длиннее 1000 символов'
  }),
  transliterateName: Joi.string().max(255).allow('', null).messages({
    'string.max': 'Транслитерированное название не может быть длиннее 255 символов'
  })
});

// Схема для обновления проекта
const updateProjectSchema = Joi.object({
  name: Joi.string().min(1).max(255).messages({
    'string.empty': 'Название проекта не может быть пустым',
    'string.max': 'Название проекта не может быть длиннее 255 символов'
  }),
  description: Joi.string().max(1000).allow('', null).messages({
    'string.max': 'Описание не может быть длиннее 1000 символов'
  }),
  transliterateName: Joi.string().max(255).allow('', null).messages({
    'string.max': 'Транслитерированное название не может быть длиннее 255 символов'
  })
});

// Middleware для валидации создания проекта
const validateProject = (req, res, next) => {
  const { error } = createProjectSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации проекта',
      details: errors
    });
  }
  
  next();
};

// Middleware для валидации обновления проекта
const validateProjectUpdate = (req, res, next) => {
  const { error } = updateProjectSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидации обновления проекта',
      details: errors
    });
  }
  
  next();
};

module.exports = {
  validateProject,
  validateProjectUpdate,
  createProjectSchema,
  updateProjectSchema
};