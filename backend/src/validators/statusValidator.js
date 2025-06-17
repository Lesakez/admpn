const Joi = require('joi');
const { getStatusesForEntity, isValidStatus, isTransitionAllowed } = require('../config/statuses');

// Функция для создания динамической схемы статуса
const createStatusSchema = (entityType) => {
  const validStatuses = getStatusesForEntity(entityType);
  
  return Joi.string().valid(...validStatuses).messages({
    'any.only': `Статус должен быть одним из: ${validStatuses.join(', ')}`
  });
};

// Middleware для валидации статуса
const validateStatus = (entityType) => {
  return (req, res, next) => {
    const { status } = req.body;
    
    if (!status) {
      return next(); // Если статус не передан, пропускаем валидацию
    }
    
    if (!isValidStatus(status, entityType)) {
      const validStatuses = getStatusesForEntity(entityType);
      return res.status(400).json({
        success: false,
        error: 'Недопустимый статус',
        details: [`Статус должен быть одним из: ${validStatuses.join(', ')}`]
      });
    }
    
    next();
  };
};

// Middleware для валидации перехода статуса
const validateStatusTransition = (entityType) => {
  return async (req, res, next) => {
    const { status: newStatus } = req.body;
    const entityId = req.params.id;
    
    if (!newStatus || !entityId) {
      return next();
    }
    
    try {
      // Получаем текущий статус из базы данных
      // Это нужно будет адаптировать под конкретную модель
      const { [entityType]: Model } = require('../models');
      const entity = await Model.findByPk(entityId);
      
      if (!entity) {
        return res.status(404).json({
          success: false,
          error: 'Сущность не найдена'
        });
      }
      
      const currentStatus = entity.status;
      
      if (!isTransitionAllowed(currentStatus, newStatus, entityType)) {
        return res.status(400).json({
          success: false,
          error: 'Недопустимый переход статуса',
          details: [`Нельзя изменить статус с "${currentStatus}" на "${newStatus}"`]
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Схемы для разных типов сущностей
const accountStatusSchema = createStatusSchema('account');
const profileStatusSchema = createStatusSchema('profile');
const proxyStatusSchema = createStatusSchema('proxy');
const phoneStatusSchema = createStatusSchema('phone');
const registrationStatusSchema = createStatusSchema('registration');

module.exports = {
  createStatusSchema,
  validateStatus,
  validateStatusTransition,
  accountStatusSchema,
  profileStatusSchema,
  proxyStatusSchema,
  phoneStatusSchema,
  registrationStatusSchema
};