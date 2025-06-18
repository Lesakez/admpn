// frontend/src/components/common/modals/BulkActionModal.js
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
  CSpinner,
  CListGroup,
  CListGroupItem,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLayers, cilCheck, cilTrash } from '@coreui/icons'

const BulkActionModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  isLoading = false,
  selectedItems = [],
  action = "delete", // delete, status_change, export
  entityType = "",
  title = "Массовое действие"
}) => {
  const [selectedAction, setSelectedAction] = useState(action)
  const [actionParams, setActionParams] = useState({})

  const getActionConfig = () => {
    const configs = {
      delete: {
        title: "Массовое удаление",
        description: "Удалить выбранные элементы",
        icon: cilTrash,
        color: 'danger',
        confirmText: "Удалить все"
      },
      status_change: {
        title: "Изменить статус",
        description: "Изменить статус выбранных элементов",
        icon: cilLayers,
        color: 'primary',
        confirmText: "Применить"
      },
      export: {
        title: "Экспорт",
        description: "Экспортировать выбранные элементы",
        icon: cilCheck,
        color: 'success',
        confirmText: "Экспортировать"
      }
    }
    return configs[selectedAction] || configs.delete
  }

  const config = getActionConfig()

  const handleConfirm = () => {
    onConfirm(selectedAction, actionParams)
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
              backgroundColor: `var(--cui-${config.color}-bg-subtle)`,
              color: `var(--cui-${config.color})`
            }}
          >
            <CIcon icon={config.icon} size="lg" />
          </div>
          <CModalTitle>{config.title}</CModalTitle>
        </div>
      </CModalHeader>
      
      <CModalBody>
        <div className="mb-3">
          <p>{config.description}</p>
          <div className="d-flex align-items-center gap-2">
            <span className="text-body-secondary">Выбрано элементов:</span>
            <CBadge color={config.color}>{selectedItems.length}</CBadge>
          </div>
        </div>

        {action === "status_change" && (
          <div className="mb-3">
            <CFormLabel className="fw-semibold">Новый статус</CFormLabel>
            <CFormSelect
              value={actionParams.newStatus || ''}
              onChange={(e) => setActionParams(prev => ({ ...prev, newStatus: e.target.value }))}
            >
              <option value="">Выберите статус</option>
              <option value="active">Активный</option>
              <option value="inactive">Неактивный</option>
              <option value="banned">Заблокированный</option>
            </CFormSelect>
          </div>
        )}

        {selectedItems.length > 0 && selectedItems.length <= 10 && (
          <div className="mb-3">
            <CFormLabel className="fw-semibold">Выбранные элементы:</CFormLabel>
            <CListGroup className="mt-2">
              {selectedItems.slice(0, 10).map((item, index) => (
                <CListGroupItem key={index} className="d-flex justify-content-between align-items-center py-2">
                  <span className="text-truncate">{item.name || item.login || item.title || `Элемент ${index + 1}`}</span>
                  {item.status && (
                    <CBadge color="secondary">{item.status}</CBadge>
                  )}
                </CListGroupItem>
              ))}
            </CListGroup>
          </div>
        )}

        {selectedItems.length > 10 && (
          <div className="text-body-secondary small">
            И ещё {selectedItems.length - 10} элементов...
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
          color={config.color} 
          onClick={handleConfirm}
          disabled={isLoading || (action === "status_change" && !actionParams.newStatus)}
        >
          {isLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Обработка...
            </>
          ) : (
            <>
              <CIcon icon={config.icon} className="me-2" />
              {config.confirmText}
            </>
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default BulkActionModal