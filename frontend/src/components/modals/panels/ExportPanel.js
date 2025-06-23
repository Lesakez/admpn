// frontend/src/components/modals/panels/ExportPanel.js

import React, { useState, useEffect, useCallback } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CFormSelect,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CAlert,
  CSpinner,
  CBadge,
  CRow,
  CCol,
  CButton,
  CInputGroup,
  CInputGroupText,
  CProgress,
  CProgressBar,
  CForm,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload,
  cilCheckCircle,
  cilFilter,
  cilCode,
  cilEyedropper,
  cilX,
  cilSettings,
  cilSearch,
  cilFile,
  cilTask,
  cilList,
  cilCopy,
  cilTrash,
  cilCheck,
  cilPlus,
  cilArrowTop,
  cilArrowBottom,
  cilMove,
} from '@coreui/icons'
import './ExportPanel.scss' // Подключение стилей

const ExportPanel = ({
  type = 'accounts',
  selectedIds = [],
  currentFilters = {},
  onSuccess,
  onError,
  onLoadingChange,
}) => {
  // Steps configuration
  const steps = [
    { id: 'type', label: 'Тип и фильтры', icon: cilFilter },
    { id: 'format', label: 'Формат и поля', icon: cilCode },
    { id: 'preview', label: 'Предпросмотр', icon: cilEyedropper }
  ]

  // State
  const [currentStep, setCurrentStep] = useState('type')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [notification, setNotification] = useState(null)
  
  // Server data
  const [availableFields, setAvailableFields] = useState([])
  const [fieldsLoading, setFieldsLoading] = useState(false)
  const [statusOptions, setStatusOptions] = useState([])
  const [previewData, setPreviewData] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  // Search and filters
  const [statusSearchQuery, setStatusSearchQuery] = useState('')
  const [fieldsSearchQuery, setFieldsSearchQuery] = useState('')
  
  // Selected fields for export
  const [selectedFields, setSelectedFields] = useState([])
  
  // Drag & Drop state
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  
  // Export settings
  const [settings, setSettings] = useState({
    exportType: selectedIds.length > 0 ? 'selected' : 'filtered',
    format: 'csv',
    filename: '',
    template: '{login}:{password}',
    csvDelimiter: ',',
    encoding: 'utf-8',
    includeHeader: true,
    maskPasswords: false,
    compressOutput: false,
    statusFilters: [],
    dateFrom: '',
    dateTo: '',
    searchQuery: '',
  })

  // Load status options from server
  const loadStatusOptions = async () => {
    try {
      // Способ 1: Получить из конфигурации статусов (правильный путь!)
      let response = await fetch('/api/config/statuses')
      const statusConfig = await response.json()
      
      console.log('Status config response:', statusConfig)
      
      let statusData = []
      
      if (statusConfig.success && statusConfig.data && statusConfig.data.statuses) {
        const typeUpper = type.toUpperCase()
        console.log('Looking for type:', typeUpper)
        console.log('Available types in config:', Object.keys(statusConfig.data.statuses))
        
        const statusesForType = statusConfig.data.statuses[typeUpper]
        console.log('Statuses for type:', statusesForType)
        
        if (statusesForType) {
          statusData = Object.values(statusesForType).map(status => {
            const description = statusConfig.data.descriptions[status] || status
            const color = getStatusColorFromConfig(status, statusConfig.data.colors[status])
            
            console.log(`Status: ${status}, Description: ${description}, Color: ${color}`)
            
            return {
              value: status,
              label: description,
              color: color
            }
          })
          
          console.log('Generated status data from config:', statusData)
        } else {
          console.log(`No statuses found for type ${typeUpper}`)
        }
      } else {
        console.log('Invalid status config structure')
      }
      
      // Способ 2: Fallback - получить из метаданных полей
      if (statusData.length === 0) {
        console.log('Trying fields API as fallback...')
        response = await fetch(`/api/${type}/fields`)
        const fieldsData = await response.json()
        
        if (fieldsData.success && fieldsData.data && fieldsData.data.fields && fieldsData.data.fields.status) {
          const statusField = fieldsData.data.fields.status
          if (statusField.possibleValues && Array.isArray(statusField.possibleValues)) {
            statusData = statusField.possibleValues.map(status => ({
              value: status,
              label: status.charAt(0).toUpperCase() + status.slice(1),
              color: getStatusColor(status)
            }))
            console.log('Got statuses from fields API:', statusData)
          }
        }
      }
      
      // Способ 3: Fallback - получить уникальные значения из базы
      if (statusData.length === 0) {
        console.log('No statuses from config or fields, trying to get unique values from database')
        statusData = await loadUniqueStatuses()
      }
      
      console.log('Final loaded statuses:', statusData)
      setStatusOptions(statusData)
      
    } catch (error) {
      console.error('Error loading status options:', error)
      setStatusOptions([])
    }
  }

  // Определить цвет статуса из конфигурации или fallback
  const getStatusColorFromConfig = (status, configColor) => {
    if (configColor) {
      // Преобразуем HEX в Bootstrap цвета
      const colorMap = {
        '#10b981': 'success',  // зеленый
        '#ef4444': 'danger',   // красный
        '#f59e0b': 'warning',  // оранжевый
        '#3b82f6': 'primary',  // синий
        '#6b7280': 'secondary', // серый
        '#8b5cf6': 'info',     // фиолетовый
        '#f97316': 'warning'   // оранжевый
      }
      return colorMap[configColor] || 'secondary'
    }
    
    return getStatusColor(status)
  }

  // Загрузить уникальные статусы из данных
  const loadUniqueStatuses = async () => {
    try {
      const response = await fetch(`/api/${type}?limit=1000&fields=status`)
      const data = await response.json()
      
      if (data.success && data.data) {
        const accounts = data.data.accounts || data.data.data || data.data
        const uniqueStatuses = [...new Set(accounts.map(item => item.status).filter(Boolean))]
        
        return uniqueStatuses.map(status => ({
          value: status,
          label: status.charAt(0).toUpperCase() + status.slice(1),
          color: getStatusColor(status)
        }))
      }
      
      return []
    } catch (error) {
      console.error('Error loading unique statuses:', error)
      return []
    }
  }

  // Determine status color
  const getStatusColor = (status) => {
    const colorMap = {
      'active': 'success',
      'inactive': 'secondary', 
      'banned': 'danger',
      'working': 'warning',
      'free': 'info',
      'busy': 'warning',
      'suspended': 'danger',
      'pending': 'primary',
      'verified': 'success',
      'unverified': 'secondary'
    }
    return colorMap[status] || 'secondary'
  }

  // Load fields on mount
  useEffect(() => {
    loadAvailableFields()
    loadStatusOptions()
  }, [type])

  // Notify parent about loading state
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isExporting)
    }
  }, [isExporting, onLoadingChange])

  // Load available fields from server
  const loadAvailableFields = async () => {
    setFieldsLoading(true)
    
    try {
      const response = await fetch(`/api/${type}/fields`)
      if (!response.ok) {
        throw new Error('Ошибка загрузки полей')
      }
      
      const data = await response.json()
      console.log('Fields API response:', data)
      
      let fields = []
      
      if (data.success && data.data && data.data.fields) {
        fields = Object.keys(data.data.fields).map(fieldName => ({
          name: fieldName,
          key: fieldName,
          label: data.data.fields[fieldName].name || fieldName,
          ...data.data.fields[fieldName]
        }))
      } else if (Array.isArray(data)) {
        fields = data
      } else if (data.data && Array.isArray(data.data)) {
        fields = data.data
      } else if (data.fields && Array.isArray(data.fields)) {
        fields = data.fields
      } else {
        console.warn('Fields data is not in expected format:', data)
        fields = []
      }
      
      setAvailableFields(fields)
      
      if (fields.length > 0 && selectedFields.length === 0) {
        let defaultFields = []
        
        if (data.success && data.data && data.data.categories && data.data.categories.public) {
          defaultFields = data.data.categories.public.slice(0, 6)
        } else {
          defaultFields = fields.slice(0, 5).map(field => 
            typeof field === 'string' ? field : field.name || field.key
          )
        }
        
        setSelectedFields(defaultFields)
      }
      
    } catch (error) {
      console.error('Error loading fields:', error)
      if (onError) onError(error)
      
      const fallbackFields = ['id', 'login', 'password', 'email', 'status']
      setAvailableFields(fallbackFields.map(f => ({ name: f, label: f })))
      setSelectedFields(fallbackFields)
    } finally {
      setFieldsLoading(false)
    }
  }

  // Load preview
  const loadPreview = async () => {
    setPreviewLoading(true)
    setPreviewError('')
    
    try {
      const params = new URLSearchParams({
        limit: '10',
        ...settings,
        fields: selectedFields.join(','),
        preview: 'true'
      })

      if (settings.statusFilters.length > 0) {
        settings.statusFilters.forEach(status => {
          params.append('status', status)
        })
      }

      if (settings.searchQuery) {
        params.append('search', settings.searchQuery)
      }

      if (settings.dateFrom) {
        params.append('dateFrom', settings.dateFrom)
      }

      if (settings.dateTo) {
        params.append('dateTo', settings.dateTo)
      }

      if (settings.exportType === 'selected' && selectedIds.length > 0) {
        selectedIds.forEach(id => {
          params.append('ids', id)
        })
      }

      const response = await fetch(`/api/${type}?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Ошибка загрузки предпросмотра')
      }
      
      const data = await response.json()
      setPreviewData(data.data || data)
      
    } catch (error) {
      console.error('Error loading preview:', error)
      setPreviewError(error.message)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Utility functions
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  // Update settings
  const updateSettings = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Manage fields
  const toggleField = (field) => {
    const fieldName = typeof field === 'string' ? field : field.name || field.key
    
    setSelectedFields(prev => {
      if (prev.includes(fieldName)) {
        return prev.filter(f => f !== fieldName)
      } else {
        return [...prev, fieldName]
      }
    })
  }

  const addField = (field) => {
    const fieldName = typeof field === 'string' ? field : field.name || field.key
    setSelectedFields(prev => [...prev, fieldName])
  }

  const addAllFields = () => {
    const allFieldNames = (Array.isArray(availableFields) ? availableFields : []).map(field => 
      typeof field === 'string' ? field : field.name || field.key
    )
    setSelectedFields(allFieldNames)
  }

  const clearSelectedFields = () => {
    setSelectedFields([])
  }

  const removeField = (fieldName) => {
    setSelectedFields(prev => prev.filter(f => f !== fieldName))
  }

  // Drag & Drop functionality
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newFields = [...selectedFields]
    const draggedField = newFields[draggedIndex]
    
    // Remove dragged item
    newFields.splice(draggedIndex, 1)
    
    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex
    newFields.splice(insertIndex, 0, draggedField)
    
    setSelectedFields(newFields)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const moveFieldUp = (index) => {
    if (index > 0) {
      const newFields = [...selectedFields]
      ;[newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]]
      setSelectedFields(newFields)
    }
  }

  const moveFieldDown = (index) => {
    if (index < selectedFields.length - 1) {
      const newFields = [...selectedFields]
      ;[newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]]
      setSelectedFields(newFields)
    }
  }

  // Step navigation
  const nextStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id)
      
      if (steps[currentIndex + 1].id === 'preview') {
        loadPreview()
      }
    }
  }

  const previousStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  const isStepCompleted = (stepId) => {
    const stepIndex = steps.findIndex(s => s.id === stepId)
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    return stepIndex < currentIndex
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'type':
        return settings.exportType && 
               (settings.exportType !== 'selected' || selectedIds.length > 0)
      case 'format':
        return settings.format && selectedFields.length > 0
      default:
        return false
    }
  }

  // Execute export
  const executeExport = async () => {
    if (selectedFields.length === 0) {
      showNotification('Выберите хотя бы одно поле для экспорта', 'danger')
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const exportParams = {
        format: settings.format,
        fields: selectedFields,
        filename: settings.filename || `export-${new Date().toISOString().split('T')[0]}`,
        includeHeader: settings.includeHeader,
        delimiter: settings.csvDelimiter,
        template: settings.template,
        encoding: settings.encoding,
        maskPasswords: settings.maskPasswords,
        compress: settings.compressOutput,
      }

      if (settings.statusFilters.length > 0) {
        exportParams.status = settings.statusFilters
      }
      if (settings.searchQuery) {
        exportParams.search = settings.searchQuery
      }
      if (settings.dateFrom) {
        exportParams.dateFrom = settings.dateFrom
      }
      if (settings.dateTo) {
        exportParams.dateTo = settings.dateTo
      }

      if (settings.exportType === 'selected' && selectedIds.length > 0) {
        exportParams.ids = selectedIds
      }

      let response
      
      switch (settings.format) {
        case 'csv':
          response = await fetch(`/api/${type}/export/csv?${new URLSearchParams(exportParams)}`)
          break
        case 'json':
          response = await fetch(`/api/${type}/export/json?${new URLSearchParams(exportParams)}`)
          break
        case 'txt':
          response = await fetch(`/api/${type}/export/txt?${new URLSearchParams(exportParams)}`)
          break
        default:
          response = await fetch(`/api/${type}/export/custom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exportParams)
          })
      }

      clearInterval(progressInterval)
      setExportProgress(100)

      if (!response.ok) {
        throw new Error('Ошибка экспорта')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${exportParams.filename}.${settings.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      if (onSuccess) {
        onSuccess({
          filename: `${exportParams.filename}.${settings.format}`,
          format: settings.format,
          recordCount: previewData?.total || selectedFields.length
        })
      }

      showNotification('Экспорт завершен успешно!', 'success')

    } catch (error) {
      console.error('Export error:', error)
      showNotification('Ошибка экспорта: ' + error.message, 'danger')
      if (onError) onError(error)
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  // Computed values
  const formatUpperCase = settings.format?.toUpperCase() || ''
  const today = new Date().toISOString().split('T')[0]
  const hasActiveFilters = settings.statusFilters.length > 0 || 
                         settings.dateFrom || settings.dateTo || settings.searchQuery

  const filteredStatusOptions = statusOptions.filter(status =>
    status.label.toLowerCase().includes(statusSearchQuery.toLowerCase())
  )

  const filteredFields = (Array.isArray(availableFields) ? availableFields : []).filter(field => {
    const fieldName = typeof field === 'string' ? field : field.name || field.key
    const fieldLabel = typeof field === 'string' ? field : field.label || field.name || field.key
    
    return fieldName.toLowerCase().includes(fieldsSearchQuery.toLowerCase()) ||
           fieldLabel.toLowerCase().includes(fieldsSearchQuery.toLowerCase())
  })

  return (
    <div className="export-panel">
      {notification && (
        <CAlert 
          color={notification.type} 
          dismissible 
          onClose={() => setNotification(null)}
          className="mb-4"
        >
          {notification.message}
        </CAlert>
      )}

      <div className="progress-steps mb-4">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`step ${currentStep === step.id ? 'active' : ''} ${isStepCompleted(step.id) ? 'completed' : ''}`}
          >
            <div className="step-number">
              {isStepCompleted(step.id) ? (
                <CIcon icon={cilCheckCircle} size="sm" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className="step-name">{step.label}</span>
          </div>
        ))}
      </div>

      {currentStep === 'type' && (
        <div className="step-content">
          <h5 className="mb-4">Что экспортировать?</h5>
          
          <CRow className="g-4">
            <CCol md={6}>
              <CCard>
                <CCardBody>
                  <h6>Тип экспорта</h6>
                  <div className="export-types">
                    <label className={`export-type ${settings.exportType === 'filtered' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        value="filtered"
                        checked={settings.exportType === 'filtered'}
                        onChange={(e) => updateSettings('exportType', e.target.value)}
                      />
                      <div className="content">
                        <div className="title">Фильтрованный экспорт</div>
                        <div className="description">С учетом текущих фильтров</div>
                      </div>
                    </label>

                    <label className={`export-type ${settings.exportType === 'selected' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        value="selected"
                        checked={settings.exportType === 'selected'}
                        onChange={(e) => updateSettings('exportType', e.target.value)}
                        disabled={selectedIds.length === 0}
                      />
                      <div className="content">
                        <div className="title">Выбранные записи</div>
                        <div className="description">Предварительно выбранные</div>
                      </div>
                    </label>

                    <label className={`export-type ${settings.exportType === 'all' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        value="all"
                        checked={settings.exportType === 'all'}
                        onChange={(e) => updateSettings('exportType', e.target.value)}
                      />
                      <div className="content">
                        <div className="title">Все записи</div>
                        <div className="description">Без фильтров</div>
                      </div>
                    </label>
                  </div>

                  {settings.exportType === 'selected' && (
                    <div className="mt-3">
                      <CAlert color="info">
                        <CIcon icon={cilCheckCircle} className="me-2" />
                        Выбрано записей: <strong>{selectedIds.length}</strong>
                      </CAlert>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={6}>
              <CCard>
                <CCardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6>Фильтры</h6>
                    {hasActiveFilters && (
                      <CButton
                        color="outline-secondary"
                        size="sm"
                        onClick={() => {
                          updateSettings('statusFilters', [])
                          updateSettings('dateFrom', '')
                          updateSettings('dateTo', '')
                          updateSettings('searchQuery', '')
                          setStatusSearchQuery('')
                        }}
                      >
                        Очистить
                      </CButton>
                    )}
                  </div>

                  <div className="mb-3">
                    <CFormLabel>Статусы</CFormLabel>
                    <div className="filter-search mb-2">
                      <CFormInput
                        size="sm"
                        value={statusSearchQuery}
                        onChange={(e) => setStatusSearchQuery(e.target.value)}
                        placeholder="Поиск статусов..."
                      />
                    </div>
                    <div className="status-list">
                      {filteredStatusOptions.map(status => (
                        <label key={status.value} className="status-item">
                          <CFormCheck
                            value={status.value}
                            checked={settings.statusFilters.includes(status.value)}
                            onChange={(e) => {
                              const value = e.target.value
                              updateSettings('statusFilters', 
                                e.target.checked 
                                  ? [...settings.statusFilters, value]
                                  : settings.statusFilters.filter(s => s !== value)
                              )
                            }}
                          />
                          <CBadge color={status.color} className="ms-2">
                            {status.label}
                          </CBadge>
                        </label>
                      ))}
                    </div>
                    <small className="text-muted">Выбрано: {settings.statusFilters.length}</small>
                  </div>

                  <div className="mb-3">
                    <CFormLabel>Период</CFormLabel>
                    <CRow className="g-2">
                      <CCol>
                        <CFormInput
                          type="date"
                          value={settings.dateFrom}
                          onChange={(e) => updateSettings('dateFrom', e.target.value)}
                          max={settings.dateTo || today}
                        />
                      </CCol>
                      <CCol>
                        <CFormInput
                          type="date"
                          value={settings.dateTo}
                          onChange={(e) => updateSettings('dateTo', e.target.value)}
                          min={settings.dateFrom}
                          max={today}
                        />
                      </CCol>
                    </CRow>
                  </div>

                  <div>
                    <CFormLabel>Поиск</CFormLabel>
                    <CFormInput
                      value={settings.searchQuery}
                      onChange={(e) => updateSettings('searchQuery', e.target.value)}
                      placeholder="Поиск по полям..."
                    />
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </div>
      )}

      {currentStep === 'format' && (
        <div className="step-content">
          <h5 className="mb-4">Формат и поля экспорта</h5>
          
          <CRow className="g-4">
            <CCol md={6}>
              <CCard>
                <CCardBody>
                  <h6>Формат: {formatUpperCase}</h6>
                  
                  <div className="mb-3">
                    <CFormLabel>Формат файла</CFormLabel>
                    <CFormSelect
                      value={settings.format}
                      onChange={(e) => updateSettings('format', e.target.value)}
                    >
                      <option value="csv">CSV (Excel)</option>
                      <option value="json">JSON</option>
                      <option value="txt">TXT (Текстовый)</option>
                    </CFormSelect>
                  </div>

                  {settings.format === 'csv' && (
                    <div className="mb-3">
                      <CFormLabel>Разделитель</CFormLabel>
                      <CFormSelect
                        value={settings.csvDelimiter}
                        onChange={(e) => updateSettings('csvDelimiter', e.target.value)}
                      >
                        <option value=",">Запятая (,)</option>
                        <option value=";">Точка с запятой (;)</option>
                        <option value="	">Табуляция</option>
                      </CFormSelect>
                    </div>
                  )}

                  {settings.format === 'txt' && (
                    <div className="mb-3">
                      <CFormLabel>Шаблон строки</CFormLabel>
                      <CFormTextarea
                        rows={3}
                        value={settings.template}
                        onChange={(e) => updateSettings('template', e.target.value)}
                        placeholder="{login}:{password}:{email}"
                      />
                      <small className="text-muted">
                        Используйте {'{field_name}'} для вставки полей
                      </small>
                    </div>
                  )}

                  <div className="mb-3">
                    <CFormLabel>Имя файла</CFormLabel>
                    <CInputGroup>
                      <CFormInput
                        value={settings.filename}
                        onChange={(e) => updateSettings('filename', e.target.value)}
                        placeholder={`export-${today}`}
                      />
                      <CInputGroupText>.{settings.format}</CInputGroupText>
                    </CInputGroup>
                  </div>

                  <div className="form-check mb-2">
                    <CFormCheck
                      id="includeHeader"
                      checked={settings.includeHeader}
                      onChange={(e) => updateSettings('includeHeader', e.target.checked)}
                      label="Включить заголовок"
                    />
                  </div>

                  <div className="form-check mb-2">
                    <CFormCheck
                      id="maskPasswords"
                      checked={settings.maskPasswords}
                      onChange={(e) => updateSettings('maskPasswords', e.target.checked)}
                      label="Маскировать пароли"
                    />
                  </div>

                  <div className="form-check">
                    <CFormCheck
                      id="compressOutput"
                      checked={settings.compressOutput}
                      onChange={(e) => updateSettings('compressOutput', e.target.checked)}
                      label="Сжать файл"
                    />
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={6}>
              <CCard>
                <CCardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6>Поля для экспорта</h6>
                    <div>
                      <CButton 
                        color="outline-primary" 
                        size="sm" 
                        onClick={addAllFields}
                        className="me-2"
                      >
                        Добавить все
                      </CButton>
                      <CButton 
                        color="outline-secondary" 
                        size="sm" 
                        onClick={clearSelectedFields}
                      >
                        Очистить
                      </CButton>
                    </div>
                  </div>

                  <CFormInput
                    value={fieldsSearchQuery}
                    onChange={(e) => setFieldsSearchQuery(e.target.value)}
                    placeholder="Поиск полей..."
                    className="mb-3"
                  />

                  {fieldsLoading ? (
                    <div className="text-center py-3">
                      <CSpinner size="sm" className="me-2" />
                      Загрузка полей...
                    </div>
                  ) : (
                    <div className="fields-grid mb-4">
                      <h6 className="small text-muted mb-2">Доступные поля</h6>
                      <div className="available-fields">
                        {filteredFields.map(field => {
                          const fieldName = typeof field === 'string' ? field : field.name || field.key
                          const fieldLabel = typeof field === 'string' ? field : field.label || field.name || field.key
                          const isSelected = selectedFields.includes(fieldName)
                          const canAddMore = !isSelected || selectedFields.filter(f => f === fieldName).length < 3
                          
                          return (
                            <div key={fieldName} className="field-chip-container">
                              <div
                                className={`field-chip ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleField(field)}
                              >
                                <span className="field-name">{fieldLabel}</span>
                                {isSelected && <CIcon icon={cilCheck} size="sm" />}
                              </div>
                              {canAddMore && (
                                <CButton
                                  size="sm"
                                  color="outline-primary"
                                  className="add-field-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    addField(field)
                                  }}
                                  title="Добавить еще раз"
                                >
                                  <CIcon icon={cilPlus} size="sm" />
                                </CButton>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="selected-fields">
                    <h6 className="small text-muted mb-2">
                      Выбранные поля ({selectedFields.length})
                    </h6>
                    {selectedFields.length === 0 ? (
                      <div className="text-muted text-center py-3">
                        Поля не выбраны
                      </div>
                    ) : (
                      <div className="selected-fields-list">
                        {selectedFields.map((fieldName, index) => {
                          const field = (Array.isArray(availableFields) ? availableFields : []).find(f => 
                            (typeof f === 'string' ? f : f.name || f.key) === fieldName
                          )
                          const fieldLabel = typeof field === 'string' ? field : 
                                           field?.label || field?.name || field?.key || fieldName
                          
                          return (
                            <div 
                              key={`${fieldName}-${index}`} 
                              className={`selected-field-item ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, index)}
                              onDragEnd={handleDragEnd}
                            >
                              <div className="drag-handle">
                                <CIcon icon={cilMove} size="sm" />
                              </div>
                              <span className="field-order">{index + 1}</span>
                              <span className="field-label">{fieldLabel}</span>
                              
                              <div className="field-actions">
                                <CButton
                                  size="sm"
                                  color="outline-secondary"
                                  onClick={() => moveFieldUp(index)}
                                  disabled={index === 0}
                                  title="Переместить вверх"
                                >
                                  <CIcon icon={cilArrowTop} size="sm" />
                                </CButton>
                                <CButton
                                  size="sm"
                                  color="outline-secondary"
                                  onClick={() => moveFieldDown(index)}
                                  disabled={index === selectedFields.length - 1}
                                  title="Переместить вниз"
                                >
                                  <CIcon icon={cilArrowBottom} size="sm" />
                                </CButton>
                                <CButton
                                  size="sm"
                                  color="outline-danger"
                                  onClick={() => removeField(fieldName)}
                                  title="Удалить"
                                >
                                  <CIcon icon={cilX} size="sm" />
                                </CButton>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </div>
      )}

      {currentStep === 'preview' && (
        <div className="step-content">
          <h5 className="mb-4">Предпросмотр</h5>
          
          <CRow className="g-4">
            <CCol md={8}>
              <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <span>Данные для экспорта</span>
                  <CButton 
                    color="outline-primary" 
                    size="sm" 
                    onClick={loadPreview}
                    disabled={previewLoading}
                  >
                    {previewLoading && <CSpinner size="sm" className="me-1" />}
                    Обновить
                  </CButton>
                </CCardHeader>
                <CCardBody>
                  {previewLoading ? (
                    <div className="text-center py-4">
                      <CSpinner className="me-2" />
                      Загрузка предпросмотра...
                    </div>
                  ) : previewError ? (
                    <CAlert color="danger">
                      {previewError}
                    </CAlert>
                  ) : previewData ? (
                    <div className="table-responsive">
                      <CTable hover small>
                        <CTableHead>
                          <CTableRow>
                            {selectedFields.map(fieldName => {
                              const field = (Array.isArray(availableFields) ? availableFields : []).find(f => 
                                (typeof f === 'string' ? f : f.name || f.key) === fieldName
                              )
                              const fieldLabel = typeof field === 'string' ? field : 
                                               field?.label || field?.name || field?.key || fieldName
                              
                              return (
                                <CTableHeaderCell key={fieldName}>
                                  {fieldLabel}
                                </CTableHeaderCell>
                              )
                            })}
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {(previewData.accounts || previewData.data || previewData).slice(0, 10).map((row, index) => (
                            <CTableRow key={index}>
                              {selectedFields.map(fieldName => (
                                <CTableDataCell key={fieldName}>
                                  {settings.maskPasswords && fieldName.includes('password') 
                                    ? '****' 
                                    : String(row[fieldName] || '—').substring(0, 50)
                                  }
                                </CTableDataCell>
                              ))}
                            </CTableRow>
                          ))}
                        </CTableBody>
                      </CTable>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <CButton color="primary" onClick={loadPreview}>
                        Загрузить предпросмотр
                      </CButton>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={4}>
              <CCard>
                <CCardBody>
                  <h6>Информация об экспорте</h6>
                  <div className="info-list">
                    <div className="info-item">
                      <span className="label">Формат:</span>
                      <span className="value">{formatUpperCase}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Полей:</span>
                      <span className="value">{selectedFields.length}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Записей:</span>
                      <span className="value">
                        {previewData?.total || previewData?.length || '—'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Файл:</span>
                      <span className="value">
                        {settings.filename || `export-${today}`}.{settings.format}
                      </span>
                    </div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </div>
      )}

      {isExporting && (
        <div className="export-progress mt-4">
          <CProgress className="mb-2">
            <CProgressBar value={exportProgress} />
          </CProgress>
          <div className="text-center">
            <CSpinner size="sm" className="me-2" />
            Экспортирую... {exportProgress}%
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mt-4">
        <small className="text-muted">
          Шаг {steps.findIndex(s => s.id === currentStep) + 1} из {steps.length}
        </small>
        
        <div>
          {currentStep !== 'type' && (
            <CButton
              color="light"
              onClick={previousStep}
              disabled={isExporting}
              className="me-2"
            >
              Назад
            </CButton>
          )}
          
          {currentStep !== 'preview' ? (
            <CButton
              color="primary"
              onClick={nextStep}
              disabled={!canProceedToNext() || isExporting}
            >
              Далее
            </CButton>
          ) : (
            <CButton
              color="success"
              onClick={executeExport}
              disabled={isExporting || selectedFields.length === 0}
            >
              {isExporting && <CSpinner size="sm" className="me-2" />}
              <CIcon icon={cilCloudDownload} className="me-2" />
              {isExporting ? 'Экспортирую...' : 'Экспортировать'}
            </CButton>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExportPanel