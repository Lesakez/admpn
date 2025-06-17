// frontend/src/hooks/useStatuses.js
import { useQuery } from '@tanstack/react-query'
import { statusService } from '../services/statusService'

// Получить все статусы для сущности
export function useEntityStatuses(entityType) {
  return useQuery({
    queryKey: ['statuses', entityType],
    queryFn: () => statusService.getEntityStatuses(entityType),
    staleTime: 5 * 60 * 1000, // 5 минут
    cacheTime: 10 * 60 * 1000, // 10 минут
  })
}

// Получить конфигурацию всех статусов
export function useStatusConfig() {
  return useQuery({
    queryKey: ['statuses', 'config'],
    queryFn: () => statusService.getStatusConfig(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

// Получить описание статуса
export function useStatusDescription(status) {
  return useQuery({
    queryKey: ['statuses', 'description', status],
    queryFn: () => statusService.getStatusDescription(status),
    enabled: !!status,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

// Получить цвет статуса
export function useStatusColor(status) {
  return useQuery({
    queryKey: ['statuses', 'color', status],
    queryFn: () => statusService.getStatusColor(status),
    enabled: !!status,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

// Кастомный хук для работы со статусами в формах
export function useStatusOptions(entityType) {
  const { data: statuses, isLoading, error } = useEntityStatuses(entityType)
  const { data: config } = useStatusConfig()

  const statusOptions = React.useMemo(() => {
    if (!statuses || !config) return []
    
    return Object.values(statuses).map(status => ({
      value: status,
      label: config.descriptions[status] || status,
      color: config.colors[status] || 'secondary',
      group: config.groups[entityType.toUpperCase()] ? 
        Object.entries(config.groups[entityType.toUpperCase()])
          .find(([_, groupStatuses]) => groupStatuses.includes(status))?.[0] : null
    }))
  }, [statuses, config, entityType])

  const getStatusBadge = React.useCallback((status) => {
    if (!config) return { color: 'secondary', text: status }
    
    return {
      color: config.colors[status] || 'secondary',
      text: config.descriptions[status] || status
    }
  }, [config])

  const isTransitionAllowed = React.useCallback(async (fromStatus, toStatus) => {
    return await statusService.isTransitionAllowed(fromStatus, toStatus, entityType)
  }, [entityType])

  return {
    statusOptions,
    getStatusBadge,
    isTransitionAllowed,
    isLoading,
    error
  }
}