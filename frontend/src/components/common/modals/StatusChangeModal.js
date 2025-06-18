// frontend/src/components/common/modals/StatusChangeModal.js
import React, { useState } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormSelect,
  CFormLabel,
  CFormTextarea,
  CSpinner,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSwapHorizontal, cilCheck } from '@coreui/icons'
import { useEntityStatuses, useStatusConfig } from '../../../hooks/useStatuses'

const StatusChangeModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  isLoading = false,
  entityType,
  currentStatus,
  itemName = "",
  title = "Изменить статус"
}) => {
  const [newStatus, setNewStatus] = useState('')
  const [reason, setReason] = useState('')
  
  const { data: statuses } = useEntityStatuses(entityType)
  const { data: statusConfig } = useStatusConfig()

  const handleConfirm = () => {
    if (newStatus && newStatus !== currentStatus) {
      onConfirm(newStatus, reason)
    }
  }

  const getStatusBadge = (status) => {
    const description = statusConfig?.descriptions?.[status] || status
    const color = statusConfig?.colors?.[status] || '#6b7280'
    
    const getBootstrapColor = (hexColor) => {
      const colorMap = {
        '#10b981': 'success',
        '#ef4444': 'danger', 
        '#f59e0b': 'warning',
        '#3b82f6': 'primary',
        '#6b7280': 'secondary',
        '#059669': 'success',
        '#f97316': 'warning',
        '#8b5cf6': 'info'
      }
      return colorMap[hexColor] || 'secondary'
    }
    
    return (
      <CBadge color={getBootstrapColor(color)} shape="rounded-pill">
        {description}
      </CBadge>
    )
  }

  const getStatusOptions = () => {
    if (!statuses) return []
    
    return Object.values(statuses)
      .filter(status => status !== currentStatus)
      .map(status => ({
        value: status,
        label: statusConfig?.descriptions?.[status] || status
      }))
  }

  return (
    <CModal visible={visible} onClose={onClose} size="md">
      <CModalHeader>
        <div className="d-flex align-items-center">
          <div 
            className="me-3 rounded-circle d-flex align-items-center justify-content-center"
            style={{ 
              width: '48px', 
              height: '48px',
              backgroundColor: 'var(--cui-primary-bg-subtle)',
              color: 'var(--cui-primary)'
            }}
          >
            <CIcon icon={cilSwapHorizontal} size="lg" />
          </div>
          <CModalTitle>{title}</CModalTitle>
        </div>
      </CModalHeader>
      
      <CModalBody>
        {itemName && (
          <div className="mb-3">
            <strong>Элемент:</strong> {itemName}
          </div>
        )}
        
        <div className="mb-3">
          <CFormLabel className="fw-semibold">Текущий статус</CFormLabel>
          <div className="mt-1">
            {getStatusBadge(currentStatus)}
          </div>
        </div>

        <div className="mb-3">
          <CFormLabel htmlFor="newStatus" className="fw-semibold">
            Новый статус *
          </CFormLabel>
          <CFormSelect
            id="newStatus"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            <option value="">Выберите новый статус</option>
            {getStatusOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </CFormSelect>
        </div>

        <div className="mb-3">
          <CFormLabel htmlFor="reason" className="fw-semibold">
            Причина изменения (необязательно)
          </CFormLabel>
          <CFormTextarea
            id="reason"
            rows={3}
            placeholder="Опишите причину изменения статуса..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {newStatus && (
          <div className="p-3 rounded border">
            <div className="d-flex align-items-center justify-content-between">
              <span>Изменение:</span>
              <div className="d-flex align-items-center gap-2">
                {getStatusBadge(currentStatus)}
                <CIcon icon={cilSwapHorizontal} />
                {getStatusBadge(newStatus)}
              </div>
            </div>
          </div>
        )}
      </CModalBody>

      <CModalFooter>
        <CButton 
          color="light" 
          onClick={onClose}
          disabled={isLoading}
        >
          Отмена
        </CButton>
        <CButton 
          color="primary" 
          onClick={handleConfirm}
          disabled={isLoading || !newStatus || newStatus === currentStatus}
        >
          {isLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Изменение...
            </>
          ) : (
            <>
              <CIcon icon={cilCheck} className="me-2" />
              Изменить статус
            </>
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default StatusChangeModal