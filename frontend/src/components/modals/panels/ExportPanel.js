// frontend/src/components/modals/panels/ExportPanel.js
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
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
  CTooltip,
  CButtonGroup
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
  cilList,
  cilReload
} from '@coreui/icons'
import toast from 'react-hot-toast'
import { useImportExportConfig } from '../../../hooks/useImportExportConfig'
import './ExportPanel.scss'

const ExportPanel = ({ 
  visible, 
  onClose, 
  type = 'accounts', 
  selectedIds = [], 
  currentFilters = {}, 
  initialFormat = 'csv' 
}) => {
  const { config, isLoading: configLoading, error: configError } = useImportExportConfig(type)
  
  // Добавляем отладочные логи
  console.log('ExportPanel render:', {
    visible,
    type,
    configLoading,
    configError,
    config
  })

  // Логируем полную структуру конфигурации
  if (config) {
    console.log('Full config structure:', JSON.stringify(config, null, 2))
    console.log('Config export section:', config.export || config)
    if (config.export) {
      console.log('Export steps:', config.export.steps)
      console.log('Export exportTypes:', config.export.exportTypes)
      console.log('Export formats:', config.export.formats)
    } else {
      console.log('Direct config steps:', config.steps)
      console.log('Direct config exportTypes:', config.exportTypes)
      console.log('Direct config formats:', config.formats)
    }
  }

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
  const [statusSearchQuery, setStatusSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [previewData, setPreviewData] = useState(null)
  const [previewError, setPreviewError] = useState('')

  // Безопасное извлечение данных из конфигурации
  // Поддерживаем два формата: config.export.* и config.*
  const steps = config?.export?.steps || config?.steps || []
  const exportTypes = config?.export?.exportTypes || config?.exportTypes || []
  const formats = config?.export?.formats || config?.formats || []
  const templates = config?.export?.templates || config?.templates || {}
  const fieldCategories = config?.export?.fieldCategories || config?.fieldCategories || []
  const availableFields = config?.export?.availableFields || config?.availableFields || []
  const filters = config?.export?.filters || config?.filters || []

  console.log('Config data extracted:', {
    stepsLength: steps.length,
    exportTypesLength: exportTypes.length,
    formatsLength: formats.length,
    fieldCategoriesLength: fieldCategories.length,
    availableFieldsLength: availableFields.length,
    filtersLength: filters.length,
    configStructure: config?.export ? 'nested (config.export)' : 'flat (config.*)'
  })

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

  const displayFilename = useMemo(() => {
    const filename = settings.filename || defaultFilename
    const currentFormat = formats.find(f => f.value === settings.format)
    const extension = currentFormat?.extension || settings.format
    return `${filename}.${extension}`
  }, [settings.filename, settings.format, defaultFilename, formats])

  const currentFormat = useMemo(() => 
    formats.find(f => f.value === settings.format), 
    [formats, settings.format]
  )

  const filteredFields = useMemo(() => {
    if (!fieldsSearchQuery) return availableFields
    const query = fieldsSearchQuery.toLowerCase()
    return availableFields.filter(field => {
      const searchText = [field.name, field.label, field.description]
        .filter(Boolean).join(' ').toLowerCase()
      return searchText.includes(query)
    })
  }, [availableFields, fieldsSearchQuery])

  const fieldsByCategory = useMemo(() => {
    const grouped = {}
    fieldCategories.forEach(category => {
      grouped[category.key] = {
        ...category,
        fields: filteredFields.filter(field => field.category === category.key)
      }
    })
    return grouped
  }, [fieldCategories, filteredFields])

  const autoTemplatePreview = useMemo(() => {
    if (selectedFieldsList.length === 0) return ''
    return selectedFieldsList.map(item => `{${item.field}}`).join(':')
  }, [selectedFieldsList])

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
      
      if (steps[currentIndex + 1].id === 'preview') {
        loadPreview()
      }
    }
  }, [currentStep, steps])

  const previousStep = useCallback(() => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }, [currentStep, steps])

  const addField = useCallback((field) => {
    const existingCount = selectedFieldsList.filter(item => item.field === field.key).length
    const newItem = {
      field: field.key,
      isDuplicate: existingCount > 0,
      duplicateIndex: existingCount + 1
    }
    
    setSelectedFieldsList(prev => [...prev, newItem])
    updateDuplicateIndices(field.key, [...selectedFieldsList, newItem])
  }, [selectedFieldsList])

  const removeFieldAt = useCallback((index) => {
    const removedField = selectedFieldsList[index]
    const newList = selectedFieldsList.filter((_, i) => i !== index)
    setSelectedFieldsList(newList)
    updateDuplicateIndices(removedField.field, newList)
  }, [selectedFieldsList])

  const duplicateField = useCallback((index) => {
    const fieldItem = selectedFieldsList[index]
    const existingCount = selectedFieldsList.filter(item => item.field === fieldItem.field).length
    
    const newItem = {
      field: fieldItem.field,
      isDuplicate: true,
      duplicateIndex: existingCount + 1
    }
    
    const newList = [...selectedFieldsList]
    newList.splice(index + 1, 0, newItem)
    setSelectedFieldsList(newList)
    updateDuplicateIndices(fieldItem.field, newList)
  }, [selectedFieldsList])

  const moveFieldUp = useCallback((index) => {
    if (index === 0) return
    
    const newList = [...selectedFieldsList]
    const temp = newList[index]
    newList[index] = newList[index - 1]
    newList[index - 1] = temp
    setSelectedFieldsList(newList)
    
    const affectedFields = new Set([newList[index].field, newList[index - 1].field])
    affectedFields.forEach(fieldName => updateDuplicateIndices(fieldName, newList))
  }, [selectedFieldsList])

  const moveFieldDown = useCallback((index) => {
    if (index === selectedFieldsList.length - 1) return
    
    const newList = [...selectedFieldsList]
    const temp = newList[index]
    newList[index] = newList[index + 1]
    newList[index + 1] = temp
    setSelectedFieldsList(newList)
    
    const affectedFields = new Set([newList[index].field, newList[index + 1].field])
    affectedFields.forEach(fieldName => updateDuplicateIndices(fieldName, newList))
  }, [selectedFieldsList])

  const updateDuplicateIndices = useCallback((fieldName, list = selectedFieldsList) => {
    const fieldsOfType = list.filter(item => item.field === fieldName)
    
    fieldsOfType.forEach((item, index) => {
      item.isDuplicate = index > 0
      item.duplicateIndex = index + 1
    })
  }, [])

  const addAllFields = useCallback(() => {
    const newItems = availableFields
      .filter(field => !selectedFieldsList.some(item => item.field === field.key))
      .map(field => ({
        field: field.key,
        isDuplicate: false,
        duplicateIndex: 1
      }))
    
    setSelectedFieldsList(prev => [...prev, ...newItems])
  }, [availableFields, selectedFieldsList])

  const clearSelectedFields = useCallback(() => {
    setSelectedFieldsList([])
  }, [])

  const getFieldInfo = useCallback((fieldKey) => {
    return availableFields.find(field => field.key === fieldKey)
  }, [availableFields])

  const getFieldLabel = useCallback((fieldKey) => {
    const field = getFieldInfo(fieldKey)
    return field?.label || field?.name || fieldKey
  }, [getFieldInfo])

  const applyTemplate = useCallback(() => {
    const template = templates[selectedTemplate]
    if (template) {
      setSettings(prev => ({ ...prev, template: template.template }))
      
      if (template.fields?.length > 0) {
        const newItems = template.fields.map(fieldName => ({
          field: fieldName,
          isDuplicate: false,
          duplicateIndex: 1
        }))
        setSelectedFieldsList(newItems)
        
        template.fields.forEach(fieldName => updateDuplicateIndices(fieldName, newItems))
      }
    }
  }, [selectedTemplate, templates, updateDuplicateIndices])

  const applyAutoTemplate = useCallback(() => {
    if (selectedFieldsList.length > 0) {
      setSettings(prev => ({ 
        ...prev, 
        template: selectedFieldsList.map(item => `{${item.field}}`).join(':')
      }))
    }
  }, [selectedFieldsList])

  const loadPreview = useCallback(async () => {
    if (previewLoading) return
    
    try {
      setPreviewLoading(true)
      setPreviewError('')
      
      const previewSettings = {
        ...settings,
        selected_fields: selectedFieldsList.map(item => item.field),
        export_type: settings.export_type,
        account_ids: settings.export_type === 'selected' ? selectedIds : undefined,
        ...currentFilters,
        preview: true,
        limit: 10
      }
      
      const { accountsService } = await import('../../../services/accountsService')
      const response = await accountsService.getExportPreview(previewSettings)
      
      setPreviewData(response.data)
      
    } catch (error) {
      setPreviewError(error.message || 'Ошибка загрузки предпросмотра')
      setPreviewData(null)
    } finally {
      setPreviewLoading(false)
    }
  }, [previewLoading, settings, selectedFieldsList, selectedIds, currentFilters])

  const formatPreviewValue = useCallback((value, fieldKey) => {
    if (value === null || value === undefined) return '—'
    
    const field = getFieldInfo(fieldKey)
    const str = String(value)
    
    if (field?.sensitive && settings.mask_passwords) {
      return '****'
    }
    
    if (str.length > 30) {
      return str.substring(0, 27) + '...'
    }
    
    return str
  }, [getFieldInfo, settings.mask_passwords])

  const executeExport = useCallback(async () => {
    try {
      setExporting(true)
      
      const exportSettings = {
        ...settings,
        selected_fields: selectedFieldsList.map(item => item.field)
      }
      
      const validation = config?.export?.validation || config?.validation
      if (validation) {
        if (selectedFieldsList.length < (validation.minFields || 1)) {
          throw new Error(`Выберите минимум ${validation.minFields || 1} полей`)
        }
        
        if (previewData?.total_records > validation.maxRecords) {
          throw new Error(`Слишком много записей (${previewData.total_records}). Максимум: ${validation.maxRecords}`)
        }
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
      
      const { accountsService } = await import('../../../services/accountsService')
      const method = currentFormat?.method || 'exportAccounts'
      
      const response = await accountsService[method](exportSettings)
      
      const blob = new Blob([response.data], { 
        type: currentFormat?.mimeType || 'application/octet-stream' 
      })
      
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
      onClose?.()
      
    } catch (error) {
      const errorMsg = error.message || 
                      config?.export?.messages?.error || 
                      config?.messages?.error || 
                      'Ошибка экспорта'
      toast.error(errorMsg)
    } finally {
      setExporting(false)
    }
  }, [settings, selectedFieldsList, config, currentFormat, selectedIds, currentFilters, defaultFilename, displayFilename, previewData, onClose])

  useEffect(() => {
    const exportDefaults = config?.export?.defaults || config?.defaults
    if (visible && exportDefaults) {
      if (exportDefaults.fields && selectedFieldsList.length === 0) {
        const defaultItems = exportDefaults.fields.map(fieldKey => ({
          field: fieldKey,
          isDuplicate: false,
          duplicateIndex: 1
        }))
        setSelectedFieldsList(defaultItems)
      }
      
      if (settings.format === 'txt' && currentFormat?.defaultTemplate && !settings.template) {
        setSettings(prev => ({ ...prev, template: currentFormat.defaultTemplate }))
      }
    }
  }, [visible, config, selectedFieldsList.length, settings.format, currentFormat, settings.template])

  useEffect(() => {
    if (currentFormat) {
      const formatDefaults = {}
      
      if (currentFormat.value === 'csv' && currentFormat.options?.delimiters) {
        formatDefaults.csv_delimiter = currentFormat.options.delimiters[0]?.value || ','
      }
      
      if (currentFormat.value === 'txt' && currentFormat.defaultTemplate) {
        formatDefaults.template = currentFormat.defaultTemplate
      }
      
      if (Object.keys(formatDefaults).length > 0) {
        setSettings(prev => ({ ...prev, ...formatDefaults }))
      }
    }
  }, [currentFormat])

  // Отладочная информация в консоль
  useEffect(() => {
    console.log('ExportPanel state update:', {
      currentStep,
      configLoading,
      configError,
      hasConfig: !!config,
      hasSteps: steps.length > 0,
      hasExportTypes: exportTypes.length > 0,
      hasFormats: formats.length > 0
    })
  }, [currentStep, configLoading, configError, config, steps, exportTypes, formats])

  // Показываем состояние загрузки
  if (configLoading) {
    return (
      <CModal visible={visible} onClose={onClose} size="xl">
        <CModalHeader>
          <CModalTitle>Экспорт данных</CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center py-5">
          <CSpinner className="me-2" />
          Загрузка конфигурации...
          <div className="mt-2 text-muted">
            <small>Загружается конфигурация для типа: {type}</small>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={onClose}>
            Закрыть
          </CButton>
        </CModalFooter>
      </CModal>
    )
  }

  // Показываем ошибку конфигурации
  if (configError) {
    return (
      <CModal visible={visible} onClose={onClose} size="lg">
        <CModalHeader>
          <CModalTitle>Ошибка конфигурации</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CAlert color="danger">
            <h6>Ошибка загрузки конфигурации экспорта</h6>
            <p className="mb-2">Тип: {type}</p>
            <p className="mb-0">Ошибка: {configError.message}</p>
          </CAlert>
          <div className="mt-3">
            <h6>Отладочная информация:</h6>
            <pre className="small text-muted">
{JSON.stringify({
  type,
  configError: configError.message,
  stack: configError.stack
}, null, 2)}
            </pre>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={onClose}>
            Закрыть
          </CButton>
        </CModalFooter>
      </CModal>
    )
  }

  // Показываем ошибку если конфигурация пустая
  if (!config) {
    return (
      <CModal visible={visible} onClose={onClose} size="lg">
        <CModalHeader>
          <CModalTitle>Конфигурация не найдена</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CAlert color="warning">
            <h6>Конфигурация экспорта не найдена</h6>
            <p className="mb-2">Тип: {type}</p>
            <p className="mb-0">Убедитесь что файл конфигурации существует по пути:</p>
            <code>src/config/{type}ImportExportConfig.js</code>
          </CAlert>
          <div className="mt-3">
            <h6>Полученная конфигурация:</h6>
            <pre className="small text-muted">
{JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={onClose}>
            Закрыть
          </CButton>
        </CModalFooter>
      </CModal>
    )
  }

  // Показываем ошибку если нет шагов
  if (steps.length === 0) {
    return (
      <CModal visible={visible} onClose={onClose} size="lg">
        <CModalHeader>
          <CModalTitle>Некорректная конфигурация</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CAlert color="danger">
            <h6>Не настроены шаги экспорта</h6>
            <p className="mb-0">В конфигурации steps пустой массив или отсутствует</p>
          </CAlert>
          <div className="mt-3">
            <h6>Конфигурация:</h6>
            <pre className="small text-muted">
{JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={onClose}>
            Закрыть
          </CButton>
        </CModalFooter>
      </CModal>
    )
  }

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      backdrop="static"
      size="xl"
      className="export-modal"
    >
      <CModalHeader>
        <CModalTitle className="d-flex align-items-center">
          <CIcon icon={cilCloudDownload} className="me-2" size="lg" />
          {config?.export?.title || config?.title || 'Экспорт данных'}
          <CBadge color="primary" className="ms-2">
            {formatUpperCase}
          </CBadge>
          <CBadge color="info" className="ms-2">
            {currentStep}
          </CBadge>
        </CModalTitle>
      </CModalHeader>
      
      <CModalBody>
        {/* Отладочная информация */}
        <CAlert color="info" className="mb-3">
          <strong>Debug:</strong> Шаг {currentStep}, Шагов: {steps.length}, Типов: {exportTypes.length}, Форматов: {formats.length}
        </CAlert>

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
            
            <CAlert color="info">
              Найдено типов экспорта: {exportTypes.length}
            </CAlert>

            {exportTypes.length > 0 ? (
              <CRow className="g-4">
                <CCol md={12}>
                  <CCard>
                    <CCardBody>
                      <h6>Тип экспорта</h6>
                      <div className="export-types">
                        {exportTypes.map(option => (
                          <label 
                            key={option.value}
                            className={`export-type ${settings.export_type === option.value ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              value={option.value}
                              checked={settings.export_type === option.value}
                              onChange={(e) => setSettings(prev => ({ ...prev, export_type: e.target.value }))}
                            />
                            <div className="content">
                              <div className="title">{option.title}</div>
                              <div className="description">
                                {option.value === 'selected' && selectedIds.length > 0 
                                  ? `${option.description} (${selectedIds.length} записей)`
                                  : option.description
                                }
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            ) : (
              <CAlert color="warning">
                Типы экспорта не настроены в конфигурации
              </CAlert>
            )}
          </div>
        )}

        {currentStep === 'format' && (
          <div className="step-content">
            <h5 className="mb-4">Формат и поля экспорта</h5>
            
            <CAlert color="info">
              Найдено форматов: {formats.length}, Полей: {availableFields.length}
            </CAlert>

            {formats.length > 0 ? (
              <CRow className="g-4">
                <CCol md={6}>
                  <CCard>
                    <CCardBody>
                      <h6>Формат: {formatUpperCase}</h6>
                      
                      <div className="mb-3">
                        <CFormLabel>Выберите формат</CFormLabel>
                        <CFormSelect
                          value={settings.format}
                          onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value }))}
                        >
                          {formats.map(format => (
                            <option key={format.value} value={format.value}>
                              {format.label}
                            </option>
                          ))}
                        </CFormSelect>
                        {currentFormat?.description && (
                          <div className="form-text">{currentFormat.description}</div>
                        )}
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={6}>
                  <CCard>
                    <CCardBody>
                      <h6>Поля ({availableFields.length})</h6>
                      {availableFields.length > 0 ? (
                        <div>
                          {availableFields.slice(0, 5).map(field => (
                            <CBadge key={field.key} color="secondary" className="me-1 mb-1">
                              {field.label}
                            </CBadge>
                          ))}
                          {availableFields.length > 5 && (
                            <CBadge color="info">
                              +{availableFields.length - 5} еще
                            </CBadge>
                          )}
                        </div>
                      ) : (
                        <CAlert color="warning">
                          Поля не настроены в конфигурации
                        </CAlert>
                      )}
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            ) : (
              <CAlert color="warning">
                Форматы экспорта не настроены в конфигурации
              </CAlert>
            )}
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="step-content">
            <h5 className="mb-4">Предпросмотр</h5>
            
            <CAlert color="success">
              Готов к экспорту! Выбранных полей: {selectedFieldsList.length}
            </CAlert>
          </div>
        )}
      </CModalBody>
      
      <CModalFooter>
        <div className="d-flex justify-content-between align-items-center w-100">
          <small className="text-muted">
            Шаг {steps.findIndex(s => s.id === currentStep) + 1} из {steps.length}
          </small>
          
          <div>
            <CButton
              color="secondary"
              variant="outline"
              onClick={onClose}
              disabled={exporting}
              className="me-2"
            >
              Отмена
            </CButton>
            
            {currentStep !== 'type' && (
              <CButton
                color="light"
                onClick={previousStep}
                disabled={exporting}
                className="me-2"
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
                    Экспортировать
                  </>
                )}
              </CButton>
            )}
          </div>
        </div>
      </CModalFooter>
    </CModal>
  )
}

export default ExportPanel