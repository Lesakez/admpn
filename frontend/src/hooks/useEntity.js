import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import api from '../utils/api'

// Получить список сущностей
export function useEntity(config, filters = {}) {
  return useQuery({
    queryKey: [config.entityType, filters],
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
      
      const response = await api.get(`${config.apiEndpoint}?${params.toString()}`)
      return response.data.data
    },
    keepPreviousData: true,
  })
}

// Получить статистику сущностей
export function useEntityStats(config) {
  return useQuery({
    queryKey: [config.entityType, 'stats'],
    queryFn: async () => {
      const response = await api.get(`${config.apiEndpoint}/stats`)
      return response.data.data
    },
    enabled: !config.readOnly, // Не загружаем статистику для readonly сущностей
  })
}

// Получить одну сущность по ID
export function useEntityById(config, id) {
  return useQuery({
    queryKey: [config.entityType, id],
    queryFn: async () => {
      const response = await api.get(`${config.apiEndpoint}/${id}`)
      return response.data.data
    },
    enabled: !!id,
  })
}

// Создать сущность
export function useCreateEntity(config) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post(config.apiEndpoint, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries([config.entityType])
      toast.success(`${config.entityName} создан успешно`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || `Ошибка создания ${config.entityName}`)
    }
  })
}

// Обновить сущность
export function useUpdateEntity(config) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`${config.apiEndpoint}/${id}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries([config.entityType])
      toast.success(`${config.entityName} обновлен успешно`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || `Ошибка обновления ${config.entityName}`)
    }
  })
}

// Удалить сущность
export function useDeleteEntity(config) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`${config.apiEndpoint}/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries([config.entityType])
      toast.success(`${config.entityName} удален успешно`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || `Ошибка удаления ${config.entityName}`)
    }
  })
}

// Массовые операции
export function useBulkAction(config) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ action, payload }) => {
      let endpoint = ''
      let method = 'POST'
      
      // Определяем endpoint на основе действия
      switch (action) {
        case 'bulk-delete':
          endpoint = `${config.apiEndpoint}/bulk-delete`
          break
        case 'bulk-update-status':
          endpoint = `${config.apiEndpoint}/bulk-update-status`
          payload = { ids: payload.ids, status: payload.value }
          break
        default:
          // Для кастомных действий ищем в конфигурации
          const actionConfig = config.bulkActions?.find(a => a.key === action)
          if (actionConfig?.endpoint) {
            endpoint = actionConfig.endpoint
            method = actionConfig.method || 'POST'
          } else {
            throw new Error(`Unknown bulk action: ${action}`)
          }
      }

      const response = await api[method.toLowerCase()](endpoint, payload)
      return response.data.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([config.entityType])
      
      // Показываем успешное сообщение в зависимости от действия
      switch (variables.action) {
        case 'bulk-delete':
          toast.success(`Удалено ${data.deleted || data.count || variables.payload.ids.length} элементов`)
          break
        case 'bulk-update-status':
          toast.success(`Обновлен статус у ${data.updated || data.count || variables.payload.ids.length} элементов`)
          break
        default:
          toast.success('Операция выполнена успешно')
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка выполнения операции')
    }
  })
}

// Выполнить действие над сущностью
export function useEntityAction(config) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ action, item, data }) => {
      const actionConfig = config.actions?.find(a => a.key === action)
      if (!actionConfig) {
        throw new Error(`Unknown action: ${action}`)
      }

      const endpoint = typeof actionConfig.endpoint === 'function' 
        ? actionConfig.endpoint(item.id) 
        : actionConfig.endpoint
      
      const method = actionConfig.method || 'POST'
      
      let response
      if (method.toLowerCase() === 'get') {
        response = await api.get(endpoint)
      } else {
        response = await api[method.toLowerCase()](endpoint, data)
      }
      
      return { 
        data: response.data.data || response.data, 
        action: actionConfig 
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries([config.entityType])
      
      const { action } = result
      if (action.successMessage) {
        toast.success(action.successMessage)
      } else {
        toast.success('Действие выполнено успешно')
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка выполнения действия')
    }
  })
}

// Импорт данных
export function useImportEntity(config) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (importData) => {
      const importConfig = config.importExport?.import
      if (!importConfig) {
        throw new Error('Import not supported for this entity')
      }

      const response = await api.post(importConfig.endpoint, importData)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries([config.entityType])
      toast.success(`Импортировано ${data.imported || data.count} элементов`)
      
      if (data.errors?.length > 0) {
        toast.error(`Ошибок: ${data.errors.length}`)
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка импорта')
    }
  })
}

// Экспорт данных
export function useExportEntity(config) {
  return useMutation({
    mutationFn: async ({ format, filters = {} }) => {
      const exportConfig = config.importExport?.export
      if (!exportConfig) {
        throw new Error('Export not supported for this entity')
      }

      const formatConfig = exportConfig.formats.find(f => f.value === format)
      if (!formatConfig) {
        throw new Error(`Export format ${format} not supported`)
      }

      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value)
        }
      })

      const response = await api.get(`${formatConfig.endpoint}?${params.toString()}`, {
        responseType: format === 'json' ? 'json' : 'blob'
      })

      // Создаем ссылку для скачивания
      if (format !== 'json') {
        const blob = new Blob([response.data])
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${config.entityType}_export_${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      }

      return response.data
    },
    onSuccess: () => {
      toast.success('Экспорт завершен успешно')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка экспорта')
    }
  })
}