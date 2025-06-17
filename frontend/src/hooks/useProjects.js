import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsService } from '../services/projectsService'
import toast from 'react-hot-toast'

// Получить список проектов
export function useProjects(filters = {}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const response = await projectsService.getAll(filters)
      return response.data.data
    },
    keepPreviousData: true,
  })
}

// Получить проект по ID
export function useProject(id) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const response = await projectsService.getById(id)
      return response.data.data
    },
    enabled: !!id,
  })
}

// Получить статистику проекта
export function useProjectStats(id) {
  return useQuery({
    queryKey: ['projects', id, 'stats'],
    queryFn: async () => {
      const response = await projectsService.getStats(id)
      return response.data.data
    },
    enabled: !!id,
  })
}

// Создать проект
export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (projectData) => {
      const response = await projectsService.create(projectData)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects'])
      toast.success('Проект создан успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка создания проекта')
    }
  })
}

// Обновить проект
export function useUpdateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await projectsService.update(id, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects'])
      toast.success('Проект обновлен успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка обновления проекта')
    }
  })
}

// Удалить проект
export function useDeleteProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await projectsService.delete(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects'])
      toast.success('Проект удален успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка удаления проекта')
    }
  })
}