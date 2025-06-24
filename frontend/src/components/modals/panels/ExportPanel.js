// frontend/src/components/modals/panels/ExportPanel.js
import React, { useState, useEffect, useRef } from 'react'
import {
  CRow,
  CCol,
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
  CButton,
  CInputGroup,
  CInputGroupText,
  CProgress,
  CProgressBar,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormTextarea,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload,
  cilCheckCircle,
  cilFilter,
  cilCode,
  cilEyedropper,
  cilX,
  cilSearch,
  cilCheck,
  cilPlus,
  cilCopy,
  cilList,
  cilChevronLeft,
  cilChevronRight,
  cilReload,
} from '@coreui/icons'
import './ExportPanel.scss'
import toast from 'react-hot-toast'

// Динамический импорт сервисов
const getServiceByType = (type) => {
  switch (type) {
    case 'accounts':
      return import('../../../services/accountsService').then(m => m.accountsService)
    case 'profiles':
      return import('../../../services/profilesService').then(m => m.profilesService)
    case 'proxies':
      return import('../../../services/proxiesService').then(m => m.proxiesService)
    case 'phones':
      return import('../../../services/phonesService').then(m => m.phonesService)
    case 'projects':
      return import('../../../services/projectsService').then(m => m.projectsService)
    default:
      return import('../../../services/accountsService').then(m => m.accountsService)
  }
}

