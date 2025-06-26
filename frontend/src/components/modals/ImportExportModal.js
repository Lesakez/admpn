import React, { useState, useEffect } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
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
        <CAlert color="danger" className="modal-error m-3">
          <div className="error-title">Произошла ошибка</div>
          <div className="error-message">{this.state.error?.message || 'Неизвестная ошибка'}</div>
          <button
            className="btn btn-link"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Попробовать снова
          </button>
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
  const [activeTab, setActiveTab] = useState('export') // Начинаем с экспорта
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
      setActiveTab('export') // default для 'both' - начинаем с экспорта
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

    // Автоматически закрываем через 3 секунды
    setTimeout(() => {
      handleClose()
    }, 3000)
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
      className="export-modal"
    >
      <CModalHeader closeButton>
        <CModalTitle className="modal-title">
          <CIcon
            icon={activeTab === 'import' ? cilCloudUpload : cilCloudDownload}
          />
          {getModalTitle()}
          {successMessage && (
            <CBadge color="success" className="ms-2">
              <CIcon icon={cilCheck} size="sm" className="me-1" />
              Готово
            </CBadge>
          )}
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        {/* Сообщения об ошибках и успехе */}
        {error && (
          <CAlert color="danger" dismissible onClose={() => setError(null)}>
            {error}
          </CAlert>
        )}

        {successMessage && (
          <CAlert color="success" dismissible onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </CAlert>
        )}

        {/* Табы - только если нужны оба режима */}
        {mode === 'both' && (
          <CNav variant="tabs" className="mb-0">
            {showExportTab && (
              <CNavItem>
                <CNavLink
                  active={activeTab === 'export'}
                  onClick={() => setActiveTab('export')}
                  style={{ cursor: 'pointer' }}
                >
                  <CIcon icon={cilCloudDownload} className="me-2" />
                  Экспорт
                </CNavLink>
              </CNavItem>
            )}
            {showImportTab && (
              <CNavItem>
                <CNavLink
                  active={activeTab === 'import'}
                  onClick={() => setActiveTab('import')}
                  style={{ cursor: 'pointer' }}
                >
                  <CIcon icon={cilCloudUpload} className="me-2" />
                  Импорт
                </CNavLink>
              </CNavItem>
            )}
          </CNav>
        )}

        {/* Контент табов */}
        <CTabContent>
          {showImportTab && (
            <CTabPane
              className={`tab-pane ${activeTab === 'import' ? 'active' : ''}`}
              visible={activeTab === 'import'}
            >
              <ErrorBoundary>
                <ImportPanel
                  type={type}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  onLoadingChange={handleLoadingChange}
                />
              </ErrorBoundary>
            </CTabPane>
          )}

          {showExportTab && (
            <CTabPane
              className={`tab-pane ${activeTab === 'export' ? 'active' : ''}`}
              visible={activeTab === 'export'}
            >
              <ErrorBoundary>
                <ExportPanel
                  type={type}
                  selectedIds={selectedIds}
                  currentFilters={currentFilters}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  onLoadingChange={handleLoadingChange}
                />
              </ErrorBoundary>
            </CTabPane>
          )}
        </CTabContent>
      </CModalBody>

      {/* Убираем CModalFooter полностью - только крестик для закрытия */}
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