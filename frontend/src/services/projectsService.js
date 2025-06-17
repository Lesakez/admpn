import api from './api'

export const projectsService = {
  // Получить список проектов
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '') {
        searchParams.append(key, value)
      }
    })
    
    return api.get(`/projects?${searchParams.toString()}`)
  },

  // Получить проект по ID
  getById: (id) => api.get(`/projects/${id}`),

  // Создать новый проект
  create: (data) => api.post('/projects', data),

  // Обновить проект
  update: (id, data) => api.put(`/projects/${id}`, data),

  // Удалить проект
  delete: (id) => api.delete(`/projects/${id}`),

  // Получить статистику проекта
  getStats: (id) => api.get(`/projects/${id}/stats`),
}