const ExportPanel = ({
  type = 'accounts',
  selectedIds = [],
  currentFilters = {},
  onSuccess,
  onError,
  onLoadingChange,
}) => {
  // Стадии экспорта
  const steps = [
    { id: 'type', label: 'Тип и фильтры', icon: cilFilter },
    { id: 'format', label: 'Формат и поля', icon: cilCode },
    { id: 'preview', label: 'Предпросмотр', icon: cilEyedropper },
  ]

  // Основное состояние
  const [currentStep, setCurrentStep] = useState('type')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  
  // Данные с сервера - БЕЗ ХАРДКОДА
  const [exportConfig, setExportConfig] = useState(null)
  const [availableFields, setAvailableFields] = useState([])
  const [statusOptions, setStatusOptions] = useState([])
  const [previewData, setPreviewData] = useState(null)
  
  // Состояния загрузки
  const [configLoading, setConfigLoading] = useState(false)
  const [fieldsLoading, setFieldsLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  
  // Поиск и фильтрация
  const [statusSearchQuery, setStatusSearchQuery] = useState('')
  const [fieldsSearchQuery, setFieldsSearchQuery] = useState('')
  
  // Поля для экспорта с возможностью дублирования
  const [selectedFieldsList, setSelectedFieldsList] = useState([])
  const [userIdsText, setUserIdsText] = useState('')
  
  // Drag & Drop
  const draggedField = useRef(null)
  const draggedIndex = useRef(null)
  
  // Настройки экспорта - начальные значения только базовые
  const [settings, setSettings] = useState({
    exportType: selectedIds.length > 0 ? 'selected' : 'filtered',
    format: 'csv',
    filename: '',
    template: '',
    csvDelimiter: ',',
    csvQuote: '"',
    encoding: 'utf-8',
    includeHeader: true,
    maskPasswords: false,
    compressOutput: false,
    statusFilters: [],
    dateFrom: '',
    dateTo: '',
    searchQuery: '',
    userIds: [],
    includeSensitive: false,
  })

  // Вспомогательные функции (определены до их использования)
  const validateSettings = () => {
    if (!settings.format || selectedFieldsList.length === 0) return false
    if (settings.exportType === 'by_user_id' && settings.userIds.length === 0) return false
    if (settings.exportType === 'selected' && selectedIds.length === 0) return false
    return true
  }

  // Computed значения
  const formatUpperCase = settings.format?.toUpperCase() || ''
  const today = new Date().toISOString().split('T')[0]
  const defaultFilename = `export-${today}`
  const displayFilename = `${settings.filename || defaultFilename}.${settings.format}`

  const hasActiveFilters = settings.statusFilters.length > 0 ||
    settings.dateFrom ||
    settings.dateTo ||
    settings.searchQuery

  const filteredStatusOptions = statusOptions.filter(option =>
    option.label.toLowerCase().includes(statusSearchQuery.toLowerCase())
  )

  const filteredFields = availableFields.filter(field =>
    field.key &&
    (field.label.toLowerCase().includes(fieldsSearchQuery.toLowerCase()) ||
      field.key.toLowerCase().includes(fieldsSearchQuery.toLowerCase()))
  )

  const templatePreview = settings.template
    ? previewTemplate(settings.template)
    : ''

  const autoTemplatePreview = selectedFieldsList.length > 0
    ? selectedFieldsList.map(item => `{${item.field}}`).join(':')
    : ''

  const isFormValid = validateSettings()

  // Получить доступные опции экспорта из серверной конфигурации
  const exportTypeOptions = exportConfig?.exportTypes || []
  const formatOptions = exportConfig?.formats || []

  const previewTemplate = (template) => {
    return template.replace(/{(\w+)}/g, (match, field) => {
      const sampleField = availableFields.find(f => f.key === field)
      if (sampleField) {
        if (sampleField.sensitive && settings.maskPasswords) {
          return '****'
        }
        
        // Базовая логика для примеров на основе типа поля с сервера
        switch (sampleField.type) {
          case 'email':
            return 'user@example.com'
          case 'number':
            return '123'
          case 'datetime':
            return '2024-01-01'
          case 'boolean':
            return 'true'
          default:
            return `${field}_sample`
        }
      }
      return `{${field}}`
    })
  }

  const formatNumber = (num) => {
    if (typeof num !== 'number') return num
    return new Intl.NumberFormat('ru-RU').format(num)
  }

  const getFieldLabel = (fieldKey) => {
    const field = availableFields.find(f => f.key === fieldKey)
    return field?.label || fieldKey
  }

  // Получение цвета статуса ТОЛЬКО из серверных данных
  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status)
    return statusOption?.color || 'secondary'
  }

  // === ЗАГРУЗКА ДАННЫХ С СЕРВЕРА ===

  // Загрузка конфигурации экспорта
  const loadExportConfig = async () => {
    try {
      setConfigLoading(true)
      const service = await getServiceByType(type)
      
      // Проверяем есть ли метод getExportConfig
      if (service.getExportConfig) {
        const response = await service.getExportConfig()
        
        if (response.data?.success) {
          const config = response.data.data
          setExportConfig(config)
          
          // Устанавливаем значения по умолчанию из серверной конфигурации
          setSettings(prev => ({
            ...prev,
            format: config.formats?.[0]?.value || 'csv'
          }))
        }
      } else {
        // Fallback конфигурация если метод не реализован
        console.warn(`getExportConfig not implemented for ${type}`)
        setExportConfig({
          exportTypes: [
            { value: 'all', title: 'Все записи', description: 'Экспорт всех записей' },
            { value: 'filtered', title: 'Фильтрованный экспорт', description: 'С учетом текущих фильтров' },
            { value: 'selected', title: 'Выбранные записи', description: 'Только выбранные записи' }
          ],
          formats: [
            { value: 'csv', label: 'CSV', description: 'Таблица для Excel' },
            { value: 'json', label: 'JSON', description: 'Данные в JSON формате' },
            { value: 'txt', label: 'TXT', description: 'Текстовый файл с шаблоном' }
          ]
        })
      }
    } catch (error) {
      console.error('Error loading export config:', error)
      toast.error('Ошибка при загрузке конфигурации экспорта')
    } finally {
      setConfigLoading(false)
    }
  }

  // Загрузка доступных полей
  const loadFields = async () => {
    try {
      setFieldsLoading(true)
      const service = await getServiceByType(type)

      // Проверяем есть ли метод getExportFields
      if (service.getExportFields) {
        const response = await service.getExportFields()

        if (response.data?.success) {
          const fields = response.data.data
          setAvailableFields(fields)

          // Устанавливаем поля по умолчанию из серверной конфигурации
          if (selectedFieldsList.length === 0) {
            const defaultFields = fields
              .filter(field => field.defaultSelected)
              .map(field => ({
                field: field.key,
                isDuplicate: false,
                duplicateIndex: 1,
              }))
            
            if (defaultFields.length > 0) {
              setSelectedFieldsList(defaultFields)
            }
          }
        }
      } else {
        // Fallback: получаем поля через старый метод getFields
        console.warn(`getExportFields not implemented for ${type}, trying getFields`)
        
        const response = await fetch(`/api/${type}/fields`)
        const data = await response.json()
        
        if (data.success && data.data) {
          // Преобразуем старый формат в новый
          const fields = Object.entries(data.data).map(([key, config]) => ({
            key,
            label: config.label || key,
            type: config.type || 'string',
            defaultSelected: ['id', 'name', 'status', 'login', 'email'].includes(key),
            sensitive: ['password', 'token', 'secret'].some(s => key.toLowerCase().includes(s))
          }))
          
          setAvailableFields(fields)
          
          // Устанавливаем базовые поля по умолчанию
          if (selectedFieldsList.length === 0) {
            const defaultFields = fields
              .filter(field => field.defaultSelected)
              .slice(0, 6)
              .map(field => ({
                field: field.key,
                isDuplicate: false,
                duplicateIndex: 1,
              }))
            
            setSelectedFieldsList(defaultFields)
          }
        }
      }
    } catch (error) {
      console.error('Error loading fields:', error)
      toast.error('Ошибка при загрузке полей')
    } finally {
      setFieldsLoading(false)
    }
  }

  // Загрузка опций статуса
  const loadStatusOptions = async () => {
    try {
      setStatusLoading(true)
      
      // Пытаемся получить статусы из общей конфигурации
      const configResponse = await fetch('/api/config/statuses')
      const statusConfig = await configResponse.json()
      
      let statusData = []
      
      // Определяем тип для конфигурации
      const configType = type.toUpperCase().replace(/S$/, '')
      
      if (statusConfig.success && statusConfig.data?.statuses?.[configType]) {
        // Получаем статусы из конфигурации со всеми данными
        const typeStatuses = statusConfig.data.statuses[configType]
        statusData = Object.values(typeStatuses).map(status => ({
          value: status,
          label: statusConfig.data.descriptions?.[status] || status,
          color: statusConfig.data.colors?.[status] || 'secondary'
        }))
      } else {
        // Fallback: получаем уникальные статусы из данных
        const service = await getServiceByType(type)
        
        try {
          const response = await service.getAll({ limit: 1000, fields: 'status' })
          
          if (response.data?.success && response.data.data?.data) {
            const uniqueStatuses = [...new Set(
              response.data.data.data
                .map(item => item.status)
                .filter(Boolean)
            )]
            
            statusData = uniqueStatuses.map(status => ({
              value: status,
              label: status,
              color: 'secondary' // Нейтральный цвет для неизвестных статусов
            }))
          }
        } catch (fetchError) {
          console.warn('Could not fetch status data:', fetchError)
        }
      }

      setStatusOptions(statusData)
    } catch (error) {
      console.error('Error loading status options:', error)
      toast.error('Ошибка при загрузке статусов')
    } finally {
      setStatusLoading(false)
    }
  }

  // Загрузка предпросмотра
  const loadPreview = async () => {
    try {
      setPreviewLoading(true)
      setPreviewError('')
      
      const exportParams = {
        format: settings.format,
        fields: selectedFieldsList.map(item => item.field),
        limit: 10,
        preview: true,
        includeSensitive: settings.includeSensitive,
      }

      // Добавляем фильтры
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

      const service = await getServiceByType(type)
      
      // Проверяем есть ли универсальный метод export
      if (service.export) {
        const response = await service.export(exportParams)
        
        if (response.data?.success) {
          setPreviewData(response.data.data)
        } else {
          setPreviewError(response.data?.message || 'Ошибка при загрузке предпросмотра')
        }
      } else {
        // Fallback: используем прямой запрос к API
        const params = new URLSearchParams(exportParams)
        const response = await fetch(`/api/${type}/export?${params}`)
        const data = await response.json()
        
        if (data.success) {
          setPreviewData(data.data)
        } else {
          setPreviewError(data.message || 'Ошибка при загрузке предпросмотра')
        }
      }
    } catch (error) {
      console.error('Preview error:', error)
      setPreviewError(`Ошибка при загрузке предпросмотра: ${error.message}`)
    } finally {
      setPreviewLoading(false)
    }
  }

  // === УПРАВЛЕНИЕ ПОЛЯМИ ===

  const addField = (field) => {
    const existingCount = selectedFieldsList.filter(item => item.field === field.key).length
    setSelectedFieldsList(prev => [...prev, {
      field: field.key,
      isDuplicate: existingCount > 0,
      duplicateIndex: existingCount + 1,
    }])
    
    updateDuplicateIndices(field.key)
  }

  const addAllFields = () => {
    const newFields = availableFields
      .filter(field => !selectedFieldsList.some(item => item.field === field.key))
      .map(field => ({
        field: field.key,
        isDuplicate: false,
        duplicateIndex: 1,
      }))
    
    setSelectedFieldsList(prev => [...prev, ...newFields])
  }

  const clearSelectedFields = () => {
    setSelectedFieldsList([])
  }

  const removeFieldAt = (index) => {
    const removedField = selectedFieldsList[index]
    setSelectedFieldsList(prev => prev.filter((_, i) => i !== index))
    updateDuplicateIndices(removedField.field)
  }

  const duplicateField = (index) => {
    const fieldItem = selectedFieldsList[index]
    const existingCount = selectedFieldsList.filter(item => item.field === fieldItem.field).length
    
    setSelectedFieldsList(prev => {
      const newList = [...prev]
      newList.splice(index + 1, 0, {
        field: fieldItem.field,
        isDuplicate: true,
        duplicateIndex: existingCount + 1,
      })
      return newList
    })
    
    updateDuplicateIndices(fieldItem.field)
  }

  const updateDuplicateIndices = (fieldName) => {
    setSelectedFieldsList(prev => {
      const newList = [...prev]
      const fieldsOfType = newList.filter(item => item.field === fieldName)
      
      fieldsOfType.forEach((item, index) => {
        item.isDuplicate = index > 0
        item.duplicateIndex = index + 1
      })
      
      return newList
    })
  }

  // === DRAG AND DROP ===

  const startDrag = (event, field) => {
    draggedField.current = field
    event.dataTransfer.effectAllowed = 'copy'
  }

  const startDragSelected = (event, index) => {
    draggedIndex.current = index
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (event) => {
    event.preventDefault()
    
    if (draggedField.current) {
      addField(draggedField.current)
      draggedField.current = null
    }
  }

  const handleDropReorder = (event, targetIndex) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (draggedIndex.current !== null && draggedIndex.current !== targetIndex) {
      setSelectedFieldsList(prev => {
        const newList = [...prev]
        const [movedField] = newList.splice(draggedIndex.current, 1)
        newList.splice(targetIndex, 0, movedField)
        return newList
      })
      
      draggedIndex.current = null
    }
  }

  // === НАВИГАЦИЯ ПО ШАГАМ ===

  const nextStep = () => {
    const stepOrder = ['type', 'format', 'preview']
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1])
      if (stepOrder[currentIndex + 1] === 'preview') {
        loadPreview()
      }
    }
  }

  const prevStep = () => {
    const stepOrder = ['type', 'format', 'preview']
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1])
    }
  }

  const canProceed = (step) => {
    switch (step) {
      case 'type':
        return settings.exportType && 
               (settings.exportType !== 'selected' || selectedIds.length > 0) &&
               (settings.exportType !== 'by_user_id' || settings.userIds.length > 0)
      case 'format':
        return settings.format && selectedFieldsList.length > 0
      default:
        return false
    }
  }

  // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

  const clearAllFilters = () => {
    setSettings(prev => ({
      ...prev,
      statusFilters: [],
      dateFrom: '',
      dateTo: '',
      searchQuery: ''
    }))
    setStatusSearchQuery('')
  }

  const updateUserIds = () => {
    const ids = userIdsText
      .split('\n')
      .map(id => id.trim())
      .filter(id => id.length > 0)
    
    setSettings(prev => ({ ...prev, userIds: ids }))
  }

  const applyAutoTemplate = () => {
    if (selectedFieldsList.length > 0) {
      const template = selectedFieldsList.map(item => `{${item.field}}`).join(':')
      setSettings(prev => ({ ...prev, template }))
    }
  }

  // === ВЫПОЛНЕНИЕ ЭКСПОРТА ===

  const executeExport = async () => {
    if (!isFormValid) {
      toast.error('Проверьте настройки экспорта')
      return
    }

    try {
      setIsExporting(true)
      setExportProgress(0)
      
      // Симуляция прогресса
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const exportParams = {
        format: settings.format,
        fields: selectedFieldsList.map(item => item.field),
        filename: settings.filename || defaultFilename,
        includeHeader: settings.includeHeader,
        delimiter: settings.csvDelimiter,
        template: settings.template,
        encoding: settings.encoding,
        maskPasswords: settings.maskPasswords,
        compress: settings.compressOutput,
        includeSensitive: settings.includeSensitive,
      }

      // Добавляем фильтры
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
      if (settings.exportType === 'by_user_id' && settings.userIds.length > 0) {
        exportParams.userIds = settings.userIds
      }

      const service = await getServiceByType(type)
      
      clearInterval(progressInterval)
      setExportProgress(90)

      let response
      
      // Используем универсальный метод export если доступен
      if (service.export) {
        response = await service.export(exportParams)
      } else {
        // Fallback: прямой запрос к API
        response = await fetch(`/api/${type}/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exportParams),
        })
      }
      
      setExportProgress(100)

      // Обработка ответа и скачивание файла
      if (response.ok || response.data?.success) {
        let blob
        
        if (response.data?.content) {
          // Если контент в JSON ответе
          blob = new Blob([response.data.content], { 
            type: getContentType(settings.format) 
          })
        } else if (response.data?.downloadUrl) {
          // Если URL для скачивания
          window.open(response.data.downloadUrl, '_blank')
          blob = null
        } else {
          // Если прямой ответ файла
          blob = response instanceof Response ? await response.blob() : new Blob([response.data])
        }

        if (blob) {
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = displayFilename
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }

        toast.success('Экспорт завершен успешно')
        onSuccess?.({
          filename: displayFilename,
          format: settings.format,
          recordCount: previewData?.totalRecords || 0,
          type: 'export'
        })
      } else {
        throw new Error(response.data?.message || 'Ошибка экспорта')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error(`Ошибка экспорта: ${error.message}`)
      onError?.(error.message)
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const getContentType = (format) => {
    const types = {
      csv: 'text/csv; charset=utf-8',
      json: 'application/json; charset=utf-8',
      txt: 'text/plain; charset=utf-8',
    }
    return types[format] || 'application/octet-stream'
  }

  // === ИНИЦИАЛИЗАЦИЯ ===

  useEffect(() => {
    loadExportConfig()
    loadFields()
    loadStatusOptions()
  }, [type]) // Перезагружаем при смене типа

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isExporting)
    }
  }, [isExporting, onLoadingChange])

  // Проверка завершенности шагов
  const isStepCompleted = (stepId) => {
    const stepIndex = steps.findIndex(s => s.id === stepId)
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    return stepIndex < currentIndex
  }

  // Форматирование значений в предпросмотре
  const formatPreviewValue = (value, field) => {
    if (value === null || value === undefined) return '—'
    
    const str = String(value)
    
    // Маскируем чувствительные поля на основе серверных данных
    const sensitiveField = availableFields.find(f => f.key === field)
    if (sensitiveField?.sensitive && settings.maskPasswords) {
      return '****'
    }
    
    // Обрезаем длинные значения
    if (str.length > 30) {
      return str.substring(0, 27) + '...'
    }
    
    return str
  }

  if (configLoading) {
    return (
      <div className="text-center py-5">
        <CSpinner className="me-2" />
        Загрузка конфигурации экспорта...
      </div>
    )
  }

  return (
    <div className="export-panel">
      {/* Progress Steps */}
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

      {/* Step Content */}
      <div className="step-content">
        {/* Step 1: Type & Filters */}
        {currentStep === 'type' && (
          <div>
            <h5 className="mb-4">Что экспортировать?</h5>
            
            <CRow className="g-4">
              <CCol md={6}>
                <CCard>
                  <CCardBody>
                    <h6>Тип экспорта</h6>
                    <div className="export-types">
                      {exportTypeOptions.map(option => (
                        <label
                          key={option.value}
                          className={`export-type ${settings.exportType === option.value ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            value={option.value}
                            checked={settings.exportType === option.value}
                            onChange={(e) => setSettings(prev => ({ ...prev, exportType: e.target.value }))}
                          />
                          <div className="content">
                            <div className="title">{option.title}</div>
                            <div className="description">{option.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* User IDs Input */}
                    {settings.exportType === 'by_user_id' && (
                      <div className="mt-3">
                        <CFormLabel>User ID (по одному на строку):</CFormLabel>
                        <CFormTextarea
                          value={userIdsText}
                          onChange={(e) => setUserIdsText(e.target.value)}
                          onBlur={updateUserIds}
                          rows={4}
                          placeholder="USER123
USER456"
                        />
                        <small className="text-muted">Введено: {settings.userIds.length}</small>
                      </div>
                    )}

                    {/* Selected Info */}
                    {settings.exportType === 'selected' && (
                      <div className="mt-3">
                        <div className="alert alert-info">
                          <CIcon icon={cilCheckCircle} className="me-2" />
                          Выбрано записей: <strong>{selectedIds.length}</strong>
                        </div>
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
                          onClick={clearAllFilters}
                        >
                          Очистить
                        </CButton>
                      )}
                    </div>

                    {/* Status Filter */}
                    <div className="mb-3">
                      <CFormLabel>Статусы</CFormLabel>
                      <div className="filter-search mb-2">
                        <CInputGroup size="sm">
                          <CInputGroupText>
                            <CIcon icon={cilSearch} />
                          </CInputGroupText>
                          <CFormInput
                            placeholder="Поиск статусов..."
                            value={statusSearchQuery}
                            onChange={(e) => setStatusSearchQuery(e.target.value)}
                          />
                        </CInputGroup>
                      </div>
                      <div className="status-list">
                        {statusLoading ? (
                          <CSpinner size="sm" />
                        ) : (
                          filteredStatusOptions.map(status => (
                            <label key={status.value} className="status-item">
                              <CFormCheck
                                value={status.value}
                                checked={settings.statusFilters.includes(status.value)}
                                onChange={(e) => {
                                  const { value, checked } = e.target
                                  setSettings(prev => ({
                                    ...prev,
                                    statusFilters: checked
                                      ? [...prev.statusFilters, value]
                                      : prev.statusFilters.filter(s => s !== value)
                                  }))
                                }}
                              />
                              <CBadge color={status.color} className="ms-2">
                                {status.label}
                              </CBadge>
                            </label>
                          ))
                        )}
                      </div>
                      <small className="text-muted">Выбрано: {settings.statusFilters.length}</small>
                    </div>

                    {/* Date Range */}
                    <div className="mb-3">
                      <CFormLabel>Период</CFormLabel>
                      <CRow className="g-2">
                        <CCol>
                          <CFormInput
                            type="date"
                            value={settings.dateFrom}
                            max={settings.dateTo || today}
                            onChange={(e) => setSettings(prev => ({ ...prev, dateFrom: e.target.value }))}
                          />
                        </CCol>
                        <CCol>
                          <CFormInput
                            type="date"
                            value={settings.dateTo}
                            min={settings.dateFrom}
                            max={today}
                            onChange={(e) => setSettings(prev => ({ ...prev, dateTo: e.target.value }))}
                          />
                        </CCol>
                      </CRow>
                    </div>

                    {/* Search */}
                    <div>
                      <CFormLabel>Поиск</CFormLabel>
                      <CFormInput
                        placeholder="Поиск по тексту..."
                        value={settings.searchQuery}
                        onChange={(e) => setSettings(prev => ({ ...prev, searchQuery: e.target.value }))}
                      />
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </div>
        )}

        {/* Step 2: Format & Fields */}
        {currentStep === 'format' && (
          <div>
            <h5 className="mb-4">Формат и поля экспорта</h5>
            
            <CRow className="g-4">
              {/* Format Settings */}
              <CCol md={6}>
                <CCard>
                  <CCardBody>
                    <h6>Формат: {formatUpperCase}</h6>
                    
                    {/* Format Selection */}
                    <div className="mb-3">
                      <CFormLabel>Выберите формат</CFormLabel>
                      <CFormSelect
                        value={settings.format}
                        onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value }))}
                      >
                        {formatOptions.map(format => (
                          <option key={format.value} value={format.value}>
                            {format.label} - {format.description}
                          </option>
                        ))}
                      </CFormSelect>
                    </div>

                    {/* CSV Settings */}
                    {settings.format === 'csv' && (
                      <div className="mb-3">
                        <CFormLabel>Разделитель</CFormLabel>
                        <CFormSelect
                          value={settings.csvDelimiter}
                          onChange={(e) => setSettings(prev => ({ ...prev, csvDelimiter: e.target.value }))}
                        >
                          <option value=",">Запятая (,)</option>
                          <option value=";">Точка с запятой (;)</option>
                          <option value="	">Табуляция</option>
                        </CFormSelect>
                      </div>
                    )}

                    {/* TXT Settings */}
                    {settings.format === 'txt' && (
                      <div className="mb-3">
                        <CFormLabel>Шаблон строки</CFormLabel>
                        <CFormTextarea
                          value={settings.template}
                          onChange={(e) => setSettings(prev => ({ ...prev, template: e.target.value }))}
                          rows={3}
                          placeholder="{login}:{password}:{email}"
                          className="template-input"
                        />
                        <small className="text-muted">
                          Используйте поля в фигурных скобках
                        </small>
                        
                        {settings.template && (
                          <div className="mt-2">
                            <small className="text-muted">Предпросмотр:</small>
                            <div className="preview-box">
                              <pre>{templatePreview}</pre>
                            </div>
                          </div>
                        )}

                        {selectedFieldsList.length > 0 && (
                          <CButton
                            size="sm"
                            color="outline-primary"
                            onClick={applyAutoTemplate}
                            className="mt-2"
                          >
                            Создать шаблон из выбранных полей
                          </CButton>
                        )}
                      </div>
                    )}

                    {/* Common Settings */}
                    <div className="mb-3">
                      <CFormLabel>Настройки файла</CFormLabel>
                      <CInputGroup className="mb-2">
                        <CFormInput
                          placeholder={defaultFilename}
                          value={settings.filename}
                          onChange={(e) => setSettings(prev => ({ ...prev, filename: e.target.value }))}
                        />
                        <CInputGroupText>.{settings.format}</CInputGroupText>
                      </CInputGroup>
                      
                      <CFormSelect
                        value={settings.encoding}
                        onChange={(e) => setSettings(prev => ({ ...prev, encoding: e.target.value }))}
                        className="mb-2"
                      >
                        <option value="utf-8">UTF-8</option>
                        <option value="windows-1251">Windows-1251</option>
                      </CFormSelect>
                    </div>

                    {/* Options */}
                    <div className="mb-2">
                      <CFormCheck
                        id="includeHeader"
                        checked={settings.includeHeader}
                        onChange={(e) => setSettings(prev => ({ ...prev, includeHeader: e.target.checked }))}
                        label="Включить заголовок"
                      />
                    </div>

                    <div className="mb-2">
                      <CFormCheck
                        id="maskPasswords"
                        checked={settings.maskPasswords}
                        onChange={(e) => setSettings(prev => ({ ...prev, maskPasswords: e.target.checked }))}
                        label="Маскировать пароли"
                      />
                    </div>

                    <div className="mb-2">
                      <CFormCheck
                        id="includeSensitive"
                        checked={settings.includeSensitive}
                        onChange={(e) => setSettings(prev => ({ ...prev, includeSensitive: e.target.checked }))}
                        label="Включить чувствительные данные"
                      />
                    </div>

                    <div>
                      <CFormCheck
                        id="compressOutput"
                        checked={settings.compressOutput}
                        onChange={(e) => setSettings(prev => ({ ...prev, compressOutput: e.target.checked }))}
                        label="Сжать файл"
                      />
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>

              {/* Fields Selection */}
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

                    {/* Search Fields */}
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

                    {/* Available Fields */}
                    <div className="available-fields mb-4">
                      <h6 className="small text-muted mb-2">Доступные поля</h6>
                      {fieldsLoading ? (
                        <div className="text-center py-2">
                          <CSpinner size="sm" className="me-2" />
                          Загрузка...
                        </div>
                      ) : (
                        <div className="fields-grid">
                          {filteredFields.map(field => (
                            <div
                              key={field.key}
                              className="field-chip"
                              onClick={() => addField(field)}
                              draggable="true"
                              onDragStart={(e) => startDrag(e, field)}
                              title={`Добавить ${field.label} в экспорт`}
                            >
                              <span className="field-name">{field.label}</span>
                              <CBadge 
                                color={field.sensitive ? 'warning' : 'secondary'} 
                                size="sm"
                              >
                                {field.type}
                              </CBadge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Fields */}
                    <div className="selected-fields">
                      <h6 className="small text-muted mb-2">
                        Поля в экспорте ({selectedFieldsList.length})
                        <small className="text-info ms-2">- порядок имеет значение</small>
                      </h6>
                      <div
                        className="selected-fields-area"
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={(e) => e.preventDefault()}
                      >
                        {selectedFieldsList.length === 0 ? (
                          <div className="empty-drop-zone">
                            <CIcon icon={cilList} size="lg" className="text-muted mb-2" />
                            <p className="text-muted mb-0">Перетащите поля сюда</p>
                            <small className="text-muted">Порядок полей = порядок в экспорте</small>
                          </div>
                        ) : (
                          <div className="selected-fields-list">
                            {selectedFieldsList.map((fieldItem, index) => (
                              <div
                                key={`${fieldItem.field}-${index}`}
                                className="selected-field-item"
                                draggable="true"
                                onDragStart={(e) => startDragSelected(e, index)}
                                onDrop={(e) => handleDropReorder(e, index)}
                                onDragOver={(e) => e.preventDefault()}
                              >
                                <div className="field-order">{index + 1}</div>
                                <div className="field-content">
                                  <span className="field-label">{getFieldLabel(fieldItem.field)}</span>
                                  <small className="text-muted">{fieldItem.field}</small>
                                  {fieldItem.isDuplicate && (
                                    <small className="text-info">({fieldItem.duplicateIndex})</small>
                                  )}
                                </div>
                                <div className="field-actions">
                                  <CButton
                                    size="sm"
                                    color="outline-success"
                                    onClick={() => duplicateField(index)}
                                    title="Дублировать поле"
                                  >
                                    <CIcon icon={cilCopy} size="sm" />
                                  </CButton>
                                  <CButton
                                    size="sm"
                                    color="outline-danger"
                                    onClick={() => removeFieldAt(index)}
                                    title="Удалить из экспорта"
                                  >
                                    <CIcon icon={cilX} size="sm" />
                                  </CButton>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 'preview' && (
          <div>
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
                      {previewLoading ? (
                        <CSpinner size="sm" className="me-1" />
                      ) : (
                        <CIcon icon={cilReload} className="me-1" />
                      )}
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
                    ) : previewData?.sample ? (
                      <div className="table-responsive">
                        <CTable size="sm" className="table-preview">
                          <CTableHead>
                            <CTableRow>
                              {selectedFieldsList.map((fieldItem, index) => (
                                <CTableHeaderCell key={index}>
                                  {getFieldLabel(fieldItem.field)}
                                  {fieldItem.isDuplicate && (
                                    <small className="text-muted"> ({fieldItem.duplicateIndex})</small>
                                  )}
                                </CTableHeaderCell>
                              ))}
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {previewData.sample.map((row, index) => (
                              <CTableRow key={index}>
                                {selectedFieldsList.map((fieldItem, fieldIndex) => (
                                  <CTableDataCell key={fieldIndex}>
                                    {formatPreviewValue(row[fieldItem.field], fieldItem.field)}
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
                        <span className="value">{selectedFieldsList.length}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Записей:</span>
                        <span className="value">
                          {previewData?.totalRecords ? formatNumber(previewData.totalRecords) : '—'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Размер:</span>
                        <span className="value">{previewData?.estimatedSize || '—'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Файл:</span>
                        <span className="value">{displayFilename}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Кодировка:</span>
                        <span className="value">{settings.encoding.toUpperCase()}</span>
                      </div>
                    </div>

                    {previewData?.warnings?.length > 0 && (
                      <CAlert color="warning" className="mt-3">
                        <strong>Предупреждения:</strong>
                        <ul className="mb-0 mt-1">
                          {previewData.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </CAlert>
                    )}

                    {/* Export Progress */}
                    {isExporting && (
                      <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small>Экспорт...</small>
                          <small>{exportProgress}%</small>
                        </div>
                        <CProgress>
                          <CProgressBar value={exportProgress} />
                        </CProgress>
                      </div>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="export-footer mt-4">
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Шаг {steps.findIndex(s => s.id === currentStep) + 1} из {steps.length}
          </small>
          
          <div>
            {currentStep !== 'type' && (
              <CButton
                color="light"
                onClick={prevStep}
                disabled={isExporting}
                className="me-2"
              >
                <CIcon icon={cilChevronLeft} className="me-1" />
                Назад
              </CButton>
            )}
            
            {currentStep !== 'preview' ? (
              <CButton
                color="primary"
                onClick={nextStep}
                disabled={!canProceed(currentStep) || isExporting}
              >
                Далее
                <CIcon icon={cilChevronRight} className="ms-1" />
              </CButton>
            ) : (
              <CButton
                color="success"
                onClick={executeExport}
                disabled={!isFormValid || isExporting}
              >
                {isExporting ? (
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
      </div>
    </div>
  )
}

export default ExportPanel