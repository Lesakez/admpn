// frontend/src/components/common/modals/DeleteModal.js
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
import { cilTrash, cilX, cilWarning } from '@coreui/icons'

const DeleteModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  isLoading = false,
  title = "Подтверждение удаления",
  message = "Вы уверены, что хотите удалить этот элемент?",
  itemName = "",
  description = "Это действие нельзя отменить.",
  confirmText = "Удалить",
  cancelText = "Отмена"
}) => {
  return (
    <CModal visible={visible} onClose={onClose} size="sm" alignment="center">
      <CModalHeader className="border-0 pb-2">
        <div className="d-flex align-items-center">
          <div 
            className="me-3 rounded-circle d-flex align-items-center justify-content-center"
            style={{ 
              width: '48px', 
              height: '48px',
              backgroundColor: 'var(--cui-danger-bg-subtle)',
              color: 'var(--cui-danger)'
            }}
          >
            <CIcon icon={cilWarning} size="lg" />
          </div>
          <CModalTitle className="mb-0">{title}</CModalTitle>
        </div>
      </CModalHeader>
      
      <CModalBody className="pt-0">
        <p className="mb-2">
          {message}
          {itemName && (
            <strong className="d-block mt-1 text-danger">"{itemName}"</strong>
          )}
        </p>
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
          color="danger" 
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Удаление...
            </>
          ) : (
            <>
              <CIcon icon={cilTrash} className="me-2" />
              {confirmText}
            </>
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default DeleteModal