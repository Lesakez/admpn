// frontend/src/services/projectsService.js

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

  // ИСПРАВЛЕНО: Получить общую статистику всех проектов
  getStats: () => api.get(`/projects/stats`),

  // Получить статистику конкретного проекта
  getProjectStats: (id) => api.get(`/projects/${id}/stats`),

  // ДОБАВЛЕНО: Массовое удаление
  bulkDelete: (ids) => api.delete('/projects/bulk', { 
    data: { ids } 
  }),

  // ДОБАВЛЕНО: Массовое обновление
  bulkUpdate: (ids, data) => api.put('/projects/bulk', { 
    ids, 
    data 
  }),

  // ДОБАВЛЕНО: Назначение ресурсов проекту
  assignResources: (projectId, resources) => api.post(`/projects/${projectId}/assign`, resources),

  // ДОБАВЛЕНО: Отвязка ресурсов от проекта
  unassignResources: (projectId, resources) => api.post(`/projects/${projectId}/unassign`, resources),

  // ДОБАВЛЕНО: Автокомплит для поиска проектов
  autocomplete: (query) => api.get(`/projects/autocomplete?q=${encodeURIComponent(query)}`),

  // ДОБАВЛЕНО: Экспорт проектов
  export: (options = {}) => api.get('/projects/export', { params: options }),

  // ДОБАВЛЕНО: Импорт проектов
  import: (data) => api.post('/projects/import', data)
}