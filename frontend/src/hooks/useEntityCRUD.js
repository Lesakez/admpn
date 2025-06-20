// frontend/src/hooks/useEntityCRUD.js

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useMemo, useCallback } from 'react'

/**
 * Универсальный хук для CRUD операций
 */
export function useEntityCRUD(entityName, service, options = {}) {
  const queryClient = useQueryClient()
  
  const {
    invalidateQueries = [entityName],
    successMessages = {},
    errorMessages = {},
    onSuccess = {},
    onError = {}
  } = options

  // Создание записи
  const createMutation = useMutation({
    mutationFn: (data) => service.create(data),
    onSuccess: (response, variables) => {
      // Инвалидируем кеш
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries([query])
      })
      
      const message = successMessages.create || `${entityName} успешно создан`
      toast.success(message)
      
      onSuccess.create?.(response, variables)
    },
    onError: (error, variables) => {
      const message = error.response?.data?.error || 
                     errorMessages.create || 
                     `Ошибка создания ${entityName}`
      toast.error(message)
      
      onError.create?.(error, variables)
    }
  })

  // Обновление записи
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => service.update(id, data),
    onSuccess: (response, variables) => {
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries([query])
      })
      
      const message = successMessages.update || `${entityName} успешно обновлен`
      toast.success(message)
      
      onSuccess.update?.(response, variables)
    },
    onError: (error, variables) => {
      const message = error.response?.data?.error || 
                     errorMessages.update || 
                     `Ошибка обновления ${entityName}`
      toast.error(message)
      
      onError.update?.(error, variables)
    }
  })

  // Удаление записи
  const deleteMutation = useMutation({
    mutationFn: (id) => service.delete(id),
    onSuccess: (response, variables) => {
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries([query])
      })
      
      const message = successMessages.delete || `${entityName} успешно удален`
      toast.success(message)
      
      onSuccess.delete?.(response, variables)
    },
    onError: (error, variables) => {
      const message = error.response?.data?.error || 
                     errorMessages.delete || 
                     `Ошибка удаления ${entityName}`
      toast.error(message)
      
      onError.delete?.(error, variables)
    }
  })

  // Массовое удаление
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => service.bulkDelete(ids),
    onSuccess: (response, variables) => {
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries([query])
      })
      
      const count = response?.data?.deletedCount || variables.length
      const message = successMessages.bulkDelete || `Удалено ${count} записей`
      toast.success(message)
      
      onSuccess.bulkDelete?.(response, variables)
    },
    onError: (error, variables) => {
      const message = error.response?.data?.error || 
                     errorMessages.bulkDelete || 
                     'Ошибка массового удаления'
      toast.error(message)
      
      onError.bulkDelete?.(error, variables)
    }
  })

  // Массовое обновление
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, data }) => service.bulkUpdate(ids, data),
    onSuccess: (response, variables) => {
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries([query])
      })
      
      const count = response?.data?.updatedCount || variables.ids.length
      const message = successMessages.bulkUpdate || `Обновлено ${count} записей`
      toast.success(message)
      
      onSuccess.bulkUpdate?.(response, variables)
    },
    onError: (error, variables) => {
      const message = error.response?.data?.error || 
                     errorMessages.bulkUpdate || 
                     'Ошибка массового обновления'
      toast.error(message)
      
      onError.bulkUpdate?.(error, variables)
    }
  })

  // Мемоизированные методы для стабильности ссылок
  const methods = useMemo(() => ({
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    bulkDelete: bulkDeleteMutation.mutateAsync,
    bulkUpdate: bulkUpdateMutation.mutateAsync
  }), [createMutation, updateMutation, deleteMutation, bulkDeleteMutation, bulkUpdateMutation])

  return {
    // Мутации
    createMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation,
    bulkUpdateMutation,
    
    // Состояния
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    isBulkLoading: bulkDeleteMutation.isPending || bulkUpdateMutation.isPending,
    
    // Методы
    ...methods
  }
}

/**
 * Хук для получения списка сущностей
 */
export function useEntityList(entityName, service, filters = {}, options = {}) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 минут
    gcTime = 10 * 60 * 1000, // 10 минут (было cacheTime)
    refetchOnWindowFocus = false,
    keepPreviousData = true,
    ...queryOptions
  } = options

  // Мемоизируем ключ запроса для стабильности
  const queryKey = useMemo(() => [entityName, 'list', filters], [entityName, filters])

  const query = useQuery({
    queryKey,
    queryFn: () => service.getAll(filters),
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    placeholderData: keepPreviousData ? (previousData) => previousData : undefined,
    select: useCallback((data) => {
      // Нормализуем структуру ответа
      if (data?.data?.data) {
        return {
          data: data.data.data,
          pagination: data.data.pagination,
          stats: data.data.stats
        }
      }
      if (data?.data) {
        return {
          data: Array.isArray(data.data) ? data.data : data.data.data || [],
          pagination: data.data.pagination,
          stats: data.data.stats
        }
      }
      return {
        data: Array.isArray(data) ? data : [],
        pagination: null,
        stats: null
      }
    }, []),
    ...queryOptions
  })

  return {
    ...query,
    data: query.data?.data || [],
    pagination: query.data?.pagination,
    stats: query.data?.stats
  }
}

