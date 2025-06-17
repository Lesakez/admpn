import { useState } from 'react'
import { Plus, Download, Upload, MoreVertical } from 'lucide-react'
import { Button, FilterBar } from '../ui'
import EntityTable from './EntityTable'
import EntityForm from './EntityForm'
import BulkActions from './BulkActions'
import Pagination from '../ui/Pagination'
import { useEntity, useEntityStats } from '../../hooks/useEntity'

export default function EntityPage({ config }) {
  const [filters, setFilters] = useState({ page: 1, limit: 20 })
  const [selectedIds, setSelectedIds] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  // Загрузка данных
  const { data, isLoading, error } = useEntity(config, filters)
  const { data: stats } = useEntityStats(config)

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setSelectedIds([]) // Сбрасываем выбранные при изменении фильтров
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: sortDirection === 'asc' ? 'desc' : 'asc',
      page: 1
    }))
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleCreate = () => {
    setEditingItem(null)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingItem(null)
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500">
          Ошибка загрузки данных: {error.message}
        </div>
      </div>
    )
  }

  const items = data?.[config.entityType] || data?.items || []
  const pagination = data?.pagination || {}

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {config.entityNamePlural}
          </h1>
          {stats && (
            <p className="text-gray-600">
              Всего: {stats.total || 0}
              {stats.byStatus && (
                <span className="ml-4">
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <span key={status} className="ml-2">
                      {status}: {count}
                    </span>
                  ))}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Импорт/Экспорт */}
          {config.importExport && (
            <div className="flex items-center gap-2">
              {config.importExport.import && (
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Импорт
                </Button>
              )}
              {config.importExport.export && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Экспорт
                </Button>
              )}
            </div>
          )}

          {/* Создать новый */}
          {!config.readOnly && (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Создать {config.entityName}
            </Button>
          )}
        </div>
      </div>

      {/* Фильтры */}
      {config.filters && (
        <FilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          filterConfig={config.filters}
        >
          {config.filters.map((filter) => {
            switch (filter.type) {
              case 'search':
                return (
                  <div key={filter.key} className={filter.className}>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={filter.placeholder}
                        className="input pl-10"
                        value={filters[filter.key] || ''}
                        onChange={(e) => handleFiltersChange({
                          ...filters,
                          [filter.key]: e.target.value,
                          page: 1
                        })}
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )

              case 'select':
                return (
                  <div key={filter.key} className={filter.className}>
                    <select
                      className="select"
                      value={filters[filter.key] || ''}
                      onChange={(e) => handleFiltersChange({
                        ...filters,
                        [filter.key]: e.target.value,
                        page: 1
                      })}
                    >
                      <option value="">{filter.placeholder}</option>
                      {filter.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )

              case 'date':
                return (
                  <div key={filter.key} className={filter.className}>
                    <input
                      type="date"
                      className="input"
                      value={filters[filter.key] || ''}
                      onChange={(e) => handleFiltersChange({
                        ...filters,
                        [filter.key]: e.target.value,
                        page: 1
                      })}
                    />
                  </div>
                )

              default:
                return null
            }
          })}
        </FilterBar>
      )}

      {/* Массовые действия */}
      {selectedIds.length > 0 && config.bulkActions && (
        <BulkActions
          config={config}
          selectedIds={selectedIds}
          onSuccess={() => setSelectedIds([])}
        />
      )}

      {/* Таблица */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Загрузка...</div>
        </div>
      ) : (
        <EntityTable
          config={config}
          data={items}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={handleEdit}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
        />
      )}

      {/* Пагинация */}
      {pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page || 1}
          totalPages={pagination.pages}
          onPageChange={handlePageChange}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
        />
      )}

      {/* Модальное окно формы */}
      {showForm && (
        <EntityForm
          config={config}
          item={editingItem}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}