// frontend/src/components/modals/ImportExportModal.js
import React, { useState, useEffect, useMemo } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudUpload,
  cilCloudDownload,
  cilX,
} from '@coreui/icons'
import ImportPanel from './panels/ImportPanel'
import ExportPanel from './panels/ExportPanel'
import { useImportExportConfig } from '../../hooks/useImportExportConfig'

const ImportExportModal = ({ 
  visible, 
  onClose, 
  onSuccess,
  type = 'accounts', // accounts, proxies, profiles, etc.
  mode = 'both' // 'import', 'export', 'both'
}) => {
  const [activeTab, setActiveTab] = useState('import')
  const { config, isLoading, error } = useImportExportConfig(type)

  // Определяем доступные табы на основе mode
  const availableTabs = useMemo(() => {
    const tabs = []
    if (mode === 'import' || mode === 'both') {
      tabs.push({ key: 'import', label: 'Импорт', icon: cilCloudUpload })
    }
    if (mode === 'export' || mode === 'both') {
      tabs.push({ key: 'export', label: 'Экспорт', icon: cilCloudDownload })
    }
    return tabs
  }, [mode])

  // Устанавливаем активный таб по умолчанию
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(t => t.key === activeTab)) {
      setActiveTab(availableTabs[0].key)
    }
  }, [availableTabs, activeTab])

  const handleClose = () => {
    setActiveTab(mode === 'export' ? 'export' : 'import')
    onClose()
  }

  const handleSuccess = (result) => {
    onSuccess?.(result, activeTab, type)
  }

  if (isLoading) {
    return (
      <CModal 
        visible={visible} 
        onClose={handleClose} 
        size="lg"
        className="ultra-modal"
        backdrop="static"
      >
        <CModalBody className="loading-state">
          <div className="loading-content">
            <div className="loading-animation">
              <CSpinner color="primary" className="spinner-lg" />
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <h4>Загрузка конфигурации</h4>
            <p>Подготавливаем всё необходимое для работы...</p>
          </div>
        </CModalBody>
      </CModal>
    )
  }

  if (error) {
    return (
      <CModal 
        visible={visible} 
        onClose={handleClose} 
        size="lg"
        className="ultra-modal"
      >
        <CModalHeader className="error-header">
          <CModalTitle>
            <CIcon icon={cilX} className="me-2" />
            Ошибка загрузки
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="error-content">
          <div className="error-illustration">
            <div className="error-icon">⚠️</div>
            <h4>Что-то пошло не так</h4>
            <p>Не удалось загрузить конфигурацию: {error.message}</p>
          </div>
        </CModalBody>
        <CModalFooter className="error-footer">
          <CButton color="secondary" onClick={handleClose} className="modern-btn">
            <CIcon icon={cilX} className="me-2" />
            Закрыть
          </CButton>
        </CModalFooter>
      </CModal>
    )
  }

  return (
    <CModal
      visible={visible}
      onClose={handleClose}
      size="xl"
      className="ultra-modal"
      backdrop="static"
    >
      <CModalHeader className="ultra-header">
        <CModalTitle className="ultra-title">
          <div className="title-icon">
            <CIcon icon={activeTab === 'import' ? cilCloudUpload : cilCloudDownload} />
          </div>
          <div className="title-content">
            <h3>{config?.title || `${activeTab === 'import' ? 'Импорт' : 'Экспорт'} ${type}`}</h3>
            {config?.description && (
              <p>{config.description}</p>
            )}
          </div>
        </CModalTitle>
      </CModalHeader>

      <CModalBody className="ultra-body">
        <div className="ultra-layout">
          {/* Современные табы если доступны оба режима */}
          {availableTabs.length > 1 && (
            <div className="ultra-tabs">
              <div className="tabs-container">
                {availableTabs.map(tab => (
                  <button
                    key={tab.key}
                    className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <div className="tab-icon">
                      <CIcon icon={tab.icon} />
                    </div>
                    <span className="tab-label">{tab.label}</span>
                    <div className="tab-indicator"></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Контент с крутой анимацией */}
          <div className="ultra-content">
            <div className={`content-panel ${activeTab === 'import' ? 'import-panel' : 'export-panel'}`}>
              {availableTabs.find(t => t.key === 'import') && activeTab === 'import' && (
                <ImportPanel
                  config={config?.import}
                  type={type}
                  onSuccess={handleSuccess}
                />
              )}
              
              {availableTabs.find(t => t.key === 'export') && activeTab === 'export' && (
                <ExportPanel
                  config={config?.export}
                  type={type}
                  onSuccess={handleSuccess}
                />
              )}
            </div>
          </div>
        </div>
      </CModalBody>

      <CModalFooter className="ultra-footer">
        <CButton color="secondary" onClick={handleClose} className="modern-btn">
          <CIcon icon={cilX} className="me-2" />
          Закрыть
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ImportExportModal