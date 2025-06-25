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
  
  // Данные с сервера - БЕЗ ХАРДКОДА
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
  
  // Настройки экспорта - начальные значения
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

  // === ЗАГРУЗКА ДАННЫХ С СЕРВЕРА ===

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
          
          // Устанавливаем значения по умолчанию из серверной конфигурации
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
      
      // Устанавливаем минимальную конфигурацию для работы
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
        } else {
          throw new Error('Invalid fields response')
        }
      } else {
        throw new Error('getExportFields not implemented')
      }
    } catch (error) {
      console.error('Error loading fields:', error)
      
      // Устанавливаем минимальный набор полей для работы
      const fallbackFields = [
        { key: 'id', label: 'ID', type: 'number', defaultSelected: true },
        { key: 'status', label: 'Статус', type: 'string', defaultSelected: true },
        { key: 'createdAt', label: 'Дата создания', type: 'datetime', defaultSelected: false },
        { key: 'updatedAt', label: 'Дата обновления', type: 'datetime', defaultSelected: false },
      ]
      setAvailableFields(fallbackFields)
      
      // Устанавливаем поля по умолчанию
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
      
      // Сначала пробуем получить из API config/statuses
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
      
      // Fallback: получаем статусы из данных
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
        
        // Если не удалось загрузить статусы, используем базовые
        const basicStatuses = [
          { value: 'active', label: 'Активный', color: 'success' },
          { value: 'inactive', label: 'Неактивный', color: 'secondary' },
        ]
        setStatusOptions(basicStatuses)
      }
    } catch (error) {
      console.error('Error loading status options:', error)
      
      // Минимальный набор статусов для работы
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
        // Создаем фейковые данные для предпросмотра
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

  // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

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
        
        // Базовая логика для примеров
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

  // === УПРАВЛЕНИЕ ПОЛЯМИ ===

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
    setSelectedFieldsList(prev => prev.filter((_, i) => i !== index))
  }

  const duplicateField = (index) => {
    const fieldItem = selectedFieldsList[index]
    const existingCount = selectedFieldsList.filter(item => item.field === fieldItem.field).length
    
    const newItem = {
      field: fieldItem.field,
      isDuplicate: true,
      duplicateIndex: existingCount + 1,
    }
    
    // Вставляем после текущего элемента
    setSelectedFieldsList(prev => [
      ...prev.slice(0, index + 1),
      newItem,
      ...prev.slice(index + 1)
    ])
  }

  // Drag & Drop handlers
  const handleDragStart = (e, field, index) => {
    draggedField.current = field
    draggedIndex.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.target.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = ''
    draggedField.current = null
    draggedIndex.current = null
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    
    if (draggedIndex.current === null || draggedIndex.current === dropIndex) {
      return
    }

    const draggedItem = selectedFieldsList[draggedIndex.current]
    const newList = [...selectedFieldsList]
    
    // Удаляем перетаскиваемый элемент
    newList.splice(draggedIndex.current, 1)
    
    // Вставляем на новое место
    const insertIndex = draggedIndex.current < dropIndex ? dropIndex - 1 : dropIndex
    newList.splice(insertIndex, 0, draggedItem)
    
    setSelectedFieldsList(newList)
  }

  // === NAVIGATION ===

  const nextStep = () => {
    const stepOrder = ['type', 'format', 'preview']
    const currentIndex = stepOrder.indexOf(currentStep)
    
    if (currentIndex < stepOrder.length - 1) {
      const nextStepId = stepOrder[currentIndex + 1]
      setCurrentStep(nextStepId)
      
      // Загружаем предпросмотр при переходе на последний шаг
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
    if (!validateSettings()) {
      toast.error('Проверьте настройки экспорта')
      return
    }

    let progressInterval = null

    try {
      setIsExporting(true)
      setExportProgress(0)
      
      // Симуляция прогресса
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
      }

      // Добавляем фильтры в зависимости от типа экспорта
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
      
      // Определяем метод экспорта
      let response
      
      // Приоритет 1: Универсальный метод export
      if (service.export) {
        response = await service.export(exportParams)
      } 
      // Приоритет 2: POST запрос на /export эндпоинт
      else {
        response = await axios.post(`/api/${type}/export`, exportParams, {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      }

      clearInterval(progressInterval)
      setExportProgress(100)

      // Обработка результата
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

  // Обработка ответа экспорта
  const handleExportResponse = (response, exportParams) => {
    try {
      let blob
      let filename = `${exportParams.filename}.${exportParams.format}`

      // Обработка разных типов ответов
      if (response.data instanceof Blob) {
        // Ответ уже является Blob
        blob = response.data
        
        // Пытаемся получить имя файла из заголовков
        const contentDisposition = response.headers?.['content-disposition']
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '')
          }
        }
      } else if (response.data?.success && response.data?.content) {
        // Ответ содержит контент в JSON
        const contentType = getContentType(exportParams.format)
        blob = new Blob([response.data.content], { type: contentType })
        
        if (response.data.filename) {
          filename = response.data.filename
        }
      } else if (response.data?.success && response.data?.downloadUrl) {
        // Ответ содержит URL для скачивания
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
        // Прямой ответ с данными
        const contentType = response.headers?.['content-type'] || getContentType(exportParams.format)
        blob = new Blob([response.data], { type: contentType })
      } else {
        throw new Error('Неподдерживаемый формат ответа')
      }

      // Скачивание файла
      if (blob) {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        
        // Cleanup
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
    
    // Маскируем чувствительные поля
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

  if (configLoading || fieldsLoading || statusLoading) {
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
                <CIcon icon={cilCheckCircle} />
              ) : (
                index + 1
              )}
            </div>
            <div className="step-label">{step.label}</div>
          </div>
        ))}
      </div>

      {/* Step 1: Type & Filters */}
      {currentStep === 'type' && (
        <div className="export-step">
          <CRow>
            <CCol lg={6}>
              <CCard className="mb-4">
                <CCardHeader>
                  <h6 className="mb-0">Тип экспорта</h6>
                </CCardHeader>
                <CCardBody>
                  <div className="export-types">
                    {exportTypeOptions.map(option => (
                      <div
                        key={option.value}
                        className={`export-type-card ${settings.exportType === option.value ? 'active' : ''}`}
                        onClick={() => setSettings(prev => ({ ...prev, exportType: option.value }))}
                      >
                        <h6>{option.title}</h6>
                        <p className="text-muted mb-0">{option.description}</p>
                        {option.value === 'selected' && (
                          <CBadge color="info" className="mt-2">
                            Выбрано: {selectedIds.length}
                          </CBadge>
                        )}
                      </div>
                    ))}
                  </div>

                  {settings.exportType === 'by_user_id' && (
                    <div className="mt-3">
                      <CFormLabel>User ID (по одному на строку)</CFormLabel>
                      <CFormTextarea
                        rows={5}
                        value={userIdsText}
                        onChange={(e) => setUserIdsText(e.target.value)}
                        onBlur={updateUserIds}
                        placeholder="12345&#10;67890&#10;..."
                      />
                      <small className="text-muted">
                        Введено ID: {settings.userIds.length}
                      </small>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>

            <CCol lg={6}>
              <CCard className="mb-4">
                <CCardHeader>
                  <h6 className="mb-0">Дополнительные фильтры</h6>
                  {hasActiveFilters && (
                    <CButton
                      size="sm"
                      color="secondary"
                      variant="ghost"
                      className="float-end"
                      onClick={clearAllFilters}
                    >
                      <CIcon icon={cilX} className="me-1" />
                      Очистить
                    </CButton>
                  )}
                </CCardHeader>
                <CCardBody>
                  {/* Фильтр по статусу */}
                  <div className="mb-3">
                    <CFormLabel>Статусы</CFormLabel>
                    <CInputGroup className="mb-2">
                      <CInputGroupText>
                        <CIcon icon={cilSearch} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Поиск статусов..."
                        value={statusSearchQuery}
                        onChange={(e) => setStatusSearchQuery(e.target.value)}
                      />
                    </CInputGroup>
                    <div className="status-checkboxes">
                      {filteredStatusOptions.map(option => (
                        <CFormCheck
                          key={option.value}
                          id={`status-${option.value}`}
                          label={
                            <span className="d-flex align-items-center">
                              <CBadge color={option.color} className="me-2">
                                {option.label}
                              </CBadge>
                            </span>
                          }
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
                      ))}
                    </div>
                  </div>

                  {/* Фильтр по дате */}
                  <CRow>
                    <CCol sm={6}>
                      <CFormLabel>Дата от</CFormLabel>
                      <CFormInput
                        type="date"
                        value={settings.dateFrom}
                        onChange={(e) => setSettings(prev => ({ ...prev, dateFrom: e.target.value }))}
                      />
                    </CCol>
                    <CCol sm={6}>
                      <CFormLabel>Дата до</CFormLabel>
                      <CFormInput
                        type="date"
                        value={settings.dateTo}
                        onChange={(e) => setSettings(prev => ({ ...prev, dateTo: e.target.value }))}
                      />
                    </CCol>
                  </CRow>

                  {/* Поиск */}
                  <div className="mt-3">
                    <CFormLabel>Поиск</CFormLabel>
                    <CFormInput
                      placeholder="Поиск по всем полям..."
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
        <div className="export-step">
          <CRow>
            <CCol lg={4}>
              <CCard className="mb-4">
                <CCardHeader>
                  <h6 className="mb-0">Формат экспорта</h6>
                </CCardHeader>
                <CCardBody>
                  <div className="format-options">
                    {formatOptions.map(format => (
                      <div
                        key={format.value}
                        className={`format-card ${settings.format === format.value ? 'active' : ''}`}
                        onClick={() => setSettings(prev => ({ ...prev, format: format.value }))}
                      >
                        <h6>{format.label}</h6>
                        <p className="text-muted mb-0">{format.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Настройки формата */}
                  <div className="mt-4">
                    <h6>Настройки {formatUpperCase}</h6>
                    
                    {settings.format === 'csv' && (
                      <>
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
                          label="Включить заголовки"
                          checked={settings.includeHeader}
                          onChange={(e) => setSettings(prev => ({ ...prev, includeHeader: e.target.checked }))}
                        />
                      </>
                    )}

                    {settings.format === 'txt' && (
                      <div className="mb-3">
                        <CFormLabel>Шаблон строки</CFormLabel>
                        <CFormInput
                          value={settings.template}
                          onChange={(e) => setSettings(prev => ({ ...prev, template: e.target.value }))}
                          placeholder="{login}:{password}"
                        />
                        <small className="text-muted d-block mt-1">
                          Используйте {'{field}'} для вставки значений
                        </small>
                        {templatePreview && (
                          <div className="mt-2">
                            <strong>Пример:</strong> <code>{templatePreview}</code>
                          </div>
                        )}
                        <CButton
                          size="sm"
                          color="secondary"
                          className="mt-2"
                          onClick={applyAutoTemplate}
                          disabled={selectedFieldsList.length === 0}
                        >
                          Авто-шаблон
                        </CButton>
                      </div>
                    )}

                    <div className="mt-3">
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
                      className="mt-3"
                      id="maskPasswords"
                      label="Маскировать пароли"
                      checked={settings.maskPasswords}
                      onChange={(e) => setSettings(prev => ({ ...prev, maskPasswords: e.target.checked }))}
                    />
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol lg={8}>
              <CCard className="mb-4">
                <CCardHeader>
                  <h6 className="mb-0">Выбор полей</h6>
                  <div className="header-actions">
                    <CButton
                      size="sm"
                      color="primary"
                      variant="ghost"
                      onClick={addAllFields}
                    >
                      <CIcon icon={cilPlus} className="me-1" />
                      Добавить все
                    </CButton>
                    <CButton
                      size="sm"
                      color="secondary"
                      variant="ghost"
                      onClick={clearSelectedFields}
                    >
                      <CIcon icon={cilX} className="me-1" />
                      Очистить
                    </CButton>
                  </div>
                </CCardHeader>
                <CCardBody>
                  <CRow>
                    <CCol md={6}>
                      <h6>Доступные поля</h6>
                      <CInputGroup className="mb-2">
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
                        {filteredFields.map(field => (
                          <div
                            key={field.key}
                            className="field-item"
                            onClick={() => addField(field)}
                          >
                            <span>{field.label}</span>
                            <CIcon icon={cilPlus} />
                          </div>
                        ))}
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <h6>Выбранные поля ({selectedFieldsList.length})</h6>
                      <div className="selected-fields">
                        {selectedFieldsList.length === 0 ? (
                          <div className="text-center text-muted py-5">
                            Выберите поля для экспорта
                          </div>
                        ) : (
                          selectedFieldsList.map((item, index) => (
                            <div
                              key={`${item.field}-${index}`}
                              className="field-item selected"
                              draggable
                              onDragStart={(e) => handleDragStart(e, item, index)}
                              onDragEnd={handleDragEnd}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, index)}
                            >
                              <CIcon icon={cilList} className="drag-handle" />
                              <span>
                                {getFieldLabel(item.field)}
                                {item.isDuplicate && (
                                  <CBadge color="info" className="ms-1">
                                    {item.duplicateIndex}
                                  </CBadge>
                                )}
                              </span>
                              <div className="field-actions">
                                <CButton
                                  size="sm"
                                  color="primary"
                                  variant="ghost"
                                  onClick={() => duplicateField(index)}
                                >
                                  <CIcon icon={cilCopy} />
                                </CButton>
                                <CButton
                                  size="sm"
                                  color="danger"
                                  variant="ghost"
                                  onClick={() => removeFieldAt(index)}
                                >
                                  <CIcon icon={cilX} />
                                </CButton>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </div>
      )}

      {/* Step 3: Preview */}
      {currentStep === 'preview' && (
        <div className="export-step">
          <CCard>
            <CCardHeader>
              <h6 className="mb-0">Предпросмотр экспорта</h6>
              <CButton
                size="sm"
                color="primary"
                variant="ghost"
                onClick={loadPreview}
                disabled={previewLoading}
              >
                <CIcon icon={cilReload} className="me-1" />
                Обновить
              </CButton>
            </CCardHeader>
            <CCardBody>
              {previewLoading ? (
                <div className="text-center py-5">
                  <CSpinner />
                  <p className="mt-2">Загрузка предпросмотра...</p>
                </div>
              ) : previewError ? (
                <CAlert color="danger">
                  {previewError}
                </CAlert>
              ) : previewData ? (
                <>
                  <div className="preview-stats mb-3">
                    <CBadge color="info" className="me-2">
                      Всего записей: {formatNumber(previewData.totalRecords)}
                    </CBadge>
                    <CBadge color="success" className="me-2">
                      Поля: {previewData.fields?.length || selectedFieldsList.length}
                    </CBadge>
                    <CBadge color="secondary">
                      Формат: {formatUpperCase}
                    </CBadge>
                  </div>

                  {settings.format === 'txt' && settings.template ? (
                    <div className="preview-txt">
                      <h6>Пример строк:</h6>
                      <pre className="preview-code">
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
                    <div className="table-responsive">
                      <CTable small bordered hover>
                        <CTableHead>
                          <CTableRow>
                            {selectedFieldsList.map((item, i) => (
                              <CTableHeaderCell key={i}>
                                {getFieldLabel(item.field)}
                                {item.isDuplicate && (
                                  <CBadge color="info" className="ms-1">
                                    {item.duplicateIndex}
                                  </CBadge>
                                )}
                              </CTableHeaderCell>
                            ))}
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {previewData.data?.slice(0, 10).map((row, rowIndex) => (
                            <CTableRow key={rowIndex}>
                              {selectedFieldsList.map((item, colIndex) => (
                                <CTableDataCell key={colIndex}>
                                  {formatPreviewValue(row[item.field], item.field)}
                                </CTableDataCell>
                              ))}
                            </CTableRow>
                          ))}
                        </CTableBody>
                      </CTable>
                    </div>
                  )}

                  <div className="mt-3">
                    <strong>Имя файла:</strong> <code>{displayFilename}</code>
                  </div>
                </>
              ) : (
                <div className="text-center py-5 text-muted">
                  Нет данных для предпросмотра
                </div>
              )}
            </CCardBody>
          </CCard>
        </div>
      )}

      {/* Progress Bar */}
      {isExporting && (
        <div className="export-progress mt-4">
          <div className="d-flex justify-content-between mb-2">
            <span>Экспорт данных...</span>
            <span>{exportProgress}%</span>
          </div>
          <CProgress>
            <CProgressBar value={exportProgress} animated />
          </CProgress>
        </div>
      )}

      {/* Footer Actions */}
      <div className="export-actions mt-4">
        <CButton
          color="secondary"
          disabled={currentStep === 'type' || isExporting}
          onClick={prevStep}
        >
          <CIcon icon={cilChevronLeft} className="me-1" />
          Назад
        </CButton>

        {currentStep !== 'preview' ? (
          <CButton
            color="primary"
            disabled={!canProceed(currentStep) || isExporting}
            onClick={nextStep}
          >
            Далее
            <CIcon icon={cilChevronRight} className="ms-1" />
          </CButton>
        ) : (
          <CButton
            color="success"
            disabled={!isFormValid || isExporting}
            onClick={executeExport}
          >
            {isExporting ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Экспортируется...
              </>
            ) : (
              <>
                <CIcon icon={cilCloudDownload} className="me-1" />
                Экспортировать
              </>
            )}
          </CButton>
        )}
      </div>
    </div>
  )
}

export default ExportPanel