import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proxiesService } from '../services/proxiesService'
import toast from 'react-hot-toast'

// Получить список прокси
export function useProxies(filters = {}) {
  return useQuery({
    queryKey: ['proxies', filters],
    queryFn: async () => {
      const response = await proxiesService.getAll(filters)
      return response.data.data
    },
    keepPreviousData: true,
  })
}

// Получить статистику прокси
export function useProxiesStats() {
  return useQuery({
    queryKey: ['proxies', 'stats'],
    queryFn: async () => {
      const response = await proxiesService.getStats()
      return response.data.data
    },
  })
}

// Создать прокси
export function useCreateProxy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (proxyData) => {
      const response = await proxiesService.create(proxyData)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['proxies'])
      toast.success('Прокси создан успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка создания прокси')
    }
  })
}

// Обновить прокси
export function useUpdateProxy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await proxiesService.update(id, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['proxies'])
      toast.success('Прокси обновлен успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка обновления прокси')
    }
  })
}

// Удалить прокси
export function useDeleteProxy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await proxiesService.delete(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['proxies'])
      toast.success('Прокси удален успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка удаления прокси')
    }
  })
}

// Переключить статус прокси
export function useToggleProxyStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await proxiesService.toggleStatus(id)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['proxies'])
      toast.success('Статус прокси изменен')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка изменения статуса')
    }
  })
}

// Сменить IP прокси (ОБНОВЛЕННЫЙ)
export function useChangeProxyIP() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await proxiesService.changeIP(id)
      return response.data // Возвращаем весь response.data
    },
    onSuccess: (responseData) => {
      queryClient.invalidateQueries(['proxies'])
      
      // responseData = { success: true, message: 'IP успешно изменен', data: {...} }
      if (responseData.success) {
        toast.success(responseData.message || 'IP успешно изменен!')
      } else {
        toast.success('Запрос на смену IP отправлен')
      }
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error
      
      // Специальная обработка для ограничений по времени
      if (errorMsg && errorMsg.includes('wait')) {
        toast.error('Нужно подождать перед следующей сменой IP')
      } else if (errorMsg && errorMsg.includes('15s')) {
        toast.error('Подождите 15 секунд перед следующей сменой')
      } else if (errorMsg && errorMsg.includes('Ограничение прокси-сервера')) {
        toast.error('Слишком частые запросы смены IP')
      } else {
        toast.error(errorMsg || 'Ошибка смены IP')
      }
    }
  })
}

// Массовое удаление
export function useBulkDeleteProxies() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids) => {
      const response = await proxiesService.bulkDelete(ids)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['proxies'])
      toast.success(`Удалено ${data.deleted} прокси`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка массового удаления')
    }
  })
}