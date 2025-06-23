// frontend/src/components/common/modals/BulkActionModal.js
/**
 * МОДАЛКА МАССОВЫХ ДЕЙСТВИЙ
 * 
 * Назначение:
 * - Выполнение массовых операций над выбранными элементами
 * - Поддержка разных типов действий (удаление, изменение статуса, экспорт)
 * - Предварительный просмотр выбранных элементов
 * - Настраиваемые параметры для каждого типа действия
 * 
 * Поддерживаемые действия:
 * - delete: массовое удаление элементов
 * - status_change: изменение статуса элементов
 * - export: экспорт выбранных элементов
 * 
 * Использование:
 * <BulkActionModal
 *   visible={true}
 *   onClose={handleClose}
 *   onConfirm={handleConfirm}
 *   selectedItems={selectedItems}
 *   action="delete"
 *   entityType="accounts"
 * />
 */

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
  CAlert
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilShieldAlt, cilCheck, cilTrash, cilSettings } from '@coreui/icons'
import PropTypes from 'prop-types'

const BulkActionModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  isLoading = false,
  selectedItems = [],
  action = "delete",
  entityType = "",
  title = "Массовое действие"
}) => {
  const [selectedAction, setSelectedAction] = useState(action)
  const [actionParams, setActionParams] = useState({})

  // Конфигурация для разных типов действий
  const getActionConfig = () => {
    const configs = {
      delete: {
        title: "Массовое удаление",
        description: "Удалить выбранные элементы",
        icon: cilTrash,
        color: 'danger',
        confirmText: "Удалить все",
        warning: "Это действие нельзя отменить!"
      },
      status_change: {
        title: "Изменить статус",
        description: "Изменить статус выбранных элементов",
        icon: cilSettings,
        color: 'primary',
        confirmText: "Применить",
        warning: null
      },
      export: {
        title: "Экспорт",
        description: "Экспортировать выбранные элементы",
        icon: cilCheck,
        color: 'success',
        confirmText: "Экспортировать",
        warning: null
      }
    }
    return configs[selectedAction] || configs.delete
  }

  const config = getActionConfig()

  // Обработчик подтверждения действия
  const handleConfirm = async () => {
    if (onConfirm && typeof onConfirm === 'function') {
      try {
        const params = {
          action: selectedAction,
          items: selectedItems,
          params: actionParams
        }
        await onConfirm(params)
      } catch (error) {
        console.error('Bulk action error:', error)
      }
    }
  }

  // Получаем отображаемое название элемента
  const getItemDisplayName = (item, index) => {
    return item.name || 
           item.login || 
           item.title || 
           item.model || 
           item.ipPort || 
           `Элемент ${index + 1}`
  }

  // Доступные статусы для изменения
  const availableStatuses = [
    { value: 'active', label: 'Активный' },
    { value: 'inactive', label: 'Неактивный' },
    { value: 'banned', label: 'Заблокированный' },
    { value: 'free', label: 'Свободный' },
    { value: 'busy', label: 'Занятый' },
    { value: 'blocked', label: 'Заблокированный' },
    { value: 'error', label: 'Ошибка' }
  ]

  return (
    <CModal 
      visible={visible} 
      onClose={onClose} 
      size="md"
      backdrop="static"
      className="bulk-action-modal"
    >
      <CModalHeader className="border-bottom">
        <div className="d-flex align-items-center">
          <div className={`me-3 rounded-circle d-flex align-items-center justify-content-center bg-${config.color} bg-opacity-10`} 
               style={{ width: '48px', height: '48px' }}>
            <CIcon icon={config.icon} size="lg" className={`text-${config.color}`} />
          </div>
          <div>
            <CModalTitle className="mb-1">{title || config.title}</CModalTitle>
            <div className="text-muted small">
              Выбрано элементов: {selectedItems.length}
            </div>
          </div>
        </div>
      </CModalHeader>

      <CModalBody>
        {/* Описание действия */}
        <div className="mb-3">
          <p className="mb-2">{config.description}</p>
          {config.warning && (
            <CAlert color={config.color} className="py-2 mb-3">
              <small><strong>Внимание!</strong> {config.warning}</small>
            </CAlert>
          )}
        </div>

        {/* Параметры действия */}
        {selectedAction === "status_change" && (
          <div className="mb-3">
            <CFormLabel htmlFor="newStatus" className="fw-semibold">
              Новый статус
            </CFormLabel>
            <CFormSelect 
              id="newStatus"
              value={actionParams.newStatus || ''}
              onChange={(e) => setActionParams({...actionParams, newStatus: e.target.value})}
            >
              <option value="">Выберите статус...</option>
              {availableStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </CFormSelect>
          </div>
        )}

        {/* Список выбранных элементов */}
        {selectedItems.length > 0 && selectedItems.length <= 10 && (
          <div className="mb-3">
            <CFormLabel className="fw-semibold">Выбранные элементы:</CFormLabel>
            <CListGroup className="mt-2">
              {selectedItems.slice(0, 10).map((item, index) => (
                <CListGroupItem 
                  key={index} 
                  className="d-flex justify-content-between align-items-center py-2"
                >
                  <span className="text-truncate">
                    {getItemDisplayName(item, index)}
                  </span>
                  {item.status && (
                    <CBadge color="secondary" shape="rounded-pill">
                      {item.status}
                    </CBadge>
                  )}
                </CListGroupItem>
              ))}
            </CListGroup>
          </div>
        )}

        {/* Сообщение о большом количестве элементов */}
        {selectedItems.length > 10 && (
          <div className="text-muted small mb-3">
            <strong>Показано первые 10 элементов.</strong><br />
            И ещё {selectedItems.length - 10} элементов будут обработаны...
          </div>
        )}

        {/* Пустой список */}
        {selectedItems.length === 0 && (
          <CAlert color="warning" className="mb-0">
            Не выбрано ни одного элемента для обработки.
          </CAlert>
        )}
      </CModalBody>

      <CModalFooter className="border-top">
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
          disabled={
            isLoading || 
            selectedItems.length === 0 ||
            (selectedAction === "status_change" && !actionParams.newStatus)
          }
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

// Определение типов props
BulkActionModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  selectedItems: PropTypes.array,
  action: PropTypes.oneOf(['delete', 'status_change', 'export']),
  entityType: PropTypes.string,
  title: PropTypes.string
}

// Значения по умолчанию
BulkActionModal.defaultProps = {
  isLoading: false,
  selectedItems: [],
  action: 'delete',
  entityType: '',
  title: 'Массовое действие'
}

export default BulkActionModal