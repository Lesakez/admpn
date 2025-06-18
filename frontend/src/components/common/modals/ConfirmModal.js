// frontend/src/components/common/modals/ConfirmModal.js
import React from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle, cilWarning, cilInfo, cilX } from '@coreui/icons'

const ConfirmModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  isLoading = false,
  variant = "warning", // success, warning, danger, info
  title = "Подтверждение",
  message = "Вы уверены?",
  description = "",
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  confirmColor = "primary"
}) => {
  const getVariantConfig = () => {
    const configs = {
      success: {
        icon: cilCheckCircle,
        bgColor: 'var(--cui-success-bg-subtle)',
        color: 'var(--cui-success)'
      },
      warning: {
        icon: cilWarning,
        bgColor: 'var(--cui-warning-bg-subtle)',
        color: 'var(--cui-warning)'
      },
      danger: {
        icon: cilWarning,
        bgColor: 'var(--cui-danger-bg-subtle)',
        color: 'var(--cui-danger)'
      },
      info: {
        icon: cilInfo,
        bgColor: 'var(--cui-info-bg-subtle)',
        color: 'var(--cui-info)'
      }
    }
    return configs[variant] || configs.info
  }

  const config = getVariantConfig()

  return (
    <CModal visible={visible} onClose={onClose} size="sm" alignment="center">
      <CModalHeader className="border-0 pb-2">
        <div className="d-flex align-items-center">
          <div 
            className="me-3 rounded-circle d-flex align-items-center justify-content-center"
            style={{ 
              width: '48px', 
              height: '48px',
              backgroundColor: config.bgColor,
              color: config.color
            }}
          >
            <CIcon icon={config.icon} size="lg" />
          </div>
          <CModalTitle className="mb-0">{title}</CModalTitle>
        </div>
      </CModalHeader>
      
      <CModalBody className="pt-0">
        <p className="mb-2">{message}</p>
        {description && (
          <p className="text-body-secondary small mb-0">{description}</p>
        )}
      </CModalBody>

      <CModalFooter className="border-0 pt-0">
        <CButton 
          color="light" 
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </CButton>
        <CButton 
          color={confirmColor} 
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Обработка...
            </>
          ) : (
            confirmText
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ConfirmModal