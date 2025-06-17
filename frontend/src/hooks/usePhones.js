import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { phonesService } from '../services/phonesService'
import toast from 'react-hot-toast'

// Получить список телефонов
export function usePhones(filters = {}) {
  return useQuery({
    queryKey: ['phones', filters],
    queryFn: async () => {
      const response = await phonesService.getAll(filters)
      return response.data.data
    },
    keepPreviousData: true,
  })
}

// Получить статистику телефонов
export function usePhonesStats() {
  return useQuery({
    queryKey: ['phones', 'stats'],
    queryFn: async () => {
      const response = await phonesService.getStats()
      return response.data.data
    },
  })
}

// Создать телефон
export function useCreatePhone() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (phoneData) => {
      const response = await phonesService.create(phoneData)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['phones'])
      toast.success('Устройство создано успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка создания устройства')
    }
  })
}

// Обновить телефон
export function useUpdatePhone() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await phonesService.update(id, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['phones'])
      toast.success('Устройство обновлено успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка обновления устройства')
    }
  })
}

// Удалить телефон
export function useDeletePhone() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await phonesService.delete(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['phones'])
      toast.success('Устройство удалено успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка удаления устройства')
    }
  })
}

// Переключить статус телефона
export function useTogglePhoneStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await phonesService.toggleStatus(id)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['phones'])
      toast.success('Статус устройства изменен')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка изменения статуса')
    }
  })
}

// Перезагрузить телефон
export function useRebootPhone() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await phonesService.reboot(id)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['phones'])
      toast.success('Перезагрузка устройства запущена')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка перезагрузки')
    }
  })
}

// Массовое удаление
export function useBulkDeletePhones() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids) => {
      const response = await phonesService.bulkDelete(ids)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['phones'])
      toast.success(`Удалено ${data.deleted} устройств`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка массового удаления')
    }
  })
}