import { useState } from 'react'
import { MoreVertical, Eye, EyeOff, Edit, Trash2 } from 'lucide-react'
import { Table, StatusBadge, Button } from '../ui'
import { formatDateTime, formatDate, formatTime } from '../../utils/format'

export default function EntityTable({
  config,
  data,
  selectedIds,
  onSelectionChange,
  onEdit,
  onSort,
  sortField,
  sortDirection,
  onAction
}) {
  const [showPasswords, setShowPasswords] = useState({})

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange(data.map(item => item.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectItem = (id, checked) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const togglePasswordVisibility = (itemId, fieldKey) => {
    setShowPasswords(prev => ({
      ...prev,
      [`${itemId}_${fieldKey}`]: !prev[`${itemId}_${fieldKey}`]
    }))
  }

  const renderCellContent = (column, value, row) => {
    // Если есть кастомный рендерер
    if (column.render) {
      return column.render(value, row)
    }

    // Обработка по типу
    switch (column.type) {
      case 'password':
        const passwordKey = `${row.id}_${column.key}`
        const isVisible = showPasswords[passwordKey]
        
        if (!value) return '-'
        
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">
              {isVisible ? value : '••••••••'}
            </span>
            {column.showToggle && (
              <button
                onClick={() => togglePasswordVisibility(row.id, column.key)}
                className="text-gray-400 hover:text-gray-600"
              >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
        )

      case 'status':
        return (
          <StatusBadge 
            status={value} 
            entityType={column.entityType}
            showDescription={true}
          />
        )

      case 'datetime':
        return value ? formatDateTime(value) : '-'

      case 'date':
        return value ? formatDate(value) : '-'

      case 'time':
        return value ? formatTime(value) : '-'

      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : (value || 0)

      case 'email':
        return value ? (
          <a href={`mailto:${value}`} className="text-blue-600 hover:text-blue-800">
            {value}
          </a>
        ) : '-'

      case 'url':
        return value ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 truncate"
          >
            {value}
          </a>
        ) : '-'

      case 'boolean':
        return (
          <span className={`badge ${value ? 'badge-success' : 'badge-gray'}`}>
            {value ? 'Да' : 'Нет'}
          </span>
        )

      case 'json':
        return value ? (
          <pre className="text-xs bg-gray-100 p-1 rounded max-w-xs overflow-hidden">
            {JSON.stringify(value, null, 2)}
          </pre>
        ) : '-'

      default:
        // Обычный текст
        if (value === null || value === undefined || value === '') {
          return '-'
        }
        
        // Обрезаем длинный текст
        if (typeof value === 'string' && value.length > 50) {
          return (
            <span title={value}>
              {value.substring(0, 50)}...
            </span>
          )
        }
        
        return String(value)
    }
  }

  const hasActions = !config.readOnly && (config.actions || onEdit)
  const allSelected = data.length > 0 && selectedIds.length === data.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          {/* Чекбокс для выбора всех */}
          {!config.readOnly && (
            <Table.Head className="w-8">
              <Table.Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </Table.Head>
          )}

          {/* Колонки */}
          {config.columns.map((column) => (
            <Table.Head
              key={column.key}
              className={column.width}
              sortable={column.sortable}
              onSort={() => column.sortable && onSort(column.key)}
              sortDirection={sortField === column.key ? sortDirection : null}
            >
              {column.label}
            </Table.Head>
          ))}

          {/* Колонка действий */}
          {hasActions && (
            <Table.Head className="w-20">
              Действия
            </Table.Head>
          )}
        </Table.Row>
      </Table.Header>

      <Table.Body empty={data.length === 0} emptyMessage="Данные не найдены">
        {data.map((row) => (
          <Table.Row key={row.id}>
            {/* Чекбокс для выбора строки */}
            {!config.readOnly && (
              <Table.Cell>
                <Table.Checkbox
                  checked={selectedIds.includes(row.id)}
                  onChange={(e) => handleSelectItem(row.id, e.target.checked)}
                />
              </Table.Cell>
            )}

            {/* Ячейки данных */}
            {config.columns.map((column) => (
              <Table.Cell key={column.key} className={column.className}>
                {renderCellContent(column, row[column.key], row)}
              </Table.Cell>
            ))}

            {/* Ячейка действий */}
            {hasActions && (
              <Table.Cell>
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(row)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {config.actions && config.actions.length > 0 && (
                    <div className="relative group">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      
                      {/* Dropdown меню действий */}
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        {config.actions.map((action) => (
                          <button
                            key={action.key}
                            onClick={() => onAction && onAction(action, row)}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Table.Cell>
            )}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}