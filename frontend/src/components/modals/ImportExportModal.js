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
      <CModal visible={visible} onClose={handleClose} size="lg">
        <CModalBody className="text-center py-5">
          <CSpinner color="primary" className="mb-3" />
          <div>Загрузка конфигурации...</div>
        </CModalBody>
      </CModal>
    )
  }

  if (error) {
    return (
      <CModal visible={visible} onClose={handleClose} size="lg">
        <CModalHeader>
          <CModalTitle>Ошибка</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CAlert color="danger">
            Не удалось загрузить конфигурацию: {error.message}
          </CAlert>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleClose}>
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
      className="epic-modal"
    >
      <CModalHeader>
        <CModalTitle>
          {config?.title || `${activeTab === 'import' ? 'Импорт' : 'Экспорт'} ${type}`}
        </CModalTitle>
      </CModalHeader>

      <CModalBody className="p-0">
        <div className="form-layout">
          {/* Табы если доступны оба режима */}
          {availableTabs.length > 1 && (
            <div className="form-layout__tabs">
              <CNav variant="tabs" className="modern-tabs">
                {availableTabs.map(tab => (
                  <CNavItem key={tab.key}>
                    <CNavLink
                      active={activeTab === tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      style={{ cursor: 'pointer' }}
                    >
                      <CIcon icon={tab.icon} className="me-2" />
                      {tab.label}
                    </CNavLink>
                  </CNavItem>
                ))}
              </CNav>
            </div>
          )}

          {/* Контент */}
          <div className="form-layout__content">
            <CTabContent>
              {availableTabs.find(t => t.key === 'import') && (
                <CTabPane visible={activeTab === 'import'}>
                  <ImportPanel
                    config={config?.import}
                    type={type}
                    onSuccess={handleSuccess}
                  />
                </CTabPane>
              )}
              
              {availableTabs.find(t => t.key === 'export') && (
                <CTabPane visible={activeTab === 'export'}>
                  <ExportPanel
                    config={config?.export}
                    type={type}
                    onSuccess={handleSuccess}
                  />
                </CTabPane>
              )}
            </CTabContent>
          </div>
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" onClick={handleClose}>
          <CIcon icon={cilX} className="me-2" />
          Закрыть
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ImportExportModal