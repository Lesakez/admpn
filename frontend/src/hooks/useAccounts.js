import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import api from '../utils/api'

// Получить список аккаунтов
export function useAccounts(filters = {}) {
  return useQuery({
    queryKey: ['accounts', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v))
          } else {
            params.append(key, value)
          }
        }
      })
      
      const response = await api.get(`/accounts?${params.toString()}`)
      return response.data.data
    },
    keepPreviousData: true,
  })
}

// Получить статистику аккаунтов
export function useAccountsStats() {
  return useQuery({
    queryKey: ['accounts', 'stats'],
    queryFn: async () => {
      const response = await api.get('/accounts/stats')
      return response.data.data
    },
  })
}

// Создать аккаунт
export function useCreateAccount() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (accountData) => {
      const response = await api.post('/accounts', accountData)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts'])
      toast.success('Аккаунт создан успешно')
    },
  })
}

// Обновить аккаунт
export function useUpdateAccount() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/accounts/${id}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts'])
      toast.success('Аккаунт обновлен успешно')
    },
  })
}

// Удалить аккаунт
export function useDeleteAccount() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/accounts/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts'])
      toast.success('Аккаунт удален успешно')
    },
  })
}

// Изменить статус аккаунта
export function useChangeAccountStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await api.post(`/accounts/${id}/status`, { status })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts'])
      toast.success('Статус изменен успешно')
    },
  })
}

// Импорт аккаунтов из текста
export function useImportAccountsFromText() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ text, format, source }) => {
      const response = await api.post('/accounts/import-text', { text, format, source })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['accounts'])
      toast.success(`Импортировано ${data.imported} аккаунтов`)
      if (data.errors?.length > 0) {
        toast.error(`Ошибок: ${data.errors.length}`)
      }
    },
  })
}

// Массовое удаление
export function useBulkDeleteAccounts() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids) => {
      const response = await api.post('/accounts/bulk-delete', { ids })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['accounts'])
      toast.success(`Удалено ${data.deleted} аккаунтов`)
    },
  })
}

// Массовое обновление статуса
export function useBulkUpdateAccountsStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ ids, status }) => {
      const response = await api.post('/accounts/bulk-update-status', { ids, status })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['accounts'])
      toast.success(`Обновлен статус у ${data.updated} аккаунтов`)
    },
  })
}