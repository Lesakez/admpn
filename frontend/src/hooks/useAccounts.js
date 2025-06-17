import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsService } from '../services/accountsService'
import toast from 'react-hot-toast'

// Получить список аккаунтов
export function useAccounts(filters = {}) {
  return useQuery({
    queryKey: ['accounts', filters],
    queryFn: async () => {
      const response = await accountsService.getAll(filters)
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
      const response = await accountsService.getStats()
      return response.data.data
    },
  })
}

// Создать аккаунт
export function useCreateAccount() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (accountData) => {
      const response = await accountsService.create(accountData)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts'])
      toast.success('Аккаунт создан успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка создания аккаунта')
    }
  })
}

// Обновить аккаунт
export function useUpdateAccount() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await accountsService.update(id, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts'])
      toast.success('Аккаунт обновлен успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка обновления аккаунта')
    }
  })
}

// Удалить аккаунт
export function useDeleteAccount() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await accountsService.delete(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts'])
      toast.success('Аккаунт удален успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка удаления аккаунта')
    }
  })
}

// Массовое удаление
export function useBulkDeleteAccounts() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids) => {
      const response = await accountsService.bulkDelete(ids)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['accounts'])
      toast.success(`Удалено ${data.deleted} аккаунтов`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка массового удаления')
    }
  })
}