/**
 * Хук для получения одной сущности по ID
 */
export function useEntityById(entityName, service, id, options = {}) {
  const {
    enabled = !!id,
    staleTime = 5 * 60 * 1000,
    gcTime = 10 * 60 * 1000,
    refetchOnWindowFocus = false,
    ...queryOptions
  } = options

  const queryKey = useMemo(() => [entityName, 'detail', id], [entityName, id])

  return useQuery({
    queryKey,
    queryFn: () => service.getById(id),
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    select: useCallback((data) => {
      if (data?.data?.data) return data.data.data
      if (data?.data) return data.data
      return data
    }, []),
    ...queryOptions
  })
}

/**
 * Хук для статистики сущности
 */
export function useEntityStats(entityName, service, options = {}) {
  const {
    enabled = true,
    staleTime = 2 * 60 * 1000, // 2 минуты
    gcTime = 5 * 60 * 1000,
    refetchInterval = 30000, // Обновляем каждые 30 секунд
    refetchOnWindowFocus = true,
    ...queryOptions
  } = options

  const queryKey = useMemo(() => [entityName, 'stats'], [entityName])

  return useQuery({
    queryKey,
    queryFn: () => service.getStats?.(),
    enabled: enabled && !!service.getStats,
    staleTime,
    gcTime,
    refetchInterval,
    refetchOnWindowFocus,
    select: useCallback((data) => {
      if (data?.data?.data) return data.data.data
      if (data?.data) return data.data
      return data
    }, []),
    ...queryOptions
  })
}

/**
 * Хук для автокомплита
 */
export function useEntityAutocomplete(entityName, service, query, options = {}) {
  const {
    enabled = !!query && query.length >= 2,
    staleTime = 30 * 1000, // 30 секунд
    gcTime = 2 * 60 * 1000,
    ...queryOptions
  } = options

  const queryKey = useMemo(() => [entityName, 'autocomplete', query], [entityName, query])

  return useQuery({
    queryKey,
    queryFn: () => service.autocomplete?.(query),
    enabled: enabled && !!service.autocomplete,
    staleTime,
    gcTime,
    select: useCallback((data) => {
      if (data?.data?.data) return data.data.data
      if (data?.data) return Array.isArray(data.data) ? data.data : []
      return Array.isArray(data) ? data : []
    }, []),
    ...queryOptions
  })
}

/**
 * Хук для экспорта данных
 */
export function useEntityExport(entityName, service, options = {}) {
  const {
    onSuccess = () => {},
    onError = () => {}
  } = options

  return useMutation({
    mutationFn: (exportOptions) => service.export?.(exportOptions),
    onSuccess: (response, variables) => {
      toast.success('Экспорт успешно выполнен')
      onSuccess(response, variables)
    },
    onError: (error, variables) => {
      const message = error.response?.data?.error || 'Ошибка экспорта'
      toast.error(message)
      onError(error, variables)
    }
  })
}

/**
 * Хук для импорта данных
 */
export function useEntityImport(entityName, service, options = {}) {
  const queryClient = useQueryClient()
  
  const {
    invalidateQueries = [entityName],
    onSuccess = () => {},
    onError = () => {}
  } = options

  return useMutation({
    mutationFn: (importData) => service.import?.(importData),
    onSuccess: (response, variables) => {
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries([query])
      })
      
      const count = response?.data?.importedCount || 0
      toast.success(`Импортировано ${count} записей`)
      onSuccess(response, variables)
    },
    onError: (error, variables) => {
      const message = error.response?.data?.error || 'Ошибка импорта'
      toast.error(message)
      onError(error, variables)
    }
  })
}

/**
 * Комплексный хук для полного управления сущностью
 */
export function useEntityManager(entityName, service, filters = {}, options = {}) {
  const crud = useEntityCRUD(entityName, service, options)
  const list = useEntityList(entityName, service, filters, options)
  const stats = useEntityStats(entityName, service, options)
  const exportHook = useEntityExport(entityName, service, options)
  const importHook = useEntityImport(entityName, service, options)

  return {
    // CRUD операции
    ...crud,
    
    // Данные
    data: list.data,
    pagination: list.pagination,
    stats: stats.data,
    
    // Состояния
    isLoadingList: list.isLoading,
    isLoadingStats: stats.isLoading,
    isExporting: exportHook.isPending,
    isImporting: importHook.isPending,
    
    // Ошибки
    listError: list.error,
    statsError: stats.error,
    
    // Методы
    refetch: list.refetch,
    refetchStats: stats.refetch,
    exportData: exportHook.mutateAsync,
    importData: importHook.mutateAsync
  }
}

// Экспорт всех хуков
export default {
  useEntityCRUD,
  useEntityList,
  useEntityById,
  useEntityStats,
  useEntityAutocomplete,
  useEntityExport,
  useEntityImport,
  useEntityManager
}