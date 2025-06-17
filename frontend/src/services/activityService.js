import api from './api'

export const activityService = {
  // Получить последнюю активность
  getRecent: (params = {}) => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v))
        } else {
          searchParams.append(key, value)
        }
      }
    })
    
    return api.get(`/activity?${searchParams.toString()}`)
  },

  // Получить активность по сущности
  getByEntity: (entityType, entityId, params = {}) => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '') {
        searchParams.append(key, value)
      }
    })
    
    return api.get(`/activity/${entityType}/${entityId}?${searchParams.toString()}`)
  },

  // Получить статистику активности
  getStats: (params = {}) => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '') {
        searchParams.append(key, value)
      }
    })
    
    return api.get(`/activity/stats?${searchParams.toString()}`)
  },
}