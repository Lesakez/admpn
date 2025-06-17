// Конфигурация статусов для всех сущностей
const STATUSES = {
  // Статусы аккаунтов
  ACCOUNT: {
    ACTIVE: 'active',
    INACTIVE: 'inactive', 
    BANNED: 'banned',
    WORKING: 'working',
    FREE: 'free',
    BUSY: 'busy',
    PENDING: 'pending',
    SUSPENDED: 'suspended',
    VERIFIED: 'verified',
    UNVERIFIED: 'unverified'
  },

  // Статусы профилей
  PROFILE: {
    CREATED: 'created',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    WORKING: 'working',
    BANNED: 'banned',
    WARMING: 'warming',
    READY: 'ready',
    ERROR: 'error'
  },

  // Статусы прокси
  PROXY: {
    FREE: 'free',
    BUSY: 'busy',
    INACTIVE: 'inactive',
    BANNED: 'banned',
    CHECKING: 'checking',
    ERROR: 'error',
    MAINTENANCE: 'maintenance'
  },

  // Статусы телефонов
  PHONE: {
    FREE: 'free',
    BUSY: 'busy',
    INACTIVE: 'inactive',
    MAINTENANCE: 'maintenance',
    OFFLINE: 'offline',
    REBOOTING: 'rebooting',
    ERROR: 'error'
  },

  // Статусы регистраций
  REGISTRATION: {
    SUCCESS: 'success',
    FAILED: 'failed',
    PENDING: 'pending',
    CANCELLED: 'cancelled',
    TIMEOUT: 'timeout',
    ERROR: 'error'
  }
};

// Описания статусов для UI
const STATUS_DESCRIPTIONS = {
  // Аккаунты
  'active': 'Активный аккаунт',
  'inactive': 'Неактивный аккаунт',
  'banned': 'Заблокированный аккаунт',
  'working': 'Аккаунт в работе',
  'free': 'Свободный аккаунт',
  'busy': 'Занятый аккаунт',
  'pending': 'Ожидает обработки',
  'suspended': 'Приостановлен',
  'verified': 'Верифицированный',
  'unverified': 'Неверифицированный',

  // Профили
  'created': 'Создан',
  'warming': 'Прогрев профиля',
  'ready': 'Готов к работе',
  'error': 'Ошибка',

  // Прокси и телефоны
  'checking': 'Проверяется',
  'maintenance': 'Техническое обслуживание',
  'offline': 'Офлайн',
  'rebooting': 'Перезагрузка',

  // Регистрации
  'success': 'Успешно',
  'failed': 'Неудачно',
  'cancelled': 'Отменено',
  'timeout': 'Таймаут'
};

// Цвета статусов для UI
const STATUS_COLORS = {
  'active': '#10b981',      // green
  'inactive': '#6b7280',    // gray
  'banned': '#ef4444',      // red
  'working': '#f59e0b',     // amber
  'free': '#10b981',        // green
  'busy': '#f59e0b',        // amber
  'pending': '#3b82f6',     // blue
  'suspended': '#f97316',   // orange
  'verified': '#059669',    // emerald
  'unverified': '#6b7280',  // gray
  'created': '#8b5cf6',     // violet
  'warming': '#f59e0b',     // amber
  'ready': '#10b981',       // green
  'error': '#ef4444',       // red
  'checking': '#3b82f6',    // blue
  'maintenance': '#f97316', // orange
  'offline': '#6b7280',     // gray
  'rebooting': '#8b5cf6',   // violet
  'success': '#10b981',     // green
  'failed': '#ef4444',      // red
  'cancelled': '#6b7280',   // gray
  'timeout': '#f97316'      // orange
};

// Функции для работы со статусами
const getStatusesForEntity = (entityType) => {
  const entity = entityType.toUpperCase();
  return Object.values(STATUSES[entity] || {});
};

const getStatusDescription = (status) => {
  return STATUS_DESCRIPTIONS[status] || status;
};

const getStatusColor = (status) => {
  return STATUS_COLORS[status] || '#6b7280';
};

