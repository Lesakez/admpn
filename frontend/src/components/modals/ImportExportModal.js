// frontend/src/components/modals/ImportExportModal.js
import React, { useState, useEffect } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
  CAlert,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudUpload,
  cilCloudDownload,
  cilX,
  cilCheck,
} from '@coreui/icons'
import ImportPanel from './panels/ImportPanel'
import ExportPanel from './panels/ExportPanel'
import PropTypes from 'prop-types'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <CAlert color="danger" className="m-3">
          Произошла ошибка: {this.state.error?.message || 'Неизвестная ошибка'}
          <CButton
            color="link"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Попробовать снова
          </CButton>
        </CAlert>
      )
    }
    return this.props.children
  }
}

const ImportExportModal = ({
  visible,
  onClose,
  onSuccess,
  type = 'accounts',
  mode = 'both',
  selectedIds = [],
  currentFilters = {},
  title,
  size = 'xl',
}) => {
  const [activeTab, setActiveTab] = useState('import')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Устанавливаем активный таб по умолчанию
  useEffect(() => {
    if (mode === 'import') {
      setActiveTab('import')
    } else if (mode === 'export') {
      setActiveTab('export')
    } else {
      setActiveTab('import') // default для 'both'
    }
  }, [mode])

  // Сброс состояния при открытии/закрытии модалки и смене вкладки
  useEffect(() => {
    if (visible) {
      setError(null)
      setSuccessMessage(null)
      setIsLoading(false)
    }
  }, [visible, activeTab])

  const handleClose = () => {
    setError(null)
    setSuccessMessage(null)
    setIsLoading(false)
    onClose()
  }

  const handleSuccess = (result) => {
    setIsLoading(false)
    setError(null)

    // Показываем сообщение об успехе
    if (result.type === 'import') {
      setSuccessMessage(
        `Импорт завершен: обработано ${result.processed || 0} записей, создано ${
          result.created || 0
        }, обновлено ${result.updated || 0}`,
      )
    } else if (result.type === 'export') {
      setSuccessMessage(
        `Экспорт завершен: файл ${result.filename} (${
          result.recordCount || 0
        } записей)`,
      )
    }

    if (onSuccess) {
      onSuccess(result)
    }

    // Автоматически закрываем через 2 секунды
    setTimeout(() => {
      handleClose()
    }, 2000)
  }

  const handleError = (error) => {
    setError(error.message || error || 'Произошла ошибка')
    setIsLoading(false)
  }

  const handleLoadingChange = (loading) => {
    setIsLoading(loading)
  }

  const getModalTitle = () => {
    if (title) return title

    const typeNames = {
      accounts: 'аккаунтов',
      proxies: 'прокси',
      profiles: 'профилей',
      phones: 'телефонов',
      projects: 'проектов',
    }

    const entityName = typeNames[type] || 'данных'

    if (mode === 'import') return `Импорт ${entityName}`
    if (mode === 'export') return `Экспорт ${entityName}`
    return `Импорт/Экспорт ${entityName}`
  }

  const showImportTab = mode === 'both' || mode === 'import'
  const showExportTab = mode === 'both' || mode === 'export'

  return (
    <CModal
      visible={visible}
      onClose={handleClose}
      size={size}
      backdrop="static"
      scrollable
      className="import-export-modal"
    >
      <CModalHeader>
        <CModalTitle className="d-flex align-items-center">
          <CIcon
            icon={activeTab === 'import' ? cilCloudUpload : cilCloudDownload}
            className="me-2"
            size="lg"
          />
          {getModalTitle()}
          {selectedIds.length > 0 && (
            <CBadge color="primary" className="ms-2">
              {selectedIds.length} выбрано
            </CBadge>
          )}
        </CModalTitle>
      </CModalHeader>

      <CModalBody className="p-0">
        {/* Success Message */}
        {successMessage && (
          <CAlert color="success" className="m-3 mb-0">
            <CIcon icon={cilCheck} className="me-2" />
            {successMessage}
          </CAlert>
        )}

        {/* Error Message */}
        {error && (
          <CAlert color="danger" className="m-3 mb-0">
            {error}
          </CAlert>
        )}

        {/* Tabs for both modes */}
        {mode === 'both' && (
          <div className="border-bottom">
            <CNav variant="tabs" className="px-3">
              {showImportTab && (
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'import'}
                    onClick={() => setActiveTab('import')}
                    disabled={isLoading}
                    className="d-flex align-items-center"
                  >
                    <CIcon icon={cilCloudUpload} className="me-2" />
                    Импорт
                  </CNavLink>
                </CNavItem>
              )}
              {showExportTab && (
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'export'}
                    onClick={() => setActiveTab('export')}
                    disabled={isLoading}
                    className="d-flex align-items-center"
                  >
                    <CIcon icon={cilCloudDownload} className="me-2" />
                    Экспорт
                  </CNavLink>
                </CNavItem>
              )}
            </CNav>
          </div>
        )}

        {/* Tab Content */}
        <CTabContent className="p-3">
          {/* Import Panel */}
          {showImportTab && activeTab === 'import' && (
            <CTabPane>
              <ErrorBoundary>
                <ImportPanel
                  type={type}
                  onSuccess={(result) => handleSuccess({ ...result, type: 'import' })}
                  onError={handleError}
                  onLoadingChange={handleLoadingChange}
                />
              </ErrorBoundary>
            </CTabPane>
          )}

          {/* Export Panel */}
          {showExportTab && activeTab === 'export' && (
            <CTabPane>
              <ErrorBoundary>
                <ExportPanel
                  type={type}
                  selectedIds={selectedIds}
                  currentFilters={currentFilters}
                  onSuccess={(result) => handleSuccess({ ...result, type: 'export' })}
                  onError={handleError}
                  onLoadingChange={handleLoadingChange}
                />
              </ErrorBoundary>
            </CTabPane>
          )}
        </CTabContent>
      </CModalBody>

      <CModalFooter className="border-top-0">
        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="text-muted small">
            {activeTab === 'import' && 'Поддерживаются форматы: TXT, CSV, JSON'}
            {activeTab === 'export' && 'Выберите формат и поля для экспорта'}
          </div>

          <CButton
            color="secondary"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Отменить
              </>
            ) : (
              'Закрыть'
            )}
          </CButton>
        </div>
      </CModalFooter>
    </CModal>
  )
}

ImportExportModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  type: PropTypes.oneOf(['accounts', 'proxies', 'profiles', 'phones', 'projects']),
  mode: PropTypes.oneOf(['import', 'export', 'both']),
  selectedIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ),
  currentFilters: PropTypes.object,
  title: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'lg', 'xl']),
}

ImportExportModal.defaultProps = {
  onSuccess: null,
  type: 'accounts',
  mode: 'both',
  selectedIds: [],
  currentFilters: {},
  title: null,
  size: 'xl',
}

export default ImportExportModal