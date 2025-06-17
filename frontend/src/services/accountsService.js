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

  // Получить аккаунт по ID
  getById: (id) => api.get(`/accounts/${id}`),

  // Создать новый аккаунт
  create: (data) => api.post('/accounts', data),

  // Обновить аккаунт
  update: (id, data) => api.put(`/accounts/${id}`, data),

  // Удалить аккаунт
  delete: (id) => api.delete(`/accounts/${id}`),

  // Получить статистику
  getStats: () => api.get('/accounts/stats'),

  // Изменить статус
  changeStatus: (id, status) => api.post(`/accounts/${id}/status`, { status }),

  // Массовые операции
  bulkDelete: (ids) => api.post('/accounts/bulk-delete', { ids }),
  bulkUpdateStatus: (ids, status) => api.post('/accounts/bulk-update-status', { ids, status }),

  // Импорт/Экспорт
  importFromText: (data) => api.post('/accounts/import-text', data),
  exportJSON: (filters = {}) => api.get('/accounts/export-json', { params: filters }),
  exportCSV: (filters = {}) => api.get('/accounts/export-csv', { params: filters, responseType: 'blob' }),
  exportTXT: (filters = {}) => api.get('/accounts/export-txt', { params: filters, responseType: 'blob' }),
}