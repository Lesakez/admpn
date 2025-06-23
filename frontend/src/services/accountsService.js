// frontend/src/services/accountsService.js
import api from './api'

export const accountsService = {
  // Получить список аккаунтов
  getAll: (params = {}) => {
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
    
    return api.get(`/accounts?${searchParams.toString()}`)
  },

  // Получить аккаунт по ID (без пароля)
  getById: (id) => api.get(`/accounts/${id}`),

  // Получить полные данные аккаунта (включая пароль)
  getByIdWithPassword: (id) => api.get(`/accounts/${id}/full`),

  // Создать новый аккаунт
  create: (data) => api.post('/accounts', data),

  // Обновить аккаунт
  update: (id, data) => api.put(`/accounts/${id}`, data),

  // Удалить аккаунт
  delete: (id) => api.delete(`/accounts/${id}`),

  // Получить статистику
  getStats: () => api.get('/accounts/stats'),

  // Получить доступные поля для экспорта (старый метод)
  getFields: () => api.get('/accounts/fields'),

  // Изменить статус
  changeStatus: (id, status) => api.post(`/accounts/${id}/status`, { status }),

  // Массовые операции
  bulkDelete: (ids) => api.post('/accounts/bulk-delete', { ids }),
  bulkUpdateStatus: (ids, status) => api.post('/accounts/bulk-update-status', { ids, status }),

  // НОВЫЕ МЕТОДЫ для импорта/экспорта (аналогично phonesService)

  // Получить конфигурацию импорта
  getImportConfig: () => api.get('/accounts/import/config'),

  // Получить конфигурацию экспорта  
  getExportConfig: () => api.get('/accounts/export/config'),

  // Получить доступные поля для экспорта (новый метод)
  getExportFields: () => api.get('/accounts/export/fields'),

  // Импорт/Экспорт
  importFromText: (data) => api.post('/accounts/import-text', data),
  
  // Универсальный метод экспорта
  export: (params) => api.post('/accounts/export', params),
  
  // Экспорт методы
  exportJSON: (params = {}) => {
    const searchParams = new URLSearchParams()
    
    // Обрабатываем параметры экспорта
    Object.entries(params).forEach(([key, value]) => {
      if (key === 'fields' && Array.isArray(value)) {
        searchParams.append('fields', value.join(','))
      } else if (key === 'filters' && typeof value === 'object') {
        Object.entries(value).forEach(([filterKey, filterValue]) => {
          if (filterValue !== '' && filterValue != null) {
            searchParams.append(`filters[${filterKey}]`, filterValue)
          }
        })
      } else if (value !== '' && value != null) {
        searchParams.append(key, value)
      }
    })
    
    return api.get(`/accounts/export/json?${searchParams.toString()}`)
  },

  exportCSV: (params = {}) => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (key === 'fields' && Array.isArray(value)) {
        searchParams.append('fields', value.join(','))
      } else if (key === 'filters' && typeof value === 'object') {
        Object.entries(value).forEach(([filterKey, filterValue]) => {
          if (filterValue !== '' && filterValue != null) {
            searchParams.append(`filters[${filterKey}]`, filterValue)
          }
        })
      } else if (value !== '' && value != null) {
        searchParams.append(key, value)
      }
    })
    
    return api.get(`/accounts/export/csv?${searchParams.toString()}`)
  },

  exportTXT: (params = {}) => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (key === 'fields' && Array.isArray(value)) {
        searchParams.append('fields', value.join(','))
      } else if (key === 'filters' && typeof value === 'object') {
        Object.entries(value).forEach(([filterKey, filterValue]) => {
          if (filterValue !== '' && filterValue != null) {
            searchParams.append(`filters[${filterKey}]`, filterValue)
          }
        })
      } else if (value !== '' && value != null) {
        searchParams.append(key, value)
      }
    })
    
    return api.get(`/accounts/export/txt?${searchParams.toString()}`)
  },

  // Поиск аккаунтов
  search: (searchText, options = {}) => {
    const params = new URLSearchParams()
    params.append('q', searchText)
    
    if (options.limit) {
      params.append('limit', options.limit)
    }
    
    return api.get(`/accounts/search?${params.toString()}`)
  }
}

export default accountsService