// Конфигурация статусов для всех сущностей (синхронизовано с backend)
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
}

// Описания статусов для UI
const STATUS_DESCRIPTIONS = {
  // Аккаунты
  'active': 'Активный',
  'inactive': 'Неактивный',
  'banned': 'Заблокированный',
  'working': 'В работе',
  'free': 'Свободный',
  'busy': 'Занятый',
  'pending': 'Ожидает',
  'suspended': 'Приостановлен',
  'verified': 'Верифицированный',
  'unverified': 'Неверифицированный',

  // Профили
  'created': 'Создан',
  'warming': 'Прогрев',
  'ready': 'Готов',
  'error': 'Ошибка',

  // Прокси и телефоны
  'checking': 'Проверяется',
  'maintenance': 'Обслуживание',
  'offline': 'Офлайн',
  'rebooting': 'Перезагрузка',

  // Регистрации
  'success': 'Успешно',
  'failed': 'Неудачно',
  'cancelled': 'Отменено',
  'timeout': 'Таймаут'
}

// Цвета статусов для UI
const STATUS_COLORS = {
  'active': 'badge-success',
  'inactive': 'badge-gray',
  'banned': 'badge-danger',
  'working': 'badge-warning',
  'free': 'badge-success',
  'busy': 'badge-warning',
  'pending': 'badge-info',
  'suspended': 'badge-warning',
  'verified': 'badge-success',
  'unverified': 'badge-gray',
  'created': 'badge-info',
  'warming': 'badge-warning',
  'ready': 'badge-success',
  'error': 'badge-danger',
  'checking': 'badge-info',
  'maintenance': 'badge-warning',
  'offline': 'badge-gray',
  'rebooting': 'badge-info',
  'success': 'badge-success',
  'failed': 'badge-danger',
  'cancelled': 'badge-gray',
  'timeout': 'badge-warning'
}

// Функции для работы со статусами
export const getStatusesForEntity = (entityType) => {
  const entity = entityType.toUpperCase()
  return Object.values(STATUSES[entity] || {})
}

export const getStatusDescription = (status) => {
  return STATUS_DESCRIPTIONS[status] || status
}

export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || 'badge-gray'
}

export const isValidStatus = (status, entityType) => {
  const validStatuses = getStatusesForEntity(entityType)
  return validStatuses.includes(status)
}

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
}

export const getStatusGroup = (status, entityType) => {
  const entity = entityType.toUpperCase()
  const groups = STATUS_GROUPS[entity]
  
  if (!groups) return null
  
  for (const [groupName, statuses] of Object.entries(groups)) {
    if (statuses.includes(status)) {
      return groupName.toLowerCase()
    }
  }
  
  return null
}