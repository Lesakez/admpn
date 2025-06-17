import { useQuery } from '@tanstack/react-query'
import { activityService } from '../services/activityService'

// Получить последнюю активность
export function useRecentActivity(filters = {}) {
  return useQuery({
    queryKey: ['activity', 'recent', filters],
    queryFn: async () => {
      const response = await activityService.getRecent(filters)
      return response.data.data
    },
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  })
}

// Получить активность по сущности
export function useEntityActivity(entityType, entityId, filters = {}) {
  return useQuery({
    queryKey: ['activity', 'entity', entityType, entityId, filters],
    queryFn: async () => {
      const response = await activityService.getByEntity(entityType, entityId, filters)
      return response.data.data
    },
    enabled: !!(entityType && entityId),
  })
}

// Получить статистику активности
export function useActivityStats(filters = {}) {
  return useQuery({
    queryKey: ['activity', 'stats', filters],
    queryFn: async () => {
      const response = await activityService.getStats(filters)
      return response.data.data
    },
  })
}