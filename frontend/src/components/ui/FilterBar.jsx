import { X } from 'lucide-react'
import { Button } from './index'

export default function FilterBar({ 
  filters, 
  onFiltersChange, 
  filterConfig,
  children,
  className 
}) {
  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 })
  }

  const handleClearFilters = () => {
    const clearedFilters = { page: 1 }
    if (filters.limit) clearedFilters.limit = filters.limit
    onFiltersChange(clearedFilters)
  }

  const getActiveFilters = () => {
    return Object.entries(filters).filter(([key, value]) => 
      key !== 'page' && key !== 'limit' && value && value !== ''
    )
  }

  const activeFilters = getActiveFilters()
  const hasActiveFilters = activeFilters.length > 0

  const getFilterLabel = (key, value) => {
    const config = filterConfig?.find(f => f.key === key)
    if (config?.options) {
      const option = config.options.find(o => o.value === value)
      return option?.label || value
    }
    return value
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex flex-col lg:flex-row gap-4">
          {children}
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Очистить
            </Button>
          )}
        </div>

        {/* Активные фильтры */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilters.map(([key, value]) => {
              const config = filterConfig?.find(f => f.key === key)
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {config?.label || key}: {getFilterLabel(key, value)}
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}