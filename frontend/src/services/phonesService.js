import api from './api'

export const phonesService = {
  // Получить список телефонов
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

  // Получить телефон по ID
  getById: (id) => api.get(`/phones/${id}`),

  // Создать новый телефон
  create: (data) => api.post('/phones', data),

  // Обновить телефон
  update: (id, data) => api.put(`/phones/${id}`, data),

  // Удалить телефон
  delete: (id) => api.delete(`/phones/${id}`),

  // Получить статистику
  getStats: () => api.get('/phones/stats'),

  // Переключить статус
  toggleStatus: (id) => api.post(`/phones/${id}/toggle-status`),

  // Перезагрузить телефон
  reboot: (id) => api.post(`/phones/${id}/reboot`),

  // Массовые операции
  bulkDelete: (ids) => api.post('/phones/bulk-delete', { ids }),
  bulkUpdateStatus: (ids, status) => api.post('/phones/bulk-update-status', { ids, status }),
}