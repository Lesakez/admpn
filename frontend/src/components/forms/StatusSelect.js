// frontend/src/components/forms/StatusSelect.js
import React from 'react'
import { CFormSelect, CSpinner, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilWarning } from '@coreui/icons'
import { useStatusOptions } from '../../hooks/useStatuses'

const StatusSelect = ({ 
  entityType, 
  value, 
  onChange, 
  disabled = false, 
  showGroups = false,
  showIcons = false,
  placeholder = "Выберите статус",
  className = "",
  ...props 
}) => {
  const { statusOptions, isLoading, error } = useStatusOptions(entityType)

  if (isLoading) {
    return (
      <div className="d-flex align-items-center">
        <CSpinner size="sm" className="me-2" />
        <span className="text-muted">Загрузка статусов...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-danger d-flex align-items-center">
        <CIcon icon={cilWarning} className="me-2" />
        <span>Ошибка загрузки статусов</span>
      </div>
    )
  }

  // Группируем статусы если нужно
  const groupedOptions = showGroups 
    ? statusOptions.reduce((groups, option) => {
        const group = option.group || 'other'
        if (!groups[group]) groups[group] = []
        groups[group].push(option)
        return groups
      }, {})
    : { all: statusOptions }

  const getStatusIcon = (status) => {
    const icons = {
      'active': '🟢',
      'inactive': '⚪',
      'banned': '🔴',
      'working': '🟡',
      'free': '🔵',
      'busy': '🟠',
      'pending': '⏳',
      'suspended': '⏸️',
      'verified': '✅',
      'unverified': '❌',
      'created': '🆕',
      'warming': '🔥',
      'ready': '✅',
      'error': '❌',
      'checking': '🔍',
      'maintenance': '🔧',
      'offline': '📴',
      'rebooting': '🔄',
      'success': '✅',
      'failed': '❌',
      'cancelled': '⚪',
      'timeout': '⏰'
    }
    return icons[status] || '⚪'
  }

  return (
    <div className={className}>
      <CFormSelect
        value={value || ''}
        onChange={onChange}
        disabled={disabled || isLoading}
        {...props}
      >
        <option value="">{placeholder}</option>
        {Object.entries(groupedOptions).map(([groupName, options]) => (
          showGroups && groupName !== 'all' ? (
            <optgroup key={groupName} label={groupName.toUpperCase().replace('_', ' ')}>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {showIcons && getStatusIcon(option.value)} {option.label}
                </option>
              ))}
            </optgroup>
          ) : (
            options.map(option => (
              <option key={option.value} value={option.value}>
                {showIcons && getStatusIcon(option.value)} {option.label}
              </option>
            ))
          )
        ))}
      </CFormSelect>
      
      {/* Показываем текущий статус как badge */}
      {value && (
        <div className="mt-2">
          <StatusBadge status={value} entityType={entityType} />
        </div>
      )}
    </div>
  )
}

// Компонент для отображения статуса как badge
export const StatusBadge = ({ status, entityType, showDescription = false }) => {
  const { getStatusBadge } = useStatusOptions(entityType)
  const badge = getStatusBadge(status)

  return (
    <CBadge color={badge.color} shape="rounded-pill">
      {badge.text}
      {showDescription && status !== badge.text && (
        <span className="ms-1 opacity-75">({status})</span>
      )}
    </CBadge>
  )
}

// Компонент для отображения группы статусов
export const StatusGroup = ({ statuses, entityType, onStatusClick }) => {
  const { statusOptions } = useStatusOptions(entityType)
  
  // Группируем статусы
  const grouped = statusOptions.reduce((groups, option) => {
    const group = option.group || 'other'
    if (!groups[group]) groups[group] = []
    groups[group].push(option)
    return groups
  }, {})

  return (
    <div className="status-groups">
      {Object.entries(grouped).map(([groupName, options]) => (
        <div key={groupName} className="mb-3">
          <h6 className="text-muted small text-uppercase fw-bold">
            {groupName.replace('_', ' ')}
          </h6>
          <div className="d-flex flex-wrap gap-2">
            {options.map(option => (
              <CBadge
                key={option.value}
                color={option.color}
                className={`cursor-pointer ${statuses?.includes(option.value) ? 'opacity-100' : 'opacity-50'}`}
                onClick={() => onStatusClick?.(option.value)}
                role="button"
              >
                {option.label}
              </CBadge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatusSelect