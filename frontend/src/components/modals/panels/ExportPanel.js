
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
import axios from 'axios'

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
  
  // Данные с сервера
  const [exportConfig, setExportConfig] = useState(null)
  const [availableFields, setAvailableFields] = useState([])
  const [statusOptions, setStatusOptions] = useState([])
  const [previewData, setPreviewData] = useState(null)
  
  // Состояния загрузки
  const [configLoading, setConfigLoading] = useState(true)
  const [fieldsLoading, setFieldsLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(true)
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
  
  // Настройки экспорта
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

  // Загрузка конфигурации экспорта
  const loadExportConfig = async () => {
    try {
      setConfigLoading(true)
      const service = await getServiceByType(type)
      
      if (service.getExportConfig) {
        const response = await service.getExportConfig()
        
        if (response.data?.success) {
          const config = response.data.data
          setExportConfig(config)
          
          setSettings(prev => ({
            ...prev,
            format: config.formats?.[0]?.value || 'csv'
          }))
        } else {
          throw new Error('Invalid config response')
        }
      } else {
        throw new Error('getExportConfig not implemented')
      }
    } catch (error) {
      console.error('Error loading export config:', error)
      
      setExportConfig({
        exportTypes: [
          { value: 'all', title: 'Все записи', description: 'Экспорт всех записей' },
          { value: 'filtered', title: 'Фильтрованный экспорт', description: 'С учетом текущих фильтров' },
          { value: 'selected', title: 'Выбранные записи', description: 'Только выбранные записи' }
        ],
        formats: [
          { value: 'csv', label: 'CSV', description: 'Таблица для Excel' },
          { value: 'json', label: 'JSON', description: 'Данные в JSON формате' },
          { value: 'txt', label: 'TXT', description: 'Текстовый файл с шаблоном' },
          { value: 'xml', label: 'XML', description: 'Данные в XML формате' }
        ]
      })
    } finally {
      setConfigLoading(false)
    }
  }

  // Загрузка доступных полей
  const loadFields = async () => {
    try {
      setFieldsLoading(true)
      const service = await getServiceByType(type)

      if (service.getExportFields) {
        const response = await service.getExportFields()

        if (response.data?.success) {
          const fields = response.data.data
          setAvailableFields(fields)

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
        } else {
          throw new Error('Invalid fields response')
        }
      } else {
        throw new Error('getExportFields not implemented')
      }
    } catch (error) {
      console.error('Error loading fields:', error)
      
      const fallbackFields = [
        { key: 'id', label: 'ID', type: 'number', defaultSelected: true },
        { key: 'status', label: 'Статус', type: 'string', defaultSelected: true },
        { key: 'createdAt', label: 'Дата создания', type: 'datetime', defaultSelected: false },
        { key: 'updatedAt', label: 'Дата обновления', type: 'datetime', defaultSelected: false },
      ]
      setAvailableFields(fallbackFields)
      
      if (selectedFieldsList.length === 0) {
        const selected = fallbackFields
          .filter(f => f.defaultSelected)
          .map(field => ({
            field: field.key,
            isDuplicate: false,
            duplicateIndex: 1,
          }))
        setSelectedFieldsList(selected)
      }
    } finally {
      setFieldsLoading(false)
    }
  }

  // Загрузка опций статуса
  const loadStatusOptions = async () => {
    try {
      setStatusLoading(true)
      
      try {
        const response = await axios.get('/api/config/statuses')
        const data = response.data
        
        if (data.success && data.data?.statuses) {
          const configType = type.toUpperCase().replace(/S$/, '')
          const typeStatuses = data.data.statuses[configType]
          
          if (typeStatuses) {
            const statusData = Object.values(typeStatuses).map(status => ({
              value: status,
              label: data.data.descriptions?.[status] || status,
              color: data.data.colors?.[status] || 'secondary'
            }))
            
            setStatusOptions(statusData)
            return
          }
        }
      } catch (configError) {
        console.warn('Could not load status config:', configError)
      }
      
      const service = await getServiceByType(type)
      
      try {
        const response = await service.getAll({ limit: 100, fields: 'status' })
        
        if (response.data?.success && response.data.data?.data) {
          const uniqueStatuses = [...new Set(
            response.data.data.data
              .map(item => item.status)
              .filter(Boolean)
          )]
          
          const statusData = uniqueStatuses.map(status => ({
            value: status,
            label: status,
            color: 'secondary'
          }))
          
          setStatusOptions(statusData)
        }
      } catch (fetchError) {
        console.warn('Could not fetch status data:', fetchError)
        
        const basicStatuses = [
          { value: 'active', label: 'Активный', color: 'success' },
          { value: 'inactive', label: 'Неактивный', color: 'secondary' },
        ]
        setStatusOptions(basicStatuses)
      }
    } catch (error) {
      console.error('Error loading status options:', error)
      
      setStatusOptions([
        { value: 'active', label: 'Активный', color: 'success' },
        { value: 'inactive', label: 'Неактивный', color: 'secondary' },
      ])
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
      
      if (service.export) {
        const response = await service.export(exportParams)
        
        if (response.data?.success) {
          setPreviewData(response.data.data)
        } else {
          setPreviewError(response.data?.message || 'Ошибка при загрузке предпросмотра')
        }
      } else {
        const fakePreview = {
          totalRecords: 100,
          previewRecords: 5,
          fields: selectedFieldsList.map(item => item.field),
          data: Array(5).fill(null).map((_, i) => {
            const record = { id: i + 1 }
            selectedFieldsList.forEach(item => {
              if (item.field !== 'id') {
                record[item.field] = `${item.field}_${i + 1}`
              }
            })
            return record
          })
        }
        setPreviewData(fakePreview)
      }
    } catch (error) {
      console.error('Preview error:', error)
      setPreviewError(`Ошибка при загрузке предпросмотра: ${error.message}`)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Вспомогательные функции
  const validateSettings = () => {
    if (!settings.format || selectedFieldsList.length === 0) return false
    if (settings.exportType === 'by_user_id' && settings.userIds.length === 0) return false
    if (settings.exportType === 'selected' && selectedIds.length === 0) return false
    return true
  }

  const previewTemplate = (template) => {
    return template.replace(/{(\w+)}/g, (match, field) => {
      const sampleField = availableFields.find(f => f.key === field)
      if (sampleField) {
        if (sampleField.sensitive && settings.maskPasswords) {
          return '****'
        }
        
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

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status)
    return statusOption?.color || 'secondary'
  }

  // Управление полями
  const addField = (field) => {
    const existingCount = selectedFieldsList.filter(item => item.field === field.key).length
    setSelectedFieldsList(prev => [...prev, {
      field: field.key,
      isDuplicate: existingCount > 0,
      duplicateIndex: existingCount + 1,
    }])
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
    
    const fieldsOfType = selectedFieldsList.filter(item => item.field === removedField.field)
    fieldsOfType.forEach((item, idx) => {
      item.isDuplicate = idx > 0
      item.duplicateIndex = idx + 1
    })
  }

  const duplicateField = (index) => {
    const fieldItem = selectedFieldsList[index]
    const existingCount = selectedFieldsList.filter(item => item.field === fieldItem.field).length
    
    const newItem = {
      field: fieldItem.field,
      isDuplicate: true,
      duplicateIndex: existingCount + 1,
    }
    
    setSelectedFieldsList(prev => [
      ...prev.slice(0, index + 1),
      newItem,
      ...prev.slice(index + 1)
    ])
  }

  const handleDragStart = (e, field) => {
    draggedField.current = field
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragStartSelected = (e, index) => {
    draggedIndex.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.target.classList.add('dragging')
  }

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging')
    draggedField.current = null
    draggedIndex.current = null
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = draggedField.current ? 'copy' : 'move'
    e.currentTarget.classList.add('drag-over')
  }

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    
    if (draggedField.current) {
      addField(draggedField.current)
      draggedField.current = null
    }
  }

  const handleDropReorder = (e, targetIndex) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    
    if (draggedIndex.current !== null && draggedIndex.current !== targetIndex) {
      const item = selectedFieldsList[draggedIndex.current]
      const newList = [...selectedFieldsList]
      newList.splice(draggedIndex.current, 1)
      newList.splice(targetIndex, 0, item)
      setSelectedFieldsList(newList)
      
      const fieldsOfType = newList.filter(f => f.field === item.field)
      fieldsOfType.forEach((f, idx) => {
        f.isDuplicate = idx > 0
        f.duplicateIndex = idx + 1
      })
    }
    draggedIndex.current = null
  }

  // Навигация
  const nextStep = () => {
    const stepOrder = ['type', 'format', 'preview']
    const currentIndex = stepOrder.indexOf(currentStep)
    
    if (currentIndex < stepOrder.length - 1) {
      const nextStepId = stepOrder[currentIndex + 1]
      setCurrentStep(nextStepId)
      
      if (nextStepId === 'preview') {
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

  // Вспомогательные функции
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

  // Выполнение экспорта
  const executeExport = async () => {
    if (!validateSettings()) {
      toast.error('Проверьте настройки экспорта')
      return
    }

    let progressInterval = null

    try {
      setIsExporting(true)
      setExportProgress(0)
      
      progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const exportParams = {
        format: settings.format,
        fields: selectedFieldsList.map(item => item.field),
        filename: settings.filename || `export-${new Date().toISOString().split('T')[0]}`,
        includeHeader: settings.includeHeader,
        delimiter: settings.csvDelimiter,
        template: settings.template,
        includeSensitive: settings.includeSensitive,
        compressOutput: settings.compressOutput,
      }

      if (settings.exportType === 'filtered') {
        exportParams.filters = {
          ...currentFilters,
          status: settings.statusFilters.length > 0 ? settings.statusFilters : undefined,
          search: settings.searchQuery || undefined,
          dateFrom: settings.dateFrom || undefined,
          dateTo: settings.dateTo || undefined,
        }
      } else if (settings.exportType === 'selected') {
        exportParams.ids = selectedIds
      } else if (settings.exportType === 'by_user_id') {
        exportParams.ids = settings.userIds
      }

      const service = await getServiceByType(type)
      
      let response
      
      if (service.export) {
        response = await service.export(exportParams)
      } else {
        response = await axios.post(`/api/${type}/export`, exportParams, {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      }

      clearInterval(progressInterval)
      setExportProgress(100)

      handleExportResponse(response, exportParams)

    } catch (error) {
      console.error('Export error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Ошибка экспорта'
      toast.error(errorMessage)
      
      if (onError) {
        onError(error)
      }
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const handleExportResponse = (response, exportParams) => {
    try {
      let blob
      let filename = `${exportParams.filename}.${exportParams.format}`

      if (response.data instanceof Blob) {
        blob = response.data
        
        const contentDisposition = response.headers?.['content-disposition']
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '')
          }
        }
      } else if (response.data?.success && response.data?.content) {
        const contentType = getContentType(exportParams.format)
        blob = new Blob([response.data.content], { type: contentType })
        
        if (response.data.filename) {
          filename = response.data.filename
        }
      } else if (response.data?.success && response.data?.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank')
        
        toast.success('Экспорт завершен успешно!')
        if (onSuccess) {
          onSuccess({
            filename,
            format: exportParams.format,
            recordCount: response.data.recordCount || 0,
            type: 'export'
          })
        }
        return
      } else if (typeof response.data === 'string' || response.data instanceof ArrayBuffer) {
        const contentType = response.headers?.['content-type'] || getContentType(exportParams.format)
        blob = new Blob([response.data], { type: contentType })
      } else {
        throw new Error('Неподдерживаемый формат ответа')
      }

      if (blob) {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }, 100)
        
        toast.success('Экспорт завершен успешно!')
        if (onSuccess) {
          onSuccess({
            filename,
            format: exportParams.format,
            recordCount: previewData?.totalRecords || 0,
            type: 'export'
          })
        }
      }
    } catch (error) {
      console.error('Error handling export response:', error)
      toast.error('Ошибка при обработке результата экспорта')
    }
  }

  const getContentType = (format) => {
    const types = {
      csv: 'text/csv; charset=utf-8',
      json: 'application/json; charset=utf-8',
      txt: 'text/plain; charset=utf-8',
      xml: 'application/xml; charset=utf-8',
    }
    return types[format] || 'application/octet-stream'
  }

  // Инициализация
  useEffect(() => {
    loadExportConfig()
    loadFields()
    loadStatusOptions()
  }, [type])

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isExporting)
    }
  }, [isExporting, onLoadingChange])

  const isStepCompleted = (stepId) => {
    const stepIndex = steps.findIndex(s => s.id === stepId)
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    return stepIndex < currentIndex
  }

  const formatPreviewValue = (value, field) => {
    if (value === null || value === undefined) return '—'
    
    const str = String(value)
    
    const sensitiveField = availableFields.find(f => f.key === field)
    if (sensitiveField?.sensitive && settings.maskPasswords) {
      return '****'
    }
    
    if (str.length > 30) {
      return str.substring(0, 27) + '...'
    }
    
    return str
  }

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

  const exportTypeOptions = exportConfig?.exportTypes || []
  const formatOptions = exportConfig?.formats || []

  if (configLoading || fieldsLoading || statusLoading) {
    return (
      <div className="modal-loading">
        <CSpinner className="me-2" />
        <span className="loading-text">Загрузка конфигурации экспорта...</span>
      </div>
    )
  }

  return (
    <div className="export-panel modal-responsive">
      <div className="progress-steps mb-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`step ${currentStep === step.id ? 'active' : ''} ${isStepCompleted(step.id) ? 'completed' : ''}`}
            onClick={() => canProceed(step.id) && setCurrentStep(step.id)}
          >
            <div className="step-number">
              {isStepCompleted(step.id) ? (
                <CIcon icon={cilCheckCircle} />
              ) : (
                index + 1
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
                    {exportTypeOptions.map(option => (
                      <label
                        key={option.value}
                        className={`export-type ${settings.exportType === option.value ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          value={option.value}
                          checked={settings.exportType === option.value}
                          onChange={() => setSettings(prev => ({ ...prev, exportType: option.value }))}
                        />
                        <div className="content">
                          <div className="title">{option.title}</div>
                          <div className="description">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {settings.exportType === 'by_user_id' && (
                    <div className="mt-3">
                      <CFormLabel>User ID (по одному на строку):</CFormLabel>
                      <CFormTextarea
                        rows={4}
                        value={userIdsText}
                        onChange={(e) => setUserIdsText(e.target.value)}
                        onBlur={updateUserIds}
                        placeholder="USER123\nUSER456"
                        className="form-control"
                      />
                      <small className="text-muted">Введено: {settings.userIds.length}</small>
                    </div>
                  )}

                  {settings.exportType === 'selected' && (
                    <div className="mt-3">
                      <CAlert color="info">
                        <CIcon icon={cilCheckCircle} className="me-2" />
                        Выбрано аккаунтов: <strong>{selectedIds.length}</strong>
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
                        onClick={clearAllFilters}
                      >
                        Очистить
                      </CButton>
                    )}
                  </div>

                  <div className="mb-3">
                    <CFormLabel>Статусы</CFormLabel>
                    <div className="filter-search mb-2">
                      <CFormInput
                        type="text"
                        value={statusSearchQuery}
                        onChange={(e) => setStatusSearchQuery(e.target.value)}
                        placeholder="Поиск статусов..."
                        className="form-control form-control-sm"
                      />
                    </div>
                    <div className="status-list">
                      {filteredStatusOptions.map(option => (
                        <label
                          key={option.value}
                          className="status-item"
                        >
                          <input
                            type="checkbox"
                            value={option.value}
                            checked={settings.statusFilters.includes(option.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSettings(prev => ({
                                  ...prev,
                                  statusFilters: [...prev.statusFilters, option.value]
                                }))
                              } else {
                                setSettings(prev => ({
                                  ...prev,
                                  statusFilters: prev.statusFilters.filter(s => s !== option.value)
                                }))
                              }
                            }}
                          />
                          <CBadge color={option.color} className="ms-2">
                            {option.label}
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

                  <div>
                    <CFormLabel>Поиск</CFormLabel>
                    <CFormInput
                      type="text"
                      value={settings.searchQuery}
                      placeholder="Поиск по всем полям..."
                      onChange={(e) => setSettings(prev => ({ ...prev, searchQuery: e.target.value }))}
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
                  <div className="export-types mb-3">
                    {formatOptions.map(format => (
                      <label
                        key={format.value}
                        className={`export-type ${settings.format === format.value ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          value={format.value}
                          checked={settings.format === format.value}
                          onChange={() => setSettings(prev => ({ ...prev, format: format.value }))}
                        />
                        <div className="content">
                          <div className="title">{format.label}</div>
                          <div className="description">{format.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {settings.format === 'csv' && (
                    <div>
                      <div className="mb-3">
                        <CFormLabel>Разделитель</CFormLabel>
                        <CFormSelect
                          value={settings.csvDelimiter}
                          onChange={(e) => setSettings(prev => ({ ...prev, csvDelimiter: e.target.value }))}
                        >
                          <option value=",">Запятая (,)</option>
                          <option value=";">Точка с запятой (;)</option>
                          <option value="\t">Табуляция</option>
                          <option value="|">Вертикальная черта (|)</option>
                        </CFormSelect>
                      </div>
                      <CFormCheck
                        id="includeHeader"
                        label="Включить заголовок"
                        checked={settings.includeHeader}
                        onChange={(e) => setSettings(prev => ({ ...prev, includeHeader: e.target.checked }))}
                        className="mb-2"
                      />
                    </div>
                  )}

                  {settings.format === 'txt' && (
                    <div>
                      <div className="mb-3">
                        <CFormLabel>Шаблон строки</CFormLabel>
                        <CFormTextarea
                          value={settings.template}
                          onChange={(e) => setSettings(prev => ({ ...prev, template: e.target.value }))}
                          rows={3}
                          placeholder="{login}:{password}:{email}"
                          className="form-control template-input"
                        />
                        <small className="text-muted">
                          Перетащите поля из списка справа или введите вручную
                        </small>
                      </div>
                      {settings.template && (
                        <div className="mb-3">
                          <CFormLabel>Предпросмотр</CFormLabel>
                          <div className="preview-box">
                            <pre>{templatePreview}</pre>
                          </div>
                        </div>
                      )}
                      <CButton
                        size="sm"
                        color="outline-primary"
                        onClick={applyAutoTemplate}
                        className="mt-2"
                        disabled={selectedFieldsList.length === 0}
                      >
                        Применить авто-шаблон
                      </CButton>
                    </div>
                  )}

                  {(settings.format === 'json' || settings.format === 'xml') && (
                    <div className="mb-3">
                      <CFormLabel>Предпросмотр формата</CFormLabel>
                      <div className="preview-box">
                        <pre>
                          {settings.format === 'json' ? 
                            JSON.stringify(
                              selectedFieldsList.map(item => ({ [item.field]: `${item.field}_sample` })),
                              null,
                              2
                            ) : 
                            `<?xml version="1.0" encoding="${settings.encoding}"?>
<records>
  <record>
${selectedFieldsList.map(item => `    <${item.field}>${item.field}_sample</${item.field}>`).join('\n')}
  </record>
</records>`}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <CFormLabel>Кодировка</CFormLabel>
                    <CFormSelect
                      value={settings.encoding}
                      onChange={(e) => setSettings(prev => ({ ...prev, encoding: e.target.value }))}
                    >
                      <option value="utf-8">UTF-8</option>
                      <option value="windows-1251">Windows-1251</option>
                    </CFormSelect>
                  </div>

                  <div className="mb-3">
                    <CFormLabel>Имя файла</CFormLabel>
                    <CInputGroup>
                      <CFormInput
                        value={settings.filename}
                        onChange={(e) => setSettings(prev => ({ ...prev, filename: e.target.value }))}
                        placeholder={defaultFilename}
                      />
                      <CInputGroupText>.{settings.format}</CInputGroupText>
                    </CInputGroup>
                  </div>

                  <CFormCheck
                    id="maskPasswords"
                    label="Маскировать пароли"
                    checked={settings.maskPasswords}
                    onChange={(e) => setSettings(prev => ({ ...prev, maskPasswords: e.target.checked }))}
                    className="mb-2"
                  />
                  <CFormCheck
                    id="compressOutput"
                    label="Сжать файл"
                    checked={settings.compressOutput}
                    onChange={(e) => setSettings(prev => ({ ...prev, compressOutput: e.target.checked }))}
                  />
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={6}>
              <CCard>
                <CCardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6>Поля для формата экспорта</h6>
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

                  {settings.format === 'csv' && (
                    <div className="mb-3">
                      <CFormLabel>Порядок колонок в CSV:</CFormLabel>
                      <div className="format-preview-csv">
                        {selectedFieldsList.length === 0 ? (
                          <div className="text-muted small">
                            Выберите поля ниже для формирования колонок
                          </div>
                        ) : (
                          <div className="csv-columns">
                            {selectedFieldsList.map((fieldItem, index) => (
                              <span key={index} className="csv-column">
                                {getFieldLabel(fieldItem.field)}
                                {fieldItem.isDuplicate && (
                                  <small>({fieldItem.duplicateIndex})</small>
                                )}
                                {index < selectedFieldsList.length - 1 && (
                                  <span className="delimiter">{settings.csvDelimiter || ','}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {settings.format === 'txt' && (
                    <div className="mb-3">
                      <CFormLabel>Формат строки:</CFormLabel>
                      <div className="format-preview-txt">
                        {!settings.template && selectedFieldsList.length > 0 ? (
                          <div className="auto-template">
                            <small className="text-muted">Автоматический шаблон:</small>
                            <div className="template-auto">{autoTemplatePreview}</div>
                            <CButton
                              size="sm"
                              color="outline-primary"
                              onClick={applyAutoTemplate}
                              className="mt-2"
                            >
                              Применить
                            </CButton>
                          </div>
                        ) : settings.template ? (
                          <div className="template-current">
                            <small className="text-muted">Текущий шаблон:</small>
                            <div className="template-display">{settings.template}</div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {(settings.format === 'json' || settings.format === 'xml') && (
                    <div className="mb-3">
                      <CFormLabel>Порядок полей:</CFormLabel>
                      <div className={`format-preview-${settings.format}`}>
                        {selectedFieldsList.length === 0 ? (
                          <div className="text-muted small">
                            Выберите поля ниже для формирования структуры
                          </div>
                        ) : (
                          <div className="format-columns">
                            {selectedFieldsList.map((fieldItem, index) => (
                              <span key={index} className="format-column">
                                {getFieldLabel(fieldItem.field)}
                                {fieldItem.isDuplicate && (
                                  <small>({fieldItem.duplicateIndex})</small>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <CFormInput
                    type="text"
                    value={fieldsSearchQuery}
                    onChange={(e) => setFieldsSearchQuery(e.target.value)}
                    placeholder="Поиск полей..."
                    className="mb-3"
                  />

                  <div className="available-fields mb-4">
                    <h6 className="small text-muted mb-2">
                      Доступные поля (перетащите или кликните для добавления в формат)
                    </h6>
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
                            draggable
                            onDragStart={(e) => handleDragStart(e, field)}
                            title={`Добавить ${field.label || field.key} в формат экспорта`}
                          >
                            <span className="field-name">{field.label || field.key}</span>
                            <CBadge color="secondary" size="sm">
                              {field.type || 'text'}
                            </CBadge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="selected-fields">
                    <h6 className="small text-muted mb-2">
                      Поля в формате экспорта ({selectedFieldsList.length}) <small className="text-info">- порядок имеет значение</small>
                    </h6>
                    <div
                      className="selected-fields-area"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      {selectedFieldsList.length === 0 ? (
                        <div className="empty-drop-zone">
                          <CIcon icon={cilList} size="lg" className="text-muted mb-2" />
                          <p className="text-muted mb-0">
                            Перетащите поля сюда для формирования {settings.format.toUpperCase()} формата
                          </p>
                          <small className="text-muted">
                            Порядок полей = порядок {settings.format === 'csv' ? 'колонок' : settings.format === 'txt' ? 'в шаблоне' : 'в структуре'}
                          </small>
                        </div>
                      ) : (
                        <div className="selected-fields-list">
                          {selectedFieldsList.map((fieldItem, index) => (
                            <div
                              key={`${fieldItem.field}-${index}`}
                              className="selected-field-item"
                              draggable
                              onDragStart={(e) => handleDragStartSelected(e, index)}
                              onDragEnd={handleDragEnd}
                              onDrop={(e) => handleDropReorder(e, index)}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                            >
                              <div className="field-order">{index + 1}</div>
                              <div className="field-content">
                                <span className="field-label">{getFieldLabel(fieldItem.field)}</span>
                                <small className="text-muted">{fieldItem.field}</small>
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
                                  title="Удалить из формата"
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
                    <CAlert color="danger">{previewError}</CAlert>
                  ) : previewData ? (
                    <div className="table-responsive">
                      {settings.format === 'txt' && settings.template ? (
                        <div className="preview-box">
                          <pre>
                            {previewData.data?.slice(0, 5).map((row, i) => {
                              let line = settings.template
                              selectedFieldsList.forEach(item => {
                                const value = row[item.field] || ''
                                line = line.replace(`{${item.field}}`, formatPreviewValue(value, item.field))
                              })
                              return line
                            }).join('\n')}
                          </pre>
                        </div>
                      ) : (
                        <CTable className="table-dark-compatible" small>
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
                            {previewData.data?.slice(0, 10).map((row, index) => (
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
                      )}
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
                  <h6>Информация</h6>
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
                      <span className="value">{formatNumber(previewData?.totalRecords) || '—'}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Файл:</span>
                      <span className="value">{displayFilename}</span>
                    </div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </div>
      )}

      {isExporting && (
        <div className="export-progress">
          <div className="progress-title">
            <CIcon icon={cilCloudDownload} />
            Экспорт данных...
          </div>
          <CProgress>
            <CProgressBar value={exportProgress} animated />
          </CProgress>
          <div className="progress-text">{exportProgress}%</div>
        </div>
      )}

      <div className="export-actions">
        <div className="d-flex justify-content-between align-items-center w-100">
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
              </CButton>
            ) : (
              <CButton
                color="success"
                onClick={executeExport}
                disabled={isExporting || !isFormValid}
              >
                {isExporting ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Экспортируется...
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
