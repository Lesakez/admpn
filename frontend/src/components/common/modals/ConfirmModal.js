// frontend/src/components/common/modals/ConfirmModal.js
/**
 * УНИВЕРСАЛЬНАЯ МОДАЛКА ПОДТВЕРЖДЕНИЯ
 * 
 * Назначение:
 * - Подтверждение любых действий пользователя
 * - Поддержка разных типов действий (удаление, изменение, предупреждение)
 * - Настраиваемые кнопки и сообщения
 * - Автоматическая блокировка во время выполнения действия
 * - Поддержка клавиатурной навигации (ESC, Enter)
 * 
 * Типы действий:
 * - success: успешные операции (зеленый)
 * - warning: предупреждения (желтый)
 * - danger: опасные действия (красный)
 * - info: информационные (синий)
 * - delete: удаление (красный с иконкой корзины)
 * - edit: редактирование (синий с иконкой карандаша)
 * 
 * Использование:
 * <ConfirmModal
 *   visible={showConfirm}
 *   onClose={handleClose}
 *   onConfirm={handleConfirm}
 *   variant="danger"
 *   title="Удаление записи"
 *   message="Вы уверены, что хотите удалить эту запись?"
 *   confirmText="Удалить"
 *   cancelText="Отмена"
 * />
 */

import React, { useEffect, useRef } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
  CAlert
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCheckCircle,
  cilWarning,
  cilXCircle,
  cilInfo,
  cilTrash,
  cilPencil,
  cilShieldAlt,
  cilCheck,
  cilX
} from '@coreui/icons'
import PropTypes from 'prop-types'

const ConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  title = "Подтверждение действия",
  message,
  description = null,
  variant = 'warning',
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  isLoading = false,
  size = 'sm',
  showCancel = true,
  showIcon = true,
  children = null,
  className = '',
  autoFocus = 'cancel', // 'cancel' | 'confirm' | null
  isDangerous = false, // Для критичных действий - дополнительное выделение
  keyboard = true
}) => {
  // Конфигурация для разных типов модалок
  const variantConfigs = {
    success: {
      icon: cilCheckCircle,
      headerColor: 'success',
      confirmColor: 'success',
      iconColor: 'text-success',
      bgColor: 'success'
    },
    warning: {
      icon: cilWarning,
      headerColor: 'warning',
      confirmColor: 'warning',
      iconColor: 'text-warning',
      bgColor: 'warning'
    },
    danger: {
      icon: cilXCircle,
      headerColor: 'danger',
      confirmColor: 'danger',
      iconColor: 'text-danger',
      bgColor: 'danger'
    },
    info: {
      icon: cilInfo,
      headerColor: 'info',
      confirmColor: 'info',
      iconColor: 'text-info',
      bgColor: 'info'
    },
    delete: {
      icon: cilTrash,
      headerColor: 'danger',
      confirmColor: 'danger',
      iconColor: 'text-danger',
      bgColor: 'danger'
    },
    edit: {
      icon: cilPencil,
      headerColor: 'primary',
      confirmColor: 'primary',
      iconColor: 'text-primary',
      bgColor: 'primary'
    },
    security: {
      icon: cilShieldAlt,
      headerColor: 'warning',
      confirmColor: 'warning',
      iconColor: 'text-warning',
      bgColor: 'warning'
    }
  }

  // Получаем конфигурацию для текущего варианта
  const config = variantConfigs[variant] || variantConfigs.warning

  // Refs для автофокуса
  const cancelButtonRef = useRef(null)
  const confirmButtonRef = useRef(null)

  // Обработчик подтверждения действия
  const handleConfirm = async () => {
    if (onConfirm && typeof onConfirm === 'function') {
      try {
        await onConfirm()
      } catch (error) {
        console.error('Confirm action error:', error)
        // Модалка остается открытой при ошибке
      }
    }
  }

  // Обработчик закрытия
  const handleClose = () => {
    if (!isLoading && onClose) {
      onClose()
    }
  }

  // Эффект для автофокуса
  useEffect(() => {
    if (visible && autoFocus && !isLoading) {
      const timer = setTimeout(() => {
        if (autoFocus === 'cancel' && cancelButtonRef.current) {
          cancelButtonRef.current.focus()
        } else if (autoFocus === 'confirm' && confirmButtonRef.current) {
          confirmButtonRef.current.focus()
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [visible, autoFocus, isLoading])

  // Обработчик клавиш
  useEffect(() => {
    if (!visible || !keyboard) return

    const handleKeyDown = (event) => {
      // ESC - закрытие модалки
      if (event.key === 'Escape' && !isLoading) {
        event.preventDefault()
        handleClose()
      }
      
      // Enter - подтверждение (только если фокус на кнопке подтверждения)
      if (event.key === 'Enter' && document.activeElement === confirmButtonRef.current) {
        event.preventDefault()
        handleConfirm()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, keyboard, isLoading])

  // Формируем CSS классы
  const modalClasses = [
    'confirm-modal',
    `confirm-modal--${variant}`,
    isDangerous ? 'confirm-modal--dangerous' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <CModal
      visible={visible}
      onClose={handleClose}
      size={size}
      backdrop={isLoading ? 'static' : true}
      keyboard={keyboard && !isLoading}
      className={modalClasses}
      alignment="center"
    >
      <CModalHeader
        className={`border-bottom-0 pb-2 bg-${config.bgColor} bg-opacity-10`}
        closeButton={!isLoading}
      >
        <CModalTitle className="d-flex align-items-center">
          {showIcon && (
            <div className={`me-3 ${config.iconColor}`}>
              <CIcon icon={config.icon} size="lg" />
            </div>
          )}
          <div>
            <span className="fw-bold">{title}</span>
            {isDangerous && (
              <div className="small text-danger mt-1">
                <CIcon icon={cilWarning} className="me-1" />
                Это действие нельзя отменить
              </div>
            )}
          </div>
        </CModalTitle>
      </CModalHeader>

      <CModalBody className="text-center py-4">
        {/* Основное сообщение */}
        {message && (
          <div className="mb-3">
            <p className="mb-0 fs-6">{message}</p>
          </div>
        )}

        {/* Дополнительное описание */}
        {description && (
          <div className="mb-3">
            <CAlert 
              color={config.bgColor} 
              className="border-0 py-2 small text-start"
            >
              {description}
            </CAlert>
          </div>
        )}

        {/* Кастомное содержимое */}
        {children && (
          <div className="mb-3">
            {children}
          </div>
        )}

        {/* Предупреждение для опасных действий */}
        {isDangerous && (
          <div className="mb-3">
            <CAlert color="danger" className="border-0 py-2 small">
              <strong>Внимание!</strong> Это действие нельзя отменить. 
              Убедитесь, что вы действительно хотите продолжить.
            </CAlert>
          </div>
        )}
      </CModalBody>

      <CModalFooter className="border-top-0 pt-2 justify-content-center">
        <div className="d-flex gap-3">
          {/* Кнопка отмены */}
          {showCancel && (
            <CButton
              ref={cancelButtonRef}
              color="light"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4"
            >
              <CIcon icon={cilX} className="me-2" />
              {cancelText}
            </CButton>
          )}

          {/* Кнопка подтверждения */}
          <CButton
            ref={confirmButtonRef}
            color={config.confirmColor}
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 ${isDangerous ? 'fw-bold' : ''}`}
          >
            {isLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Выполнение...
              </>
            ) : (
              <>
                <CIcon 
                  icon={variant === 'delete' ? cilTrash : cilCheck} 
                  className="me-2" 
                />
                {confirmText}
              </>
            )}
          </CButton>
        </div>
      </CModalFooter>
    </CModal>
  )
}

// Определение типов props
ConfirmModal.propTypes = {
  // Основные props
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  
  // Содержимое
  title: PropTypes.string,
  message: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node,
  
  // Настройки внешнего вида
  variant: PropTypes.oneOf([
    'success', 
    'warning', 
    'danger', 
    'info', 
    'delete', 
    'edit', 
    'security'
  ]),
  size: PropTypes.oneOf(['sm', 'lg', 'xl']),
  showIcon: PropTypes.bool,
  isDangerous: PropTypes.bool,
  
  // Кнопки
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  showCancel: PropTypes.bool,
  
  // Поведение
  isLoading: PropTypes.bool,
  autoFocus: PropTypes.oneOf(['cancel', 'confirm', null]),
  keyboard: PropTypes.bool,
  
  // Стилизация
  className: PropTypes.string
}

// Значения по умолчанию
ConfirmModal.defaultProps = {
  title: "Подтверждение действия",
  message: null,
  description: null,
  children: null,
  variant: 'warning',
  size: 'sm',
  showIcon: true,
  isDangerous: false,
  confirmText: "Подтвердить",
  cancelText: "Отмена",
  showCancel: true,
  isLoading: false,
  autoFocus: 'cancel',
  keyboard: true,
  className: ''
}

export default ConfirmModal