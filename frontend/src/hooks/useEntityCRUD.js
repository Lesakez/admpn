import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

/**
 * Универсальный хук для CRUD операций
 * @param {string} entityName - название сущности для cache keys и сообщений
 * @param {object} service - объект с методами CRUD операций
 * @param {object} options - дополнительные опции
 */
export function useEntityCRUD(entityName, service, options = {}) {
  const queryClient = useQueryClient()
  
  const {
    successMessages = {},
    errorMessages = {},
    invalidateQueries = [entityName],
    onSuccessCallback,
    onErrorCallback
  } = options

  const defaultSuccessMessages = {
    create: `${entityName} создан успешно`,
    update: `${entityName} обновлен успешно`,
    delete: `${entityName} удален успешно`,
    ...successMessages
  }

  const defaultErrorMessages = {
    create: `Ошибка создания ${entityName}`,
    update: `Ошибка обновления ${entityName}`,
    delete: `Ошибка удаления ${entityName}`,
    ...errorMessages
  }

  // Создание сущности
  const createMutation = useMutation({
    mutationFn: service.create,
    onSuccess: (data) => {
      // Инвалидируем кэш
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries([query])
      })
      
      // Показываем сообщение
      toast.success(defaultSuccessMessages.create)
      
      // Вызываем callback если есть
      if (onSuccessCallback?.create) {
        onSuccessCallback.create(data)
      }
    },
    onError: (error) => {
      const message = error.response?.data?.error || defaultErrorMessages.create
      toast.error(message)
      
      if (onErrorCallback?.create) {
        onErrorCallback.create(error)
      }
    }
  })

  // Обновление сущности
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => service.update(id, data),
    onSuccess: (data) => {
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries([query])
      })
      
      toast.success(defaultSuccessMessages.update)
      
      if (onSuccessCallback?.update) {
        onSuccessCallback.update(data)
      }
    },
    onError: (error) => {
      const message = error.response?.data?.error || defaultErrorMessages.update
      toast.error(message)
      
      if (onErrorCallback?.update) {
        onErrorCallback.update(error)
      }
    }
  })

  // Удаление сущности
  const deleteMutation = useMutation({
    mutationFn: service.delete,
    onSuccess: (data) => {
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries([query])
      })
      
      toast.success(defaultSuccessMessages.delete)
      
      if (onSuccessCallback?.delete) {
        onSuccessCallback.delete(data)
      }
    },
    onError: (error) => {
      const message = error.response?.data?.error || defaultErrorMessages.delete
      toast.error(message)
      
      if (onErrorCallback?.delete) {
        onErrorCallback.delete(error)
      }
    }
  })

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    
    // Утилиты для проверки состояния
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isLoading: createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading,
    
    // Методы для вызова мутаций
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync
  }
}

/**
 * Хук для получения списка сущностей с фильтрацией и пагинацией
 * @param {string} entityName - название сущности
 * @param {object} service - сервис для API вызовов
 * @param {object} filters - фильтры и параметры запроса
 * @param {object} options - опции для useQuery
 */
export function useEntityList(entityName, service, filters = {}, options = {}) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 минут
    cacheTime = 10 * 60 * 1000, // 10 минут
    refetchOnWindowFocus = false,
    ...queryOptions
  } = options

  return useQuery({
    queryKey: [entityName, 'list', filters],
    queryFn: () => service.getAll(filters),
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    select: (data) => data?.data || data,
    ...queryOptions
  })
}

/**
 * Хук для получения одной сущности по ID
 * @param {string} entityName - название сущности
 * @param {object} service - сервис для API вызовов
 * @param {number|string} id - ID сущности
 * @param {object} options - опции для useQuery
 */
export function useEntityById(entityName, service, id, options = {}) {
  const {
    enabled = !!id,
    staleTime = 5 * 60 * 1000,
    cacheTime = 10 * 60 * 1000,
    refetchOnWindowFocus = false,
    ...queryOptions
  } = options

  return useQuery({
    queryKey: [entityName, 'detail', id],
    queryFn: () => service.getById(id),
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    select: (data) => data?.data || data,
    ...queryOptions
  })
}

/**
 * Хук для массовых операций
 * @param {string} entityName - название сущности
 * @param {object} service - сервис для API вызовов
 * @param {object} options - дополнительные опции
 */
export function useEntityBulkOperations(entityName, service, options = {}) {
  const queryClient = useQueryClient()
  const { invalidateQueries = [entityName] } = options

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => service.bulkDelete(ids),
    onSuccess: (data) => {
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries([query])
      })
      
      const count = data?.data?.deletedCount || 0
      toast.success(`Удалено ${count} элементов`)
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Ошибка массового удаления'
      toast.error(message)
    }
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, data }) => service.bulkUpdate(ids, data),
    onSuccess: (data) => {
      invalidateQueries.forEach(query => {
        queryClient.invalidateQueries([query])
      })
      
      const count = data?.data?.updatedCount || 0
      toast.success(`Обновлено ${count} элементов`)
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Ошибка массового обновления'
      toast.error(message)
    }
  })

  return {
    bulkDeleteMutation,
    bulkUpdateMutation,
    
    // Утилиты
    isBulkDeleting: bulkDeleteMutation.isLoading,
    isBulkUpdating: bulkUpdateMutation.isLoading,
    isBulkLoading: bulkDeleteMutation.isLoading || bulkUpdateMutation.isLoading,
    
    // Методы
    bulkDelete: bulkDeleteMutation.mutateAsync,
    bulkUpdate: bulkUpdateMutation.mutateAsync
  }
}

/**
 * Хук для статистики сущности
 * @param {string} entityName - название сущности
 * @param {object} service - сервис для API вызовов
 * @param {object} options - опции для useQuery
 */
export function useEntityStats(entityName, service, options = {}) {
  const {
    enabled = true,
    staleTime = 2 * 60 * 1000, // 2 минуты для статистики
    cacheTime = 5 * 60 * 1000,
    refetchInterval = 30000, // Обновляем каждые 30 секунд
    ...queryOptions
  } = options

  return useQuery({
    queryKey: [entityName, 'stats'],
    queryFn: () => service.getStats(),
    enabled,
    staleTime,
    cacheTime,
    refetchInterval,
    select: (data) => data?.data || data,
    ...queryOptions
  })
}

// Экспортируем все хуки для удобства
export default {
  useEntityCRUD,
  useEntityList,
  useEntityById,
  useEntityBulkOperations,
  useEntityStats
}