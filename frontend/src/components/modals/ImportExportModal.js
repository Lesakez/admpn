// frontend/src/components/modals/ImportExportModal.js

import React, { useState, useEffect, useMemo } from 'react'
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
  cilCode,
  cilSettings,
  cilCheck,
} from '@coreui/icons'
import ImportPanel from './panels/ImportPanel'
import ExportPanel from './panels/ExportPanel'
import PropTypes from 'prop-types'

const ImportExportModal = ({ 
  visible, 
  onClose, 
  onSuccess,
  type = 'accounts', // accounts, proxies, profiles, phones, projects
  mode = 'both', // 'import', 'export', 'both'
  selectedIds = [],
  currentFilters = {},
  title,
  size = 'xl'
}) => {
  const [activeTab, setActiveTab] = useState('import')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Конфигурация для разных типов сущностей
  const getEntityConfig = (entityType) => {
    const configs = {
      accounts: {
        title: 'Аккаунты',
        icon: cilCode,
        importFormats: [
          { value: 'login:password', label: 'Логин:Пароль', example: 'user123:pass123' },
          { value: 'email:password', label: 'Email:Пароль', example: 'user@mail.com:pass123' },
          { value: 'login:email:password', label: 'Логин:Email:Пароль', example: 'user123:user@mail.com:pass123' },
          { value: 'json', label: 'JSON формат', example: '{"login":"user123","password":"pass123"}' }
        ],
        exportFormats: ['csv', 'txt', 'json', 'xlsx'],
        service: 'accountsService'
      },
      proxies: {
        title: 'Прокси',
        icon: cilSettings,
        importFormats: [
          { value: 'ip:port', label: 'IP:Порт', example: '192.168.1.1:8080' },
          { value: 'ip:port:login:password', label: 'IP:Порт:Логин:Пароль', example: '192.168.1.1:8080:user:pass' },
          { value: 'protocol://ip:port', label: 'Протокол://IP:Порт', example: 'http://192.168.1.1:8080' }
        ],
        exportFormats: ['txt', 'csv', 'json'],
        service: 'proxiesService'
      },
      phones: {
        title: 'Устройства',
        icon: cilCloudUpload,
        importFormats: [
          { value: 'model:device', label: 'Модель:Устройство', example: 'Samsung Galaxy S21:SM-G991B' },
          { value: 'json', label: 'JSON формат', example: '{"model":"Samsung Galaxy S21","device":"SM-G991B"}' }
        ],
        exportFormats: ['csv', 'json', 'xlsx'],
        service: 'phonesService'
      },
      profiles: {
        title: 'Профили',
        icon: cilCheck,
        importFormats: [
          { value: 'name:platform', label: 'Имя:Платформа', example: 'Profile1:Facebook' },
          { value: 'json', label: 'JSON формат', example: '{"name":"Profile1","platform":"Facebook"}' }
        ],
        exportFormats: ['csv', 'json', 'xlsx'],
        service: 'profilesService'
      },
      projects: {
        title: 'Проекты',
        icon: cilSettings,
        importFormats: [
          { value: 'name:description', label: 'Название:Описание', example: 'Project1:Description text' },
          { value: 'json', label: 'JSON формат', example: '{"name":"Project1","description":"Description"}' }
        ],
        exportFormats: ['csv', 'json', 'xlsx'],
        service: 'projectsService'
      }
    }
    return configs[entityType] || configs.accounts
  }

  const entityConfig = getEntityConfig(type)

  // Определяем доступные табы на основе mode
  const availableTabs = useMemo(() => {
    const tabs = []
    if (mode === 'import' || mode === 'both') {
      tabs.push({ 
        key: 'import', 
        label: 'Импорт', 
        icon: cilCloudUpload,
        description: `Импортировать ${entityConfig.title.toLowerCase()}`
      })
    }
    if (mode === 'export' || mode === 'both') {
      tabs.push({ 
        key: 'export', 
        label: 'Экспорт', 
        icon: cilCloudDownload,
        description: `Экспортировать ${entityConfig.title.toLowerCase()}`
      })
    }
    return tabs
  }, [mode, entityConfig])

  // Устанавливаем активный таб по умолчанию
  useEffect(() => {
    if (availableTabs.length > 0) {
      const firstAvailableTab = availableTabs[0].key
      if (!availableTabs.find(t => t.key === activeTab)) {
        setActiveTab(firstAvailableTab)
      }
    }
  }, [availableTabs, activeTab])

  // Сброс состояния при открытии/закрытии модалки
  useEffect(() => {
    if (visible) {
      setError(null)
      setIsLoading(false)
    } else {
      // Сброс на первый доступный таб при закрытии
      if (availableTabs.length > 0) {
        setActiveTab(availableTabs[0].key)
      }
    }
  }, [visible, availableTabs])

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
    // Автоматически закрываем модалку после успешной операции
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
    
    const baseTitle = `${entityConfig.title}: `
    const activeTabData = availableTabs.find(t => t.key === activeTab)
    
    if (availableTabs.length === 1) {
      return baseTitle + activeTabData?.label
    }
    
    return baseTitle + 'Импорт / Экспорт'
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

  return (
    <CModal 
      visible={visible} 
      onClose={handleClose} 
      size={size}
      backdrop="static"
      className="import-export-modal"
    >
      <CModalHeader className="border-bottom">
        <div className="d-flex align-items-center">
          <div className="me-3">
            <div className="avatar avatar-lg bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center">
              <CIcon icon={entityConfig.icon} size="lg" />
            </div>
          </div>
          <div className="flex-grow-1">
            <CModalTitle className="mb-1">
              {getModalTitle()}
            </CModalTitle>
            <div className="d-flex align-items-center gap-3">
              <CBadge color="info" className="text-dark">
                {getSelectionInfo()}
              </CBadge>
              {availableTabs.length > 1 && (
                <CBadge color="light" className="text-dark">
                  {availableTabs.find(t => t.key === activeTab)?.description}
                </CBadge>
              )}
            </div>
          </div>
        </div>
      </CModalHeader>

      <CModalBody className="p-0">
        {error && (
          <div className="p-3">
            <CAlert color="danger" className="mb-0">
              <h6 className="mb-2">Ошибка</h6>
              {error}
            </CAlert>
          </div>
        )}

        {/* Навигация по табам (только если больше одного таба) */}
        {availableTabs.length > 1 && (
          <div className="border-bottom">
            <CNav variant="tabs" className="px-3">
              {availableTabs.map(tab => (
                <CNavItem key={tab.key}>
                  <CNavLink 
                    active={activeTab === tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="d-flex align-items-center gap-2"
                    disabled={isLoading}
                  >
                    <CIcon icon={tab.icon} />
                    {tab.label}
                  </CNavLink>
                </CNavItem>
              ))}
            </CNav>
          </div>
        )}

        {/* Контент табов */}
        <CTabContent className="p-0">
          {availableTabs.find(t => t.key === 'import') && activeTab === 'import' && (
            <CTabPane visible={activeTab === 'import'} className="p-0">
              <ImportPanel
                type={type}
                config={{
                  formats: entityConfig.importFormats,
                  delimiters: [
                    { value: '\n', label: 'Новая строка' },
                    { value: '\r\n', label: 'Windows (CRLF)' },
                    { value: ';', label: 'Точка с запятой' },
                    { value: ',', label: 'Запятая' }
                  ],
                  service: entityConfig.service,
                  defaultValues: {
                    format: entityConfig.importFormats[0]?.value || '',
                    delimiter: '\n'
                  }
                }}
                onSuccess={handleSuccess}
                onError={handleError}
                onLoadingChange={setIsLoading}
              />
            </CTabPane>
          )}
          
          {availableTabs.find(t => t.key === 'export') && activeTab === 'export' && (
            <CTabPane visible={activeTab === 'export'} className="p-0">
              <ExportPanel
                type={type}
                selectedIds={selectedIds}
                currentFilters={currentFilters}
                config={{
                  formats: entityConfig.exportFormats,
                  service: entityConfig.service
                }}
                onSuccess={handleSuccess}
                onError={handleError}
                onLoadingChange={setIsLoading}
              />
            </CTabPane>
          )}
        </CTabContent>

        {/* Индикатор загрузки */}
        {isLoading && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" style={{ zIndex: 1000 }}>
            <div className="text-center">
              <CSpinner color="primary" className="mb-3" />
              <div className="text-muted">
                {activeTab === 'import' ? 'Импортируем данные...' : 'Экспортируем данные...'}
              </div>
            </div>
          </div>
        )}
      </CModalBody>

      <CModalFooter className="border-top bg-light">
        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="text-muted small">
            {activeTab === 'import' ? (
              <span>Поддерживаемые форматы: {entityConfig.importFormats.map(f => f.label).join(', ')}</span>
            ) : (
              <span>Форматы экспорта: {entityConfig.exportFormats.join(', ').toUpperCase()}</span>
            )}
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