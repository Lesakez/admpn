// frontend/src/components/modals/panels/ExportPanel.js
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CFormSelect,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CAlert,
  CSpinner,
  CBadge,
  CRow,
  CCol,
  CButton,
  CButtonGroup,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CFormTextarea,
  CInputGroup,
  CInputGroupText,
  CListGroup,
  CListGroupItem
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload,
  cilCheckCircle,
  cilFilter,
  cilCode,
  cilEyedropper,
  cilPlus,
  cilTrash,
  cilCopy,
  cilArrowTop,
  cilArrowBottom,
  cilMenu,
  cilReload,
  cilSearch,
  cilX
} from '@coreui/icons'
import toast from 'react-hot-toast'
import { useImportExportConfig } from '../../../hooks/useImportExportConfig'
import './ExportPanel.scss'

const ExportPanel = ({ 
  type = 'accounts', 
  selectedIds = [], 
  currentFilters = {}, 
  initialFormat = 'csv',
  onSuccess,
  onExport
}) => {
  const { config, isLoading: configLoading, error: configError } = useImportExportConfig(type)

  const [currentStep, setCurrentStep] = useState('type')
  const [exporting, setExporting] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  
  const [settings, setSettings] = useState({
    export_type: selectedIds.length > 0 ? 'selected' : 'filtered',
    format: initialFormat,
    status_filters: [],
    date_from: '',
    date_to: '',
    search_query: '',
    user_ids: [],
    filename: '',
    encoding: 'utf-8',
    include_header: true,
    mask_passwords: false,
    compress_output: false,
    csv_delimiter: ',',
    csv_quote: '"',
    template: ''
  })

  const [selectedFieldsList, setSelectedFieldsList] = useState([])
  const [fieldsSearchQuery, setFieldsSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [previewData, setPreviewData] = useState(null)
  const [previewError, setPreviewError] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)

  // Безопасное извлечение данных из конфигурации
  const steps = config?.export?.steps || config?.steps || []
  const exportTypes = config?.export?.exportTypes || config?.exportTypes || []
  const formats = config?.export?.formats || config?.formats || []
  const templates = config?.export?.templates || config?.templates || {}
  const fieldCategories = config?.export?.fieldCategories || config?.fieldCategories || []
  const availableFields = config?.export?.availableFields || config?.availableFields || []
  const filters = config?.export?.filters || config?.filters || []

  const formatUpperCase = useMemo(() => settings.format?.toUpperCase() || '', [settings.format])
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const defaultFilename = useMemo(() => {
    const template = config?.export?.defaults?.filename_template || 
                    config?.defaults?.filename_template || 
                    'export_{format}_{date}'
    return template
      .replace('{format}', settings.format)
      .replace('{date}', today)
      .replace('{type}', type)
  }, [config, settings.format, today, type])

  const currentFormat = useMemo(() => 
    formats.find(f => f.value === settings.format), 
    [formats, settings.format]
  )

  const filteredFields = useMemo(() => {
    if (!fieldsSearchQuery) return availableFields
    const query = fieldsSearchQuery.toLowerCase()
    return availableFields.filter(field => 
      field.name?.toLowerCase().includes(query) ||
      field.label?.toLowerCase().includes(query) ||
      field.description?.toLowerCase().includes(query)
    )
  }, [availableFields, fieldsSearchQuery])

  const fieldsByCategory = useMemo(() => {
    const grouped = {}
    fieldCategories.forEach(category => {
      grouped[category.key] = {
        ...category,
        fields: filteredFields.filter(field => field.category === category.key)
      }
    })
    // Добавляем поля без категории
    const uncategorizedFields = filteredFields.filter(field => 
      !fieldCategories.some(cat => cat.key === field.category)
    )
    if (uncategorizedFields.length > 0) {
      grouped.uncategorized = {
        key: 'uncategorized',
        name: 'Другие поля',
        fields: uncategorizedFields
      }
    }
    return grouped
  }, [fieldCategories, filteredFields])

  const canProceedToNext = useCallback(() => {
    switch (currentStep) {
      case 'type':
        return settings.export_type && 
               (settings.export_type !== 'by_ids' || settings.user_ids.length > 0) &&
               (settings.export_type !== 'selected' || selectedIds.length > 0)
      case 'format':
        return settings.format && selectedFieldsList.length > 0
      default:
        return false
    }
  }, [currentStep, settings, selectedIds, selectedFieldsList])

  const isStepCompleted = useCallback((stepId) => {
    const stepIndex = steps.findIndex(s => s.id === stepId)
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    return stepIndex < currentIndex
  }, [steps, currentStep])

  const nextStep = useCallback(() => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id)
    }
  }, [currentStep, steps])

  const previousStep = useCallback(() => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }, [currentStep, steps])

  const addField = useCallback((field) => {
    const newItem = {
      field: field.key,
      label: field.label || field.name,
      sensitive: field.sensitive,
      id: Date.now() + Math.random()
    }
    setSelectedFieldsList(prev => [...prev, newItem])
  }, [])

  const removeFieldAt = useCallback((index) => {
    setSelectedFieldsList(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearAllFields = useCallback(() => {
    setSelectedFieldsList([])
  }, [])

  const addAllFields = useCallback(() => {
    const newItems = availableFields.map(field => ({
      field: field.key,
      label: field.label || field.name,
      sensitive: field.sensitive,
      id: Date.now() + Math.random() + Math.random()
    }))
    setSelectedFieldsList(newItems)
  }, [availableFields])

  // Drag & Drop функции
  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) return
    
    setSelectedFieldsList(prev => {
      const newList = [...prev]
      const draggedItem = newList[draggedIndex]
      newList.splice(draggedIndex, 1)
      newList.splice(dropIndex, 0, draggedItem)
      return newList
    })
    
    setDraggedIndex(null)
  }, [draggedIndex])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
  }, [])

  const moveField = useCallback((fromIndex, toIndex) => {
    setSelectedFieldsList(prev => {
      const newList = [...prev]
      const item = newList.splice(fromIndex, 1)[0]
      newList.splice(toIndex, 0, item)
      return newList
    })
  }, [])

  const applyTemplate = useCallback((templateKey) => {
    const template = templates[templateKey]
    if (template && template.fields) {
      const newItems = template.fields.map(fieldKey => {
        const field = availableFields.find(f => f.key === fieldKey)
        return {
          field: fieldKey,
          label: field?.label || field?.name || fieldKey,
          sensitive: field?.sensitive || false,
          id: Date.now() + Math.random() + Math.random()
        }
      }).filter(item => item.label !== fieldKey) // Убираем поля которых нет в availableFields
      
      setSelectedFieldsList(newItems)
      setSettings(prev => ({ ...prev, template: template.template }))
      setSelectedTemplate(templateKey)
    }
  }, [templates, availableFields])

  const handleStatusFilterChange = useCallback((statusValue, checked) => {
    setSettings(prev => ({
      ...prev,
      status_filters: checked
        ? [...prev.status_filters, statusValue]
        : prev.status_filters.filter(s => s !== statusValue)
    }))
  }, [])

  const executeExport = useCallback(async () => {
    try {
      setExporting(true)
      
      const exportSettings = {
        ...settings,
        selected_fields: selectedFieldsList.map(item => item.field)
      }
      
      if (exportSettings.export_type === 'selected') {
        exportSettings.account_ids = selectedIds
      }
      
      if (exportSettings.export_type === 'filtered') {
        Object.assign(exportSettings, currentFilters)
      }
      
      if (!exportSettings.filename) {
        exportSettings.filename = defaultFilename
      }

      if (onExport) {
        await onExport(exportSettings)
      } else {
        const { accountsService } = await import('../../../services/accountsService')
        const method = currentFormat?.method || 'exportAccounts'
        
        const response = await accountsService[method](exportSettings)
        
        const blob = new Blob([response.data], { 
          type: currentFormat?.mimeType || 'application/octet-stream' 
        })
        
        const displayFilename = `${exportSettings.filename}.${currentFormat?.extension || settings.format}`
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = displayFilename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success(`Файл ${displayFilename} скачан`)
      }

      onSuccess?.({
        settings: exportSettings,
        fieldsCount: selectedFieldsList.length,
        recordsCount: previewData?.total_records || 0
      })
      
    } catch (error) {
      const errorMsg = error.message || 
                      config?.export?.messages?.error || 
                      config?.messages?.error || 
                      'Ошибка экспорта'
      toast.error(errorMsg)
    } finally {
      setExporting(false)
    }
  }, [settings, selectedFieldsList, config, currentFormat, selectedIds, currentFilters, defaultFilename, previewData, onSuccess, onExport])

  // Инициализация настроек из конфигурации
  useEffect(() => {
    const exportDefaults = config?.export?.defaults || config?.defaults
    if (exportDefaults) {
      setSettings(prev => ({
        ...prev,
        format: exportDefaults.format || initialFormat,
        encoding: exportDefaults.encoding || 'utf-8',
        include_header: exportDefaults.include_header ?? true,
        mask_passwords: exportDefaults.mask_passwords ?? false,
        csv_delimiter: exportDefaults.csv_delimiter || ',',
        filename: exportDefaults.filename_template || ''
      }))
      
      // Инициализация полей по умолчанию
      if (exportDefaults.fields && selectedFieldsList.length === 0) {
        const defaultItems = exportDefaults.fields.map(fieldKey => {
          const field = availableFields.find(f => f.key === fieldKey)
          return field ? {
            field: fieldKey,
            label: field.label || field.name,
            sensitive: field.sensitive,
            id: Date.now() + Math.random()
          } : null
        }).filter(Boolean)
        
        setSelectedFieldsList(defaultItems)
      }
    }
  }, [config, availableFields, initialFormat, selectedFieldsList.length])

  if (configLoading) {
    return (
      <div className="export-panel-loading">
        <CSpinner className="me-2" />
        Загрузка конфигурации экспорта...
      </div>
    )
  }

  if (configError) {
    return (
      <CAlert color="danger">
        <h6>Ошибка загрузки конфигурации</h6>
        <p className="mb-0">{configError.message}</p>
      </CAlert>
    )
  }

  if (!config || steps.length === 0) {
    return (
      <CAlert color="warning">
        <h6>Конфигурация экспорта не найдена</h6>
        <p className="mb-0">Убедитесь что настроена конфигурация для типа: {type}</p>
      </CAlert>
    )
  }

  return (
    <div className="export-panel">
      {/* Прогресс шагов */}
      <div className="export-steps">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`export-step ${currentStep === step.id ? 'active' : ''} ${isStepCompleted(step.id) ? 'completed' : ''}`}
          >
            <div className="step-indicator">
              {isStepCompleted(step.id) ? (
                <CIcon icon={cilCheckCircle} />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="step-content">
              <div className="step-title">{step.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Контент шагов */}
      <div className="export-step-content">
        {currentStep === 'type' && (
          <div className="step-type">
            <h5 className="mb-4">Выберите что экспортировать</h5>
            
            <CRow className="g-3">
              {exportTypes.map(option => (
                <CCol md={6} key={option.value}>
                  <div 
                    className={`export-type-card ${settings.export_type === option.value ? 'selected' : ''}`}
                    onClick={() => setSettings(prev => ({ ...prev, export_type: option.value }))}
                  >
                    <div className="export-type-content">
                      <h6>{option.title}</h6>
                      <p>{option.description}</p>
                      {option.value === 'selected' && selectedIds.length > 0 && (
                        <CBadge color="primary">{selectedIds.length} записей</CBadge>
                      )}
                    </div>
                    <div className="export-type-radio">
                      <input
                        type="radio"
                        checked={settings.export_type === option.value}
                        onChange={() => {}}
                      />
                    </div>
                  </div>
                </CCol>
              ))}
            </CRow>

            {/* Фильтры */}
            {filters.length > 0 && settings.export_type === 'filtered' && (
              <CCard className="mt-4">
                <CCardHeader>
                  <h6 className="mb-0">Фильтры экспорта</h6>
                </CCardHeader>
                <CCardBody>
                  <CRow className="g-3">
                    {filters.map(filter => (
                      <CCol md={6} key={filter.key}>
                        {filter.type === 'multiselect' && (
                          <div>
                            <CFormLabel>{filter.name}</CFormLabel>
                            <div className="filter-options">
                              {filter.options.map(option => (
                                <CFormCheck
                                  key={option.value}
                                  id={`filter-${filter.key}-${option.value}`}
                                  label={
                                    <span>
                                      <CBadge color={option.color || 'secondary'} className="me-2">
                                        {option.label}
                                      </CBadge>
                                    </span>
                                  }
                                  checked={settings.status_filters.includes(option.value)}
                                  onChange={(e) => handleStatusFilterChange(option.value, e.target.checked)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {filter.type === 'text' && (
                          <div>
                            <CFormLabel htmlFor={`filter-${filter.key}`}>{filter.name}</CFormLabel>
                            <CFormInput
                              id={`filter-${filter.key}`}
                              placeholder={filter.placeholder}
                              value={settings.search_query}
                              onChange={(e) => setSettings(prev => ({ ...prev, search_query: e.target.value }))}
                            />
                          </div>
                        )}

                        {filter.type === 'daterange' && (
                          <div>
                            <CFormLabel>{filter.name}</CFormLabel>
                            <CRow className="g-2">
                              <CCol>
                                <CFormInput
                                  type="date"
                                  placeholder="От"
                                  value={settings.date_from}
                                  onChange={(e) => setSettings(prev => ({ ...prev, date_from: e.target.value }))}
                                />
                              </CCol>
                              <CCol>
                                <CFormInput
                                  type="date"
                                  placeholder="До"
                                  value={settings.date_to}
                                  onChange={(e) => setSettings(prev => ({ ...prev, date_to: e.target.value }))}
                                />
                              </CCol>
                            </CRow>
                          </div>
                        )}
                      </CCol>
                    ))}
                  </CRow>
                </CCardBody>
              </CCard>
            )}
          </div>
        )}

        {currentStep === 'format' && (
          <div className="step-format">
            <h5 className="mb-4">Настройте формат и поля</h5>
            
            <CRow className="g-4">
              <CCol lg={4}>
                <CCard className="h-100">
                  <CCardHeader>
                    <h6 className="mb-0">Формат экспорта</h6>
                  </CCardHeader>
                  <CCardBody>
                    <CFormSelect
                      value={settings.format}
                      onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value }))}
                      className="mb-3"
                    >
                      {formats.map(format => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </CFormSelect>
                    
                    {currentFormat?.description && (
                      <CAlert color="info" className="mb-3">
                        {currentFormat.description}
                      </CAlert>
                    )}

                    {Object.keys(templates).length > 0 && (
                      <div>
                        <CFormLabel>Быстрые шаблоны</CFormLabel>
                        {Object.entries(templates).map(([key, template]) => (
                          <CButton
                            key={key}
                            color="outline-primary"
                            size="sm"
                            className="d-block w-100 mb-2 text-start"
                            onClick={() => applyTemplate(key)}
                          >
                            <strong>{template.name}</strong>
                            <br />
                            <small className="text-muted">{template.description}</small>
                          </CButton>
                        ))}
                      </div>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol lg={4}>
                <CCard className="h-100">
                  <CCardHeader className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Доступные поля</h6>
                    <CButton
                      size="sm"
                      color="outline-primary"
                      onClick={addAllFields}
                    >
                      Добавить все
                    </CButton>
                  </CCardHeader>
                  <CCardBody>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilSearch} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Поиск полей..."
                        value={fieldsSearchQuery}
                        onChange={(e) => setFieldsSearchQuery(e.target.value)}
                      />
                    </CInputGroup>

                    <div className="available-fields">
                      {Object.values(fieldsByCategory).map(category => (
                        category.fields.length > 0 && (
                          <div key={category.key} className="field-category">
                            <h6 className="category-title">{category.name}</h6>
                            {category.fields.map(field => (
                              <div
                                key={field.key}
                                className="field-item"
                                onClick={() => addField(field)}
                              >
                                <div className="field-info">
                                  <span className="field-name">{field.label || field.name}</span>
                                  {field.sensitive && (
                                    <CBadge color="warning" size="sm" className="ms-2">
                                      Sensitive
                                    </CBadge>
                                  )}
                                </div>
                                <CIcon icon={cilPlus} className="field-add" />
                              </div>
                            ))}
                          </div>
                        )
                      ))}
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol lg={4}>
                <CCard className="h-100">
                  <CCardHeader className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      Выбранные поля ({selectedFieldsList.length})
                    </h6>
                    <CButton
                      size="sm"
                      color="outline-danger"
                      onClick={clearAllFields}
                      disabled={selectedFieldsList.length === 0}
                    >
                      Очистить
                    </CButton>
                  </CCardHeader>
                  <CCardBody>
                    {selectedFieldsList.length === 0 ? (
                      <CAlert color="info">
                        Перетащите поля сюда или выберите из списка
                      </CAlert>
                    ) : (
                      <div className="selected-fields">
                        {selectedFieldsList.map((item, index) => (
                          <div
                            key={item.id}
                            className={`selected-field ${draggedIndex === index ? 'dragging' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                          >
                            <CIcon icon={cilMenu} className="drag-handle" />
                            <div className="field-content">
                              <span className="field-name">{item.label}</span>
                              {item.sensitive && (
                                <CBadge color="warning" size="sm" className="ms-2">
                                  Sensitive
                                </CBadge>
                              )}
                            </div>
                            <div className="field-actions">
                              <CButton
                                size="sm"
                                color="outline-secondary"
                                onClick={() => moveField(index, Math.max(0, index - 1))}
                                disabled={index === 0}
                              >
                                <CIcon icon={cilArrowTop} size="sm" />
                              </CButton>
                              <CButton
                                size="sm"
                                color="outline-secondary"
                                onClick={() => moveField(index, Math.min(selectedFieldsList.length - 1, index + 1))}
                                disabled={index === selectedFieldsList.length - 1}
                              >
                                <CIcon icon={cilArrowBottom} size="sm" />
                              </CButton>
                              <CButton
                                size="sm"
                                color="outline-danger"
                                onClick={() => removeFieldAt(index)}
                              >
                                <CIcon icon={cilX} size="sm" />
                              </CButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="step-preview">
            <h5 className="mb-4">Подтверждение экспорта</h5>
            
            <CAlert color="success">
              <h6>Готово к экспорту!</h6>
              <ul className="mb-0">
                <li>Тип: {exportTypes.find(t => t.value === settings.export_type)?.title}</li>
                <li>Формат: {currentFormat?.label}</li>
                <li>Полей: {selectedFieldsList.length}</li>
                {selectedIds.length > 0 && settings.export_type === 'selected' && (
                  <li>Записей: {selectedIds.length}</li>
                )}
                {settings.status_filters.length > 0 && (
                  <li>Фильтры статусов: {settings.status_filters.join(', ')}</li>
                )}
              </ul>
            </CAlert>

            <CCard>
              <CCardHeader>
                <h6 className="mb-0">Выбранные поля</h6>
              </CCardHeader>
              <CCardBody>
                <div className="field-preview">
                  {selectedFieldsList.map((item, index) => (
                    <CBadge
                      key={item.id}
                      color={item.sensitive ? 'warning' : 'primary'}
                      className="me-2 mb-2"
                    >
                      {index + 1}. {item.label}
                    </CBadge>
                  ))}
                </div>
              </CCardBody>
            </CCard>
          </div>
        )}
      </div>

      {/* Навигация */}
      <div className="export-navigation">
        <div className="step-info">
          Шаг {steps.findIndex(s => s.id === currentStep) + 1} из {steps.length}
        </div>
        
        <div className="nav-buttons">
          {currentStep !== 'type' && (
            <CButton
              color="secondary"
              variant="outline"
              onClick={previousStep}
              disabled={exporting}
            >
              Назад
            </CButton>
          )}
          
          {currentStep !== 'preview' ? (
            <CButton
              color="primary"
              onClick={nextStep}
              disabled={!canProceedToNext() || exporting}
            >
              Далее
            </CButton>
          ) : (
            <CButton
              color="success"
              onClick={executeExport}
              disabled={exporting || selectedFieldsList.length === 0}
            >
              {exporting ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Экспортирую...
                </>
              ) : (
                <>
                  <CIcon icon={cilCloudDownload} className="me-2" />
                  Экспортировать ({selectedFieldsList.length} полей)
                </>
              )}
            </CButton>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExportPanel