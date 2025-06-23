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

const ImportExportModal = ({ 
  visible, 
  onClose, 
  onSuccess,
  type = 'accounts',
  mode = 'both',
  selectedIds = [],
  currentFilters = {},
  title,
  size = 'xl'
}) => {
  const [activeTab, setActiveTab] = useState('import')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

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

  // Сброс состояния при открытии/закрытии модалки
  useEffect(() => {
    if (visible) {
      setError(null)
      setIsLoading(false)
    }
  }, [visible])

  const handleClose = () => {
    setError(null)
    setIsLoading(false)
    onClose()
  }

  const handleSuccess = (result) => {
    setIsLoading(false)
    if (onSuccess) {
      onSuccess(result)
    }
    setTimeout(() => {
      handleClose()
    }, 1500)
  }

  const handleError = (error) => {
    setError(error.message || 'Произошла ошибка')
    setIsLoading(false)
  }

  const getModalTitle = () => {
    if (title) return title
    
    const typeNames = {
      accounts: 'Аккаунты',
      proxies: 'Прокси', 
      profiles: 'Профили',
      phones: 'Телефоны',
      projects: 'Проекты'
    }
    
    const entityName = typeNames[type] || 'Данные'
    
    if (mode === 'import') return `Импорт ${entityName.toLowerCase()}`
    if (mode === 'export') return `Экспорт ${entityName.toLowerCase()}`
    
    return `${entityName}: Импорт / Экспорт`
  }

  const getSelectionInfo = () => {
    if (selectedIds.length > 0) {
      return `Выбрано элементов: ${selectedIds.length}`
    }
    
    const filterCount = Object.values(currentFilters).filter(Boolean).length
    if (filterCount > 0) {
      return `Применено фильтров: ${filterCount}`
    }
    
    return 'Все элементы'
  }

  // Определяем доступные табы
  const showImportTab = mode === 'both' || mode === 'import'
  const showExportTab = mode === 'both' || mode === 'export'

  return (
    <CModal 
      visible={visible} 
      onClose={handleClose} 
      size={size}
      backdrop="static"
      className="import-export-modal"
    >
      <CModalHeader className="border-bottom">
        <div className="d-flex align-items-center justify-content-between w-100">
          <CModalTitle className="d-flex align-items-center">
            <CIcon 
              icon={activeTab === 'import' ? cilCloudUpload : cilCloudDownload} 
              className="me-2" 
            />
            {getModalTitle()}
            {selectedIds.length > 0 && (
              <CBadge color="primary" className="ms-2">
                {selectedIds.length}
              </CBadge>
            )}
          </CModalTitle>
        </div>
      </CModalHeader>

      <CModalBody className="p-0">
        {error && (
          <CAlert color="danger" className="m-3 mb-0">
            {error}
          </CAlert>
        )}

        {/* Табы только если режим 'both' */}
        {mode === 'both' && (
          <CNav variant="tabs" className="border-bottom">
            {showImportTab && (
              <CNavItem>
                <CNavLink
                  active={activeTab === 'import'}
                  onClick={() => setActiveTab('import')}
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
                  className="d-flex align-items-center"
                >
                  <CIcon icon={cilCloudDownload} className="me-2" />
                  Экспорт
                </CNavLink>
              </CNavItem>
            )}
          </CNav>
        )}

        <CTabContent>
          {/* Import Tab */}
          {showImportTab && (
            <CTabPane visible={activeTab === 'import'}>
              <div className="p-3">
                <ImportPanel
                  type={type}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  onLoadingChange={setIsLoading}
                />
              </div>
            </CTabPane>
          )}

          {/* Export Tab */}
          {showExportTab && (
            <CTabPane visible={activeTab === 'export'}>
              <div className="p-3">
                <ExportPanel
                  type={type}
                  selectedIds={selectedIds}
                  currentFilters={currentFilters}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  onLoadingChange={setIsLoading}
                />
              </div>
            </CTabPane>
          )}
        </CTabContent>
      </CModalBody>

      <CModalFooter className="border-top">
        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="text-muted small">
            {getSelectionInfo()}
          </div>
          <CButton 
            color="light" 
            onClick={handleClose}
            disabled={isLoading}
            className="px-4"
          >
            <CIcon icon={cilX} className="me-2" />
            {isLoading ? 'Отменить' : 'Закрыть'}
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
  selectedIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  currentFilters: PropTypes.object,
  title: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'lg', 'xl'])
}

ImportExportModal.defaultProps = {
  onSuccess: null,
  type: 'accounts',
  mode: 'both',
  selectedIds: [],
  currentFilters: {},
  title: null,
  size: 'xl'
}

export default ImportExportModal