// frontend/src/services/phonesService.js

import api from './api'

export const phonesService = {
  // Существующие методы
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
    
    return api.get(`/phones?${searchParams.toString()}`)
  },

  getById: (id) => api.get(`/phones/${id}`),
  
  create: (data) => api.post('/phones', data),
  
  update: (id, data) => api.put(`/phones/${id}`, data),
  
  delete: (id) => api.delete(`/phones/${id}`),
  
  getStats: () => api.get('/phones/stats'),
  
  toggleStatus: (id) => api.post(`/phones/${id}/toggle-status`),
  
  reboot: (id) => api.post(`/phones/${id}/reboot`),
  
  bulkDelete: (ids) => api.post('/phones/bulk-delete', { ids }),
  
  bulkUpdateStatus: (ids, status) => api.post('/phones/bulk-update-status', { ids, status }),

  // НОВЫЕ МЕТОДЫ для импорта/экспорта

  // Получить конфигурацию импорта
  getImportConfig: () => api.get('/phones/import/config'),

  // Получить конфигурацию экспорта  
  getExportConfig: () => api.get('/phones/export/config'),

  // Получить доступные поля для экспорта
  getExportFields: () => api.get('/phones/export/fields'),

  // Импорт устройств из текста
  importFromText: (data) => api.post('/phones/import/text', data),

  // Универсальный метод экспорта
  export: (params) => api.post('/phones/export', params),

  // Экспорт в CSV
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
    
    return api.get(`/phones/export/csv?${searchParams.toString()}`)
  },

  // Экспорт в JSON
  exportJSON: (params = {}) => {
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
    
    return api.get(`/phones/export/json?${searchParams.toString()}`)
  },

  // Экспорт в TXT
  exportTXT: (params = {}) => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (key === 'fields' && Array.isArray(value)) {
        searchParams.append('fields', value.join(','))
      } else if (value !== '' && value != null) {
        searchParams.append(key, value)
      }
    })
    
    return api.get(`/phones/export/txt?${searchParams.toString()}`)
  }
}

export default phonesService