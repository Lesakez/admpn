import api from './api'

export const profilesService = {
  // Получить список профилей
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
    
    return api.get(`/profiles?${searchParams.toString()}`)
  },

  // Получить профиль по ID
  getById: (id) => api.get(`/profiles/${id}`),

  // Создать новые профили (пакетно)
  create: (data) => api.post('/profiles', data),

  // Обновить профиль
  update: (id, data) => api.put(`/profiles/${id}`, data),

  // Обновить профили пакетно
  updateBulk: (data) => api.post('/profiles/update', data),

  // Удалить профиль
  delete: (id) => api.delete(`/profiles/${id}`),

  // Получить папки
  getFolders: () => api.get('/profiles/folders'),

  // Создать папку
  createFolder: (name) => api.post('/profiles/folders', { name }),

  // Массовые операции
  bulkDelete: (ids) => api.post('/profiles/bulk-delete', { ids }),
  bulkUpdateStatus: (ids, status) => api.post('/profiles/bulk-update-status', { ids, status }),
}