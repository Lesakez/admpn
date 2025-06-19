import api from './api'

export const activityService = {
  // Получить последнюю активность
  getRecent: (params = {}) => {
    const searchParams = new URLSearchParams()
    
    // Значения по умолчанию
    const defaultParams = {
      limit: 50,
      offset: 0,
      ...params
    }
    
    Object.entries(defaultParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v))
        } else {
          searchParams.append(key, value)
        }
      }
    })
    
    return api.get(`/activity?${searchParams.toString()}`)
      .then(response => {
        console.log('Activity API response:', response.data)
        return response
      })
      .catch(error => {
        console.error('Activity API error:', error)
        // Возвращаем пустой результат в случае ошибки
        return {
          data: {
            success: true,
            data: [],
            count: 0
          }
        }
      })
  },

  // Получить активность по сущности
  getByEntity: (entityType, entityId, params = {}) => {
    const searchParams = new URLSearchParams()
    
    const defaultParams = {
      limit: 50,
      offset: 0,
      ...params
    }
    
    Object.entries(defaultParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value)
      }
    })
    
    return api.get(`/activity/${entityType}/${entityId}?${searchParams.toString()}`)
      .catch(error => {
        console.error('Activity by entity API error:', error)
        return {
          data: {
            success: true,
            data: [],
            count: 0,
            entityType,
            entityId
          }
        }
      })
  },

  // Получить статистику активности
  getStats: (params = {}) => {
    const searchParams = new URLSearchParams()
    
    const defaultParams = {
      period: '7d',
      ...params
    }
    
    Object.entries(defaultParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value)
      }
    })
    
    return api.get(`/activity/stats?${searchParams.toString()}`)
      .catch(error => {
        console.error('Activity stats API error:', error)
        return {
          data: {
            success: true,
            data: {
              period: params.period || '7d',
              totalCount: 0,
              actionStats: [],
              entityStats: [],
              dailyStats: []
            }
          }
        }
      })
  },

  // Создать новую запись активности (для тестирования)
  create: (activityData) => {
    return api.post('/activity', activityData)
      .catch(error => {
        console.error('Create activity API error:', error)
        throw error
      })
  },

  // Форматирование данных активности
  formatActivity: (activity) => {
    return {
      ...activity,
      timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
      entityType: activity.entityType || activity.entity_type || 'unknown',
      entityId: activity.entityId || activity.entity_id || null,
      actionType: activity.actionType || activity.action_type || 'unknown',
      userId: activity.userId || activity.user_id || null
    }
  },

  // Предопределенные типы для UI
  ENTITY_TYPES: {
    account: 'Аккаунт',
    profile: 'Профиль',
    proxy: 'Прокси',
    project: 'Проект',
    phone: 'Телефон',
    registration: 'Регистрация',
    user: 'Пользователь',
    system: 'Система'
  },

  ACTION_TYPES: {
    create: 'Создание',
    update: 'Обновление',
    delete: 'Удаление',
    activate: 'Активация',
    deactivate: 'Деактивация',
    login: 'Вход',
    logout: 'Выход',
    register: 'Регистрация',
    assign: 'Назначение',
    unassign: 'Отмена назначения',
    start: 'Запуск',
    stop: 'Остановка',
    complete: 'Завершение',
    fail: 'Ошибка',
    verify: 'Верификация',
    approve: 'Одобрение',
    reject: 'Отклонение'
  },

  // Цвета для разных типов действий
  ACTION_COLORS: {
    create: 'success',
    update: 'info',
    delete: 'danger',
    activate: 'success',
    deactivate: 'warning',
    login: 'primary',
    logout: 'secondary',
    register: 'info',
    assign: 'success',
    unassign: 'warning',
    start: 'primary',
    stop: 'danger',
    complete: 'success',
    fail: 'danger',
    verify: 'info',
    approve: 'success',
    reject: 'danger'
  },

  // Цвета для разных типов сущностей
  ENTITY_COLORS: {
    account: 'primary',
    profile: 'info',
    proxy: 'secondary',
    project: 'success',
    phone: 'warning',
    registration: 'info',
    user: 'primary',
    system: 'dark'
  }
}