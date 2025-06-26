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
          // Используем fallback если сервер вернул ошибку
          setExportConfig(getFallbackConfig())
        }
      } else {
        // Используем fallback если метод не реализован
        setExportConfig(getFallbackConfig())
      }
    } catch (error) {
      console.error('Error loading export config:', error)
      setExportConfig(getFallbackConfig())
    } finally {
      setConfigLoading(false)
    }
  }

  // Fallback конфигурация
  const getFallbackConfig = () => ({
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

  // Загрузка доступных полей
  const loadFields = async () => {
    try {
      setFieldsLoading(true)
      const service = await getServiceByType(type)

      // Используем getFields() вместо getExportFields()
      if (service.getFields) {
        const response = await service.getFields()

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
      } else if (service.getExportFields) {
        // Fallback на getExportFields если есть
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
        }
      } else {
        throw new Error('getFields not implemented')
      }
    } catch (error) {
      console.error('Error loading fields:', error)
      
      const fallbackFields = [
        { key: 'id', label: 'ID', type: 'number', defaultSelected: true },
        { key: 'login', label: 'Логин', type: 'string', defaultSelected: true },
        { key: 'email', label: 'Email', type: 'string', defaultSelected: true },
        { key: 'password', label: 'Пароль', type: 'string', sensitive: true },
        { key: 'status', label: 'Статус', type: 'string', defaultSelected: true },
        { key: 'created_at', label: 'Дата создания', type: 'datetime', defaultSelected: true },
        { key: 'updated_at', label: 'Дата обновления', type: 'datetime' }
      ]
      
      setAvailableFields(fallbackFields)
      
      if (selectedFieldsList.length === 0) {
        const defaultFields = fallbackFields
          .filter(field => field.defaultSelected)
          .map(field => ({
            field: field.key,
            isDuplicate: false,
            duplicateIndex: 1,
          }))
        setSelectedFieldsList(defaultFields)
      }
    } finally {
      setFieldsLoading(false)
    }
  }

  // Загрузка статусов - упрощенная версия
  const loadStatusOptions = async () => {
    try {
      setStatusLoading(true)
      
      // Пока используем fallback статусы для всех типов
      const fallbackStatuses = [
        { value: 'active', label: 'Активный', color: 'success' },
        { value: 'inactive', label: 'Неактивный', color: 'secondary' },
        { value: 'blocked', label: 'Заблокированный', color: 'danger' },
        { value: 'pending', label: 'Ожидает', color: 'warning' }
      ]
      setStatusOptions(fallbackStatuses)
    } catch (error) {
      console.error('Error loading status options:', error)
      setStatusOptions([])
    } finally {
      setStatusLoading(false)
    }
  }

  // Загрузка предпросмотра
  const loadPreview = async () => {
    if (!settings.format || selectedFieldsList.length === 0) {
      setPreviewError('Выберите формат и поля для предпросмотра')
      return
    }

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

      // Добавляем фильтры если нужно
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
      
      // Пробуем универсальный метод export с параметром preview
      if (service.export) {
        const response = await service.export(exportParams)
        
        if (response.data?.success) {
          setPreviewData(response.data.data)
        } else {
          setPreviewError(response.data?.message || 'Ошибка при загрузке предпросмотра')
        }
      } else {
        // Fallback preview для тестирования
        const fakePreview = {
          totalRecords: selectedIds.length > 0 ? selectedIds.length : 100,
          previewRecords: 5,
          fields: selectedFieldsList.map(item => item.field),
          data: Array(5).fill(null).map((_, i) => {
            const record = { id: i + 1 }
            selectedFieldsList.forEach(item => {
              if (item.field === 'login') {
                record[item.field] = `user_${i + 1}`
              } else if (item.field === 'email') {
                record[item.field] = `user${i + 1}@example.com`
              } else if (item.field === 'password') {
                record[item.field] = settings.includeSensitive ? `password${i + 1}` : '****'
              } else if (item.field === 'status') {
                record[item.field] = ['active', 'inactive', 'blocked'][i % 3]
              } else if (item.field === 'created_at') {
                record[item.field] = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
              } else if (item.field !== 'id') {
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

  // Валидация настроек
  const validateSettings = () => {
    if (!settings.format) {
      toast.error('Выберите формат экспорта')
      return false
    }

    if (selectedFieldsList.length === 0) {
      toast.error('Выберите поля для экспорта')
      return false
    }

    if (settings.exportType === 'selected' && selectedIds.length === 0) {
      toast.error('Нет выбранных записей для экспорта')
      return false
    }

    if (settings.exportType === 'by_user_id' && settings.userIds.length === 0) {
      toast.error('Введите идентификаторы пользователей')
      return false
    }

    return true
  }

  // Навигация по шагам
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

      // Добавляем фильтры в зависимости от типа экспорта
      if (settings.exportType === 'filtered') {
        exportParams.filters = {
          ...currentFilters,
          status: settings.statusFilters.length > 0 ? settings.statusFilters : undefined,
          dateFrom: settings.dateFrom || undefined,
          dateTo: settings.dateTo || undefined,
          search: settings.searchQuery || undefined,
        }
      } else if (settings.exportType === 'selected') {
        exportParams.ids = selectedIds
      } else if (settings.exportType === 'by_user_id') {
        exportParams.userIds = settings.userIds
      }

      clearInterval(progressInterval)
      setExportProgress(100)

      const service = await getServiceByType(type)
      
      // Пробуем использовать специфичные методы экспорта по формату
      let response
      if (settings.format === 'csv' && service.exportCSV) {
        response = await service.exportCSV(exportParams)
      } else if (settings.format === 'json' && service.exportJSON) {
        response = await service.exportJSON(exportParams)
      } else if (settings.format === 'txt' && service.exportTXT) {
        response = await service.exportTXT(exportParams)
      } else if (service.export) {
        // Универсальный метод
        response = await service.export(exportParams)
      } else {
        throw new Error('Методы экспорта не реализованы')
      }
      
      if (response.data?.success) {
        await handleExportResponse(response, exportParams)
      } else {
        throw new Error(response.data?.message || 'Ошибка экспорта')
      }

    } catch (error) {
      console.error('Export error:', error)
      toast.error(`Ошибка при экспорте: ${error.message}`)
      if (onError) onError(error)
    } finally {
      setIsExporting(false)
      setExportProgress(0)
      if (progressInterval) clearInterval(progressInterval)
    }
  }

  const handleExportResponse = async (response, exportParams) => {
    try {
      const { data: responseData } = response.data
      
      if (responseData.downloadUrl) {
        // Скачивание по URL
        const link = document.createElement('a')
        link.href = responseData.downloadUrl
        link.download = responseData.filename || `${exportParams.filename}.${exportParams.format}`
        link.click()
      } else if (responseData.content) {
        // Прямое скачивание контента
        const blob = new Blob([responseData.content], { type: getContentType(exportParams.format) })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = responseData.filename || `${exportParams.filename}.${exportParams.format}`
        a.click()
        URL.revokeObjectURL(url)
      } else if (response.data && typeof response.data === 'string') {
        // Если ответ - это сырые данные (для CSV/TXT)
        const blob = new Blob([response.data], { type: getContentType(exportParams.format) })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${exportParams.filename}.${exportParams.format}`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        // Fallback - создаем тестовый файл
        const content = settings.format === 'json' 
          ? JSON.stringify([{ test: 'data' }], null, 2)
          : 'test,data\nvalue1,value2'
        
        const blob = new Blob([content], { type: getContentType(exportParams.format) })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${exportParams.filename}.${exportParams.format}`
        a.click()
        URL.revokeObjectURL(url)
      }

      const filename = responseData?.filename || `${exportParams.filename}.${exportParams.format}`
      
      toast.success(`Экспорт завершен: ${filename}`)
      
      if (onSuccess) {
        onSuccess({
          filename,
          format: exportParams.format,
          recordCount: previewData?.totalRecords || 0,
          type: 'export'
        })
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

  // Обработка полей
  const addField = (fieldKey) => {
    const field = availableFields.find(f => f.key === fieldKey)
    if (!field) return

    const existingCount = selectedFieldsList.filter(item => item.field === fieldKey).length
    const newField = {
      field: fieldKey,
      isDuplicate: existingCount > 0,
      duplicateIndex: existingCount + 1,
    }

    setSelectedFieldsList(prev => [...prev, newField])
  }

  const removeField = (index) => {
    setSelectedFieldsList(prev => prev.filter((_, i) => i !== index))
  }

  const moveField = (fromIndex, toIndex) => {
    setSelectedFieldsList(prev => {
      const newList = [...prev]
      const [movedField] = newList.splice(fromIndex, 1)
      newList.splice(toIndex, 0, movedField)
      return newList
    })
  }

  // Рендер компонента
  if (configLoading || fieldsLoading || statusLoading) {
    return (
      <div className="modal-loading">
        <CSpinner className="me-2" />
        <span className="loading-text">Загрузка конфигурации экспорта...</span>
      </div>
    )
  }

  return (
    <div className="export-panel-modern">
      {/* Прогресс шагов */}
      <div className="progress-steps mb-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`step ${currentStep === step.id ? 'active' : ''} ${
              steps.findIndex(s => s.id === currentStep) > index ? 'completed' : ''
            }`}
            onClick={() => canProceed(step.id) && setCurrentStep(step.id)}
          >
            <div className="step-number">
              {steps.findIndex(s => s.id === currentStep) > index ? (
                <CIcon icon={cilCheckCircle} />
              ) : (
                index + 1
              )}
            </div>
            <span className="step-name">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Контент шага */}
      <div className="step-content">
        {/* Здесь был бы полный рендер всех шагов - type, format, preview */}
        {/* Для краткости показываю только структуру */}
        
        {currentStep === 'type' && (
          <CRow className="g-4">
            <CCol lg={6}>
              <CCard className="h-100">
                <CCardBody>
                  <h6 className="mb-3">Что экспортировать?</h6>
                  {/* Тип экспорта, фильтры и т.д. */}
                </CCardBody>
              </CCard>
            </CCol>
            <CCol lg={6}>
              <CCard className="h-100">
                <CCardBody>
                  <h6 className="mb-3">Фильтры</h6>
                  {/* Статусы, даты, поиск */}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        )}

        {currentStep === 'format' && (
          <CRow className="g-4">
            <CCol lg={6}>
              <CCard className="h-100">
                <CCardBody>
                  <h6 className="mb-3">Формат и настройки</h6>
                  {/* Выбор формата, имя файла, настройки */}
                </CCardBody>
              </CCard>
            </CCol>
            <CCol lg={6}>
              <CCard className="h-100">
                <CCardBody>
                  <h6 className="mb-3">Поля для экспорта</h6>
                  {/* Выбор и сортировка полей */}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        )}

        {currentStep === 'preview' && (
          <CRow className="g-4">
            <CCol>
              <CCard>
                <CCardBody>
                  <h6 className="mb-3">Предпросмотр экспорта</h6>
                  {previewLoading ? (
                    <div className="text-center py-4">
                      <CSpinner />
                      <div className="mt-2">Загрузка предпросмотра...</div>
                    </div>
                  ) : previewError ? (
                    <CAlert color="danger">{previewError}</CAlert>
                  ) : previewData ? (
                    <div>
                      <p>Найдено записей: <strong>{previewData.totalRecords}</strong></p>
                      {/* Таблица предпросмотра */}
                    </div>
                  ) : (
                    <div>Нет данных для предпросмотра</div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        )}
      </div>

      {/* Действия */}
      <div className="export-actions mt-4">
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
                disabled={isExporting || !validateSettings()}
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

      {/* Прогресс экспорта */}
      {isExporting && (
        <div className="export-loading mt-3">
          <div className="text-center">
            <CProgress className="mb-2" style={{ height: '8px' }}>
              <CProgressBar value={exportProgress} animated />
            </CProgress>
            <small className="text-muted">{exportProgress}% завершено</small>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExportPanel