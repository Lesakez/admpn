// frontend/src/services/proxiesService.js
import api from './api'

export const proxiesService = {
  // Получить список прокси
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
    
    return api.get(`/proxies?${searchParams.toString()}`)
  },

  // Получить прокси по ID
  getById: (id) => api.get(`/proxies/${id}`),

  // Создать новый прокси
  create: (data) => api.post('/proxies', data),

  // Обновить прокси
  update: (id, data) => api.put(`/proxies/${id}`, data),

  // Удалить прокси
  delete: (id) => api.delete(`/proxies/${id}`),

  // Получить статистику
  getStats: () => api.get('/proxies/stats'),

  // ИСПРАВЛЕНО: Переключить статус (правильный эндпоинт)
  toggleStatus: (id) => api.post(`/proxies/${id}/toggle-status`),

  // ИСПРАВЛЕНО: Сменить IP (используем новый эндпоинт)
  changeIP: (id) => api.post(`/proxies/${id}/change-ip`),

  // Массовые операции
  bulkDelete: (ids) => api.post('/proxies/bulk-delete', { ids }),
  bulkUpdateStatus: (ids, status) => api.post('/proxies/bulk-update-status', { ids, status }),

  // Импорт/Экспорт
  import: (data) => api.post('/proxies/import', data),
  exportJSON: (filters = {}) => api.get('/proxies/export/json', { params: filters }),
  exportCSV: (filters = {}) => api.get('/proxies/export/csv', { params: filters, responseType: 'blob' }),
  exportTXT: (filters = {}) => api.get('/proxies/export/txt', { params: filters, responseType: 'blob' }),
}