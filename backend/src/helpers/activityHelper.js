const { Activity } = require('../models');

const ActivityHelper = {
  // Логирование активности с проверкой данных
  log: async (entityType, entityId, actionType, description, userId = null, metadata = null) => {
    try {
      // Валидация обязательных полей
      if (!entityType || !entityId || !actionType || !description) {
        console.warn('ActivityHelper.log: Missing required fields', {
          entityType,
          entityId,
          actionType,
          description
        });
        return null;
      }

      const activity = await Activity.create({
        timestamp: new Date(),
        description: String(description),
        entityType: String(entityType),
        entityId: parseInt(entityId),
        actionType: String(actionType),
        userId: userId ? parseInt(userId) : null,
        createdAt: new Date()
      });

      return activity;
    } catch (error) {
      console.error('ActivityHelper.log error:', error);
      // Не бросаем ошибку, чтобы не прерывать основной процесс
      return null;
    }
  },

  // Предопределенные типы действий
  ACTIONS: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    ACTIVATE: 'activate',
    DEACTIVATE: 'deactivate',
    LOGIN: 'login',
    LOGOUT: 'logout',
    REGISTER: 'register',
    ASSIGN: 'assign',
    UNASSIGN: 'unassign',
    START: 'start',
    STOP: 'stop',
    COMPLETE: 'complete',
    FAIL: 'fail',
    VERIFY: 'verify',
    APPROVE: 'approve',
    REJECT: 'reject'
  },

  // Предопределенные типы сущностей
  ENTITIES: {
    ACCOUNT: 'account',
    PROFILE: 'profile',
    PROXY: 'proxy',
    PROJECT: 'project',
    PHONE: 'phone',
    REGISTRATION: 'registration',
    USER: 'user'
  },

  // Вспомогательные методы для часто используемых действий
  logAccountAction: async (accountId, action, description, userId = null) => {
    return ActivityHelper.log(
      ActivityHelper.ENTITIES.ACCOUNT,
      accountId,
      action,
      description,
      userId
    );
  },

  logProfileAction: async (profileId, action, description, userId = null) => {
    return ActivityHelper.log(
      ActivityHelper.ENTITIES.PROFILE,
      profileId,
      action,
      description,
      userId
    );
  },

  logProxyAction: async (proxyId, action, description, userId = null) => {
    return ActivityHelper.log(
      ActivityHelper.ENTITIES.PROXY,
      proxyId,
      action,
      description,
      userId
    );
  },

  logRegistrationAction: async (registrationId, action, description, userId = null) => {
    return ActivityHelper.log(
      ActivityHelper.ENTITIES.REGISTRATION,
      registrationId,
      action,
      description,
      userId
    );
  }
};

module.exports = ActivityHelper;