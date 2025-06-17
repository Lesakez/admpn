const { 
  STATUSES, 
  STATUS_DESCRIPTIONS, 
  STATUS_COLORS, 
  STATUS_GROUPS,
  ALLOWED_TRANSITIONS,
  getStatusesForEntity,
  getStatusDescription,
  getStatusColor,
  isValidStatus,
  getStatusGroup,
  isTransitionAllowed
} = require('../config/statuses');
const logger = require('../utils/logger');

// Получить полную конфигурацию статусов
const getStatusConfig = async (req, res, next) => {
  try {
    const config = {
      statuses: STATUSES,
      descriptions: STATUS_DESCRIPTIONS,
      colors: STATUS_COLORS,
      groups: STATUS_GROUPS,
      transitions: ALLOWED_TRANSITIONS,
      meta: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        entities: Object.keys(STATUSES)
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    next(error);
  }
};

// Получить статусы для конкретной сущности
const getEntityStatuses = async (req, res, next) => {
  try {
    const { entityType } = req.params;
    
    if (!entityType) {
      return res.status(400).json({
        success: false,
        error: 'Тип сущности обязателен'
      });
    }

    const statuses = getStatusesForEntity(entityType);
    
    if (statuses.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Статусы для сущности "${entityType}" не найдены`
      });
    }

    const entityStatuses = statuses.reduce((acc, status) => {
      acc[status.toUpperCase()] = status;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        entityType: entityType.toUpperCase(),
        statuses: entityStatuses,
        descriptions: statuses.reduce((acc, status) => {
          acc[status] = getStatusDescription(status);
          return acc;
        }, {}),
        colors: statuses.reduce((acc, status) => {
          acc[status] = getStatusColor(status);
          return acc;
        }, {}),
        groups: STATUS_GROUPS[entityType.toUpperCase()] || {},
        transitions: ALLOWED_TRANSITIONS[entityType.toUpperCase()] || {}
      }
    });
  } catch (error) {
    next(error);
  }
};

// Валидировать статус
const validateStatus = async (req, res, next) => {
  try {
    const { status, entityType } = req.body;

    if (!status || !entityType) {
      return res.status(400).json({
        success: false,
        error: 'Статус и тип сущности обязательны'
      });
    }

    const isValid = isValidStatus(status, entityType);
    
    res.json({
      success: true,
      data: {
        status,
        entityType,
        isValid,
        description: isValid ? getStatusDescription(status) : null,
        color: isValid ? getStatusColor(status) : null,
        group: isValid ? getStatusGroup(status, entityType) : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Проверить возможность перехода статуса
const validateStatusTransition = async (req, res, next) => {
  try {
    const { fromStatus, toStatus, entityType } = req.body;

    if (!fromStatus || !toStatus || !entityType) {
      return res.status(400).json({
        success: false,
        error: 'Все параметры обязательны: fromStatus, toStatus, entityType'
      });
    }

    const isAllowed = isTransitionAllowed(fromStatus, toStatus, entityType);
    
    res.json({
      success: true,
      data: {
        fromStatus,
        toStatus,
        entityType,
        isAllowed,
        fromDescription: getStatusDescription(fromStatus),
        toDescription: getStatusDescription(toStatus),
        availableTransitions: ALLOWED_TRANSITIONS[entityType.toUpperCase()]?.[fromStatus] || []
      }
    });
  } catch (error) {
    next(error);
  }
};

// Получить доступные переходы для статуса
const getAvailableTransitions = async (req, res, next) => {
  try {
    const { status, entityType } = req.params;

    if (!status || !entityType) {
      return res.status(400).json({
        success: false,
        error: 'Статус и тип сущности обязательны'
      });
    }

    const transitions = ALLOWED_TRANSITIONS[entityType.toUpperCase()]?.[status] || [];
    
    const transitionsWithDetails = transitions.map(targetStatus => ({
      status: targetStatus,
      description: getStatusDescription(targetStatus),
      color: getStatusColor(targetStatus),
      group: getStatusGroup(targetStatus, entityType)
    }));

    res.json({
      success: true,
      data: {
        currentStatus: status,
        entityType,
        availableTransitions: transitionsWithDetails,
        count: transitions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Получить статистику по статусам
const getStatusStats = async (req, res, next) => {
  try {
    const stats = {
      totalEntities: Object.keys(STATUSES).length,
      totalStatuses: Object.values(STATUS_DESCRIPTIONS).length,
      entitiesBreakdown: {}
    };

    // Подсчитываем статусы для каждой сущности
    Object.entries(STATUSES).forEach(([entityType, statuses]) => {
      stats.entitiesBreakdown[entityType] = {
        statusCount: Object.keys(statuses).length,
        statuses: Object.values(statuses),
        hasGroups: !!STATUS_GROUPS[entityType],
        hasTransitions: !!ALLOWED_TRANSITIONS[entityType]
      };
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatusConfig,
  getEntityStatuses,
  validateStatus,
  validateStatusTransition,
  getAvailableTransitions,
  getStatusStats
};