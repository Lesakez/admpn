// frontend/src/services/statusService.js
import api from './api'

// Кэш для статусов
let statusCache = null

export const statusService = {
  // Получить конфигурацию статусов с сервера
  getStatusConfig: async () => {
    if (statusCache) {
      return statusCache
    }
    
    try {
      const response = await api.get('/config/statuses')
      statusCache = response.data.data
      return statusCache
    } catch (error) {
      // Fallback к локальной конфигурации если сервер недоступен
      return getLocalStatusConfig()
    }
  },

  // Получить статусы для конкретной сущности
  getEntityStatuses: async (entityType) => {
    const config = await statusService.getStatusConfig()
    return config.statuses[entityType.toUpperCase()] || {}
  },

  // Получить описание статуса
  getStatusDescription: async (status) => {
    const config = await statusService.getStatusConfig()
    return config.descriptions[status] || status
  },

  // Получить цвет статуса
  getStatusColor: async (status) => {
    const config = await statusService.getStatusConfig()
    return config.colors[status] || '#6b7280'
  },

  // Получить группу статуса
  getStatusGroup: async (status, entityType) => {
    const config = await statusService.getStatusConfig()
    const groups = config.groups[entityType.toUpperCase()]
    
    if (!groups) return null
    
    for (const [groupName, statuses] of Object.entries(groups)) {
      if (statuses.includes(status)) {
        return groupName.toLowerCase()
      }
    }
    
    return null
  },

  // Проверить валидность перехода статуса
  isTransitionAllowed: async (fromStatus, toStatus, entityType) => {
    const config = await statusService.getStatusConfig()
    const transitions = config.transitions[entityType.toUpperCase()]
    
    if (!transitions || !transitions[fromStatus]) {
      return true // Если переходы не определены, разрешаем
    }
    
    return transitions[fromStatus].includes(toStatus)
  },

  // Очистить кэш (для обновления конфигурации)
  clearCache: () => {
    statusCache = null
  }
}

// Локальная конфигурация как fallback
const getLocalStatusConfig = () => ({
  statuses: {
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
    PROXY: {
      FREE: 'free',
      BUSY: 'busy',
      INACTIVE: 'inactive',
      BANNED: 'banned',
      CHECKING: 'checking',
      ERROR: 'error',
      MAINTENANCE: 'maintenance'
    },
    PHONE: {
      FREE: 'free',
      BUSY: 'busy',
      INACTIVE: 'inactive',
      MAINTENANCE: 'maintenance',
      OFFLINE: 'offline',
      REBOOTING: 'rebooting',
      ERROR: 'error'
    },
    REGISTRATION: {
      SUCCESS: 'success',
      FAILED: 'failed',
      PENDING: 'pending',
      CANCELLED: 'cancelled',
      TIMEOUT: 'timeout',
      ERROR: 'error'
    }
  },
  descriptions: {
    'active': 'Активный',
    'inactive': 'Неактивный',
    'banned': 'Заблокированный',
    'working': 'В работе',
    'free': 'Свободный',
    'busy': 'Занятый',
    'pending': 'Ожидает обработки',
    'suspended': 'Приостановлен',
    'verified': 'Верифицированный',
    'unverified': 'Неверифицированный',
    'created': 'Создан',
    'warming': 'Прогрев',
    'ready': 'Готов',
    'error': 'Ошибка',
    'checking': 'Проверяется',
    'maintenance': 'Обслуживание',
    'offline': 'Офлайн',
    'rebooting': 'Перезагрузка',
    'success': 'Успешно',
    'failed': 'Неудачно',
    'cancelled': 'Отменено',
    'timeout': 'Таймаут'
  },
  colors: {
    'active': 'success',
    'inactive': 'secondary',
    'banned': 'danger',
    'working': 'warning',
    'free': 'success',
    'busy': 'warning',
    'pending': 'info',
    'suspended': 'warning',
    'verified': 'success',
    'unverified': 'secondary',
    'created': 'info',
    'warming': 'warning',
    'ready': 'success',
    'error': 'danger',
    'checking': 'info',
    'maintenance': 'warning',
    'offline': 'secondary',
    'rebooting': 'info',
    'success': 'success',
    'failed': 'danger',
    'cancelled': 'secondary',
    'timeout': 'warning'
  },
  groups: {
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
  },
  transitions: {
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
    }
  }
})