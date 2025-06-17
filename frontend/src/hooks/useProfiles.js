import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profilesService } from '../services/profilesService'
import toast from 'react-hot-toast'

// Получить список профилей
export function useProfiles(filters = {}) {
  return useQuery({
    queryKey: ['profiles', filters],
    queryFn: async () => {
      const response = await profilesService.getAll(filters)
      return response.data.data
    },
    keepPreviousData: true,
  })
}

// Получить папки
export function useFolders() {
  return useQuery({
    queryKey: ['profiles', 'folders'],
    queryFn: async () => {
      const response = await profilesService.getFolders()
      return response.data.data
    },
  })
}

// Создать профили
export function useCreateProfiles() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (profilesData) => {
      const response = await profilesService.create(profilesData)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['profiles'])
      toast.success(`Создано ${data.created} профилей`)
      if (data.duplicates > 0) {
        toast.warning(`Дубликатов пропущено: ${data.duplicates}`)
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка создания профилей')
    }
  })
}

// Обновить профиль
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await profilesService.update(id, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profiles'])
      toast.success('Профиль обновлен успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка обновления профиля')
    }
  })
}

// Удалить профиль
export function useDeleteProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await profilesService.delete(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profiles'])
      toast.success('Профиль удален успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка удаления профиля')
    }
  })
}

// Создать папку
export function useCreateFolder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (name) => {
      const response = await profilesService.createFolder(name)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profiles'])
      queryClient.invalidateQueries(['profiles', 'folders'])
      toast.success('Папка создана успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка создания папки')
    }
  })
}