const isValidStatus = (status, entityType) => {
  const validStatuses = getStatusesForEntity(entityType);
  return validStatuses.includes(status);
};

// Группы статусов для фильтрации
const STATUS_GROUPS = {
  ACCOUNT: {
    AVAILABLE: ['active', 'free', 'verified'],
    UNAVAILABLE: ['inactive', 'banned', 'busy', 'working'],
    NEED_ATTENTION: ['pending', 'suspended', 'unverified', 'error']
  },
  PROFILE: {
    READY_TO_USE: ['active', 'ready'],
    IN_PROGRESS: ['created', 'warming', 'working'],
    ISSUES: ['inactive', 'banned', 'error']
  },
  PROXY: {
    AVAILABLE: ['free'],
    UNAVAILABLE: ['busy', 'inactive', 'banned'],
    ISSUES: ['error', 'checking', 'maintenance']
  },
  PHONE: {
    AVAILABLE: ['free'],
    UNAVAILABLE: ['busy', 'inactive', 'offline'],
    ISSUES: ['error', 'maintenance', 'rebooting']
  }
};

const getStatusGroup = (status, entityType) => {
  const entity = entityType.toUpperCase();
  const groups = STATUS_GROUPS[entity];
  
  if (!groups) return null;
  
  for (const [groupName, statuses] of Object.entries(groups)) {
    if (statuses.includes(status)) {
      return groupName.toLowerCase();
    }
  }
  
  return null;
};

// Переходы между статусами (для валидации изменений)
const ALLOWED_TRANSITIONS = {
  ACCOUNT: {
    'active': ['inactive', 'banned', 'working', 'busy'],
    'inactive': ['active', 'banned'],
    'banned': ['inactive'],
    'working': ['active', 'inactive', 'free'],
    'free': ['busy', 'working', 'inactive'],
    'busy': ['free', 'working'],
    'pending': ['active', 'inactive', 'banned'],
    'suspended': ['active', 'inactive', 'banned'],
    'verified': ['active', 'inactive', 'banned'],
    'unverified': ['verified', 'banned']
  },
  PROFILE: {
    'created': ['active', 'warming', 'inactive', 'error'],
    'warming': ['ready', 'active', 'error'],
    'ready': ['active', 'working', 'inactive'],
    'active': ['working', 'inactive', 'banned'],
    'working': ['active', 'inactive', 'error'],
    'inactive': ['active', 'warming'],
    'banned': ['inactive'],
    'error': ['inactive', 'created']
  },
  PROXY: {
    'free': ['busy', 'inactive', 'checking', 'maintenance'],
    'busy': ['free', 'inactive', 'error'],
    'inactive': ['free', 'checking'],
    'checking': ['free', 'inactive', 'error'],
    'maintenance': ['free', 'inactive'],
    'error': ['inactive', 'checking'],
    'banned': ['inactive']
  },
  PHONE: {
    'free': ['busy', 'inactive', 'maintenance', 'rebooting'],
    'busy': ['free', 'inactive', 'error'],
    'inactive': ['free', 'maintenance'],
    'maintenance': ['free', 'inactive'],
    'offline': ['inactive', 'rebooting'],
    'rebooting': ['free', 'inactive', 'error'],
    'error': ['inactive', 'rebooting']
  }
};

const isTransitionAllowed = (fromStatus, toStatus, entityType) => {
  const entity = entityType.toUpperCase();
  const transitions = ALLOWED_TRANSITIONS[entity];
  
  if (!transitions || !transitions[fromStatus]) {
    return true; // Если переходы не определены, разрешаем
  }
  
  return transitions[fromStatus].includes(toStatus);
};

module.exports = {
  STATUSES,
  STATUS_DESCRIPTIONS,
  STATUS_COLORS,
  STATUS_GROUPS,
  getStatusesForEntity,
  getStatusDescription,
  getStatusColor,
  isValidStatus,
  getStatusGroup,
  isTransitionAllowed,
  ALLOWED_TRANSITIONS
};