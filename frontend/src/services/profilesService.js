import api from './api'

export const profilesService = {
  // Получить список профилей
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '') {
        searchParams.append(key, value)
      }
    })
    
    return api.get(`/profiles?${searchParams.toString()}`)
  },

  // Получить профиль по ID
  getById: (id) => api.get(`/profiles/${id}`),

  // Создать новый профиль (или несколько)
  create: (data) => api.post('/profiles', data),

  // Обновить профиль
  update: (id, data) => api.put(`/profiles/${id}`, data),

  // Обновить несколько профилей
  updateMultiple: (data) => api.post('/profiles/update', data),

  // Удалить профиль
  delete: (id) => api.delete(`/profiles/${id}`),

  // Получить статистику профилей
  getStats: () => api.get('/profiles/stats'),

  // Массовое удаление профилей
  bulkDelete: (ids) => api.post('/profiles/bulk-delete', { ids }),

  // Массовое обновление статуса
  bulkUpdateStatus: (ids, status) => api.post('/profiles/bulk-update-status', { ids, status }),
}