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
      console.warn('Failed to load status config from server, using fallback')
      // Fallback к локальной конфигурации если сервер недоступен
      return getLocalStatusConfig()
    }
  },

  // Получить статусы для конкретной сущности
  getEntityStatuses: async (entityType) => {
    try {
      // Используем специальный эндпоинт для получения статусов сущности
      const response = await api.get(`/config/statuses/${entityType}`)
      return response.data.data.statuses || {}
    } catch (error) {
      console.warn(`Failed to load statuses for ${entityType}, using fallback`)
      // Fallback к полной конфигурации
      const config = await statusService.getStatusConfig()
      return config.statuses[entityType.toUpperCase()] || {}
    }
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
    }
  },
  descriptions: {
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
    'active': '#10b981',
    'inactive': '#6b7280',
    'banned': '#ef4444',
    'working': '#f59e0b',
    'free': '#10b981',
    'busy': '#f59e0b',
    'pending': '#3b82f6',
    'suspended': '#f97316',
    'verified': '#059669',
    'unverified': '#6b7280',
    'created': '#8b5cf6',
    'warming': '#f59e0b',
    'ready': '#10b981',
    'error': '#ef4444',
    'checking': '#3b82f6',
    'maintenance': '#f97316',
    'offline': '#6b7280',
    'rebooting': '#8b5cf6',
    'success': '#10b981',
    'failed': '#ef4444',
    'cancelled': '#6b7280',
    'timeout': '#f97316'
  },
  groups: {},
  transitions: {}
})