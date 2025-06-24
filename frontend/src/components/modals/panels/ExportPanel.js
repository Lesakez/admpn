import React, { useState, useEffect, useCallback } from 'react'
import {
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
  cilArrowTop,
  cilArrowBottom,
  cilMove,
} from '@coreui/icons'
import './ExportPanel.scss'

const ExportPanel = ({
  type = 'accounts',
  selectedIds = [],
  currentFilters = {},
  onSuccess,
  onError,
  onLoadingChange,
}) => {
  const normalizeTypeForConfig = (type) => {
    const typeMap = {
      accounts: 'ACCOUNT',
      profiles: 'PROFILE',
      proxies: 'PROXY',
      phones: 'PHONE',
      registrations: 'REGISTRATION',
    }
    return typeMap[type] || type.toUpperCase().replace(/S$/, '')
  }

  const steps = [
    { id: 'type', label: 'Тип и фильтры' },
    { id: 'format', label: 'Формат и поля' },
    { id: 'preview', label: 'Предпросмотр' },
  ]

  const [currentStep, setCurrentStep] = useState('type')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [notification, setNotification] = useState(null)
  const [availableFields, setAvailableFields] = useState([])
  const [fieldsLoading, setFieldsLoading] = useState(false)
  const [statusOptions, setStatusOptions] = useState([])
  const [previewData, setPreviewData] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [statusSearchQuery, setStatusSearchQuery] = useState('')
  const [fieldsSearchQuery, setFieldsSearchQuery] = useState('')
  const [selectedFields, setSelectedFields] = useState([])
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

  const filteredStatusOptions = statusOptions.filter((option) =>
    option.label.toLowerCase().includes(statusSearchQuery.toLowerCase())
  )

  const filteredFieldOptions = availableFields.filter(
    (field) =>
      field.name && // Пропускаем объекты без name
      (field.label.toLowerCase().includes(fieldsSearchQuery.toLowerCase()) ||
        field.name.toLowerCase().includes(fieldsSearchQuery.toLowerCase()))
  )

  const loadStatusOptions = async () => {
    try {
      const configType = normalizeTypeForConfig(type)
      let response = await fetch('/api/config/statuses')
      const statusConfig = await response.json()
      let statusData = []

      if (statusConfig.success && statusConfig.data && statusConfig.data.statuses) {
        const statusesForType = statusConfig.data.statuses[configType]
        if (statusesForType) {
          statusData = Object.values(statusesForType).map((status) => {
            const description = statusConfig.data.descriptions[status] || status
            const color = getStatusColorFromConfig(status, statusConfig.data.colors[status])
            return { value: status, label: description, color }
          })
        }
      }

      if (statusData.length === 0) {
        response = await fetch(`/api/${type}/export/fields`)
        const fieldsData = await response.json()
        if (fieldsData.success && fieldsData.data && fieldsData.data.status) {
          const statusField = fieldsData.data.status
          if (statusField.options && Array.isArray(statusField.options)) {
            statusData = statusField.options.map((option) => ({
              value: option.value || option,
              label: option.label || option.value || option,
              color: getStatusColor(option.value || option),
            }))
          }
        }
      }

      if (statusData.length === 0) {
        statusData = await loadUniqueStatuses()
      }

      setStatusOptions(statusData)
    } catch (error) {
      console.error('Error loading status options:', error)
      showNotification('Ошибка при загрузке статусов', 'danger')
    }
  }

  const loadAvailableFields = async () => {
    setFieldsLoading(true)
    try {
      const response = await fetch(`/api/${type}/export/fields`)
      const data = await response.json()

      console.log('Fields API response:', data)

      if (data.success && data.data) {
        const fields = data.data.fields || data.data
        const formattedFields = Array.isArray(fields)
          ? fields
              .map((field, index) => {
                if (typeof field === 'string') {
                  return { name: field, label: field, type: 'text' }
                }
                // Если name отсутствует, используем label или индекс
                const name = field.name || field.label || `field_${index}`
                return {
                  name,
                  label: field.label || name,
                  type: field.type || 'text',
                  description: field.description,
                }
              })
              .filter((field) => field.name) // Удаляем объекты без name
          : Object.entries(fields)
              .map(([key, value]) => ({
                name: key,
                label: value.label || key,
                type: value.type || 'text',
                description: value.description,
              }))
              .filter((field) => field.name)

        console.log('Formatted fields:', formattedFields)

        setAvailableFields(formattedFields)

        const defaultFields = formattedFields
          .filter((field) => ['login', 'password', 'email', 'status'].includes(field.name))
          .map((field) => field.name)

        if (defaultFields.length > 0) {
          setSelectedFields(defaultFields)
        }
      } else {
        console.error('Invalid fields data:', data)
        showNotification('Некорректные данные полей с сервера', 'danger')
      }
    } catch (error) {
      console.error('Error loading fields:', error)
      showNotification('Ошибка при загрузке полей', 'danger')
    } finally {
      setFieldsLoading(false)
    }
  }

  const getStatusColorFromConfig = (status, configColor) => {
    if (configColor) {
      const colorMap = {
        '#22c55e': 'success',
        '#ef4444': 'danger',
        '#6b7280': 'secondary',
        '#8b5cf6': 'info',
        '#f97316': 'warning',
      }
      return colorMap[configColor] || 'secondary'
    }
    return getStatusColor(status)
  }

  const loadUniqueStatuses = async () => {
    try {
      const response = await fetch(`/api/${type}?limit=1000&fields=status`)
      const data = await response.json()
      if (data.success && data.data) {
        const accounts = data.data.accounts || data.data.data || data.data
        const uniqueStatuses = [...new Set(accounts.map((item) => item.status).filter(Boolean))]
        return uniqueStatuses.map((status) => ({
          value: status,
          label: status.charAt(0).toUpperCase() + status.slice(1),
          color: getStatusColor(status),
        }))
      }
      return []
    } catch (error) {
      console.error('Error loading unique statuses:', error)
      return []
    }
  }

  const getStatusColor = (status) => {
    const colorMap = {
      active: 'success',
      inactive: 'secondary',
      banned: 'danger',
      working: 'warning',
      free: 'info',
      busy: 'warning',
      suspended: 'danger',
      pending: 'primary',
      verified: 'success',
      unverified: 'secondary',
    }
    return colorMap[status] || 'secondary'
  }

  useEffect(() => {
    loadAvailableFields()
    loadStatusOptions()
  }, [type])

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isExporting)
    }
  }, [isExporting, onLoadingChange])

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const loadPreview = async () => {
    setPreviewLoading(true)
    setPreviewError('')
    try {
      console.log('Selected fields for preview:', selectedFields) // Логируем выбранные поля
      const params = new URLSearchParams({
        format: settings.format,
        fields: selectedFields.join(','),
        limit: '10',
        preview: 'true',
      })
      if (settings.statusFilters.length > 0) {
        params.append('status', settings.statusFilters.join(','))
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
        params.append('ids', selectedIds.join(','))
      }
      const url = `/api/${type}/export?${params}`
      console.log('Preview request URL:', url) // Логируем URL запроса
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Preview response:', data) // Логируем ответ сервера
      if (data.success) {
        setPreviewData(data.data)
      } else {
        setPreviewError(data.error || 'Ошибка при загрузке предпросмотра')
      }
    } catch (error) {
      console.error('Preview error:', error)
      setPreviewError(`Ошибка при загрузке предпросмотра: ${error.message}`)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleFieldToggle = (fieldName) => {
    setSelectedFields((prev) => {
      const newFields = prev.includes(fieldName)
        ? prev.filter((f) => f !== fieldName)
        : [...prev, fieldName]
      return newFields
    })
  }

  const handleFieldReorder = (fromIndex, toIndex) => {
    setSelectedFields((prev) => {
      const newFields = [...prev]
      const [movedField] = newFields.splice(fromIndex, 1)
      newFields.splice(toIndex, 0, movedField)
      return newFields
    })
  }

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
        return settings.exportType && (settings.exportType !== 'selected' || selectedIds.length > 0)
      case 'format':
        return settings.format && selectedFields.length > 0
      default:
        return false
    }
  }

  const executeExport = async () => {
    if (selectedFields.length === 0) {
      showNotification('Выберите хотя бы одно поле для экспорта', 'danger')
      return
    }
    setIsExporting(true)
    setExportProgress(0)
    try {
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => Math.min(prev + 10, 90))
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
      const response = await fetch(`/api/${type}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportParams),
      })
      clearInterval(progressInterval)
      setExportProgress(100)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = exportParams.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      showNotification('Экспорт успешно завершён', 'success')
      if (onSuccess) {
        onSuccess({
          type: 'export',
          format: settings.format,
          count: previewData?.totalCount || selectedFields.length,
          filename: exportParams.filename,
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      showNotification(error.message || 'Ошибка при экспорте', 'danger')
      if (onError) {
        onError(error)
      }
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  return (
    <div className="export-panel">
      {notification && (
        <CAlert color={notification.type} dismissible onClose={() => setNotification(null)} className="mb-3">
          {notification.message}
        </CAlert>
      )}

      <div className="progress-steps">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`step ${currentStep === step.id ? 'active' : ''} ${
              steps.findIndex((s) => s.id === currentStep) > index ? 'completed' : ''
            }`}
            onClick={() => {
              if (steps.findIndex((s) => s.id === currentStep) >= index) {
                setCurrentStep(step.id)
              }
            }}
          >
            <div className="step-number">
              {steps.findIndex((s) => s.id === currentStep) > index ? <CIcon icon={cilCheck} /> : index + 1}
            </div>
            <div className="step-name">{step.label}</div>
          </div>
        ))}
      </div>

      <div className="step-content">
        {currentStep === 'type' && (
          <div>
            <h5>Тип экспорта и фильтры</h5>
            <div className="export-types mb-4">
              <div
                className={`export-type ${settings.exportType === 'filtered' ? 'selected' : ''}`}
                onClick={() => setSettings((prev) => ({ ...prev, exportType: 'filtered' }))}
              >
                <input
                  type="radio"
                  name="exportType"
                  value="filtered"
                  checked={settings.exportType === 'filtered'}
                  onChange={() => {}}
                />
                <div className="content">
                  <div className="title">Все записи с фильтрами</div>
                  <div className="description">Экспортировать все записи с применением выбранных фильтров</div>
                </div>
              </div>
              <div
                className={`export-type ${settings.exportType === 'selected' ? 'selected' : ''} ${
                  selectedIds.length === 0 ? 'disabled' : ''
                }`}
                onClick={() => {
                  if (selectedIds.length > 0) {
                    setSettings((prev) => ({ ...prev, exportType: 'selected' }))
                  }
                }}
              >
                <input
                  type="radio"
                  name="exportType"
                  value="selected"
                  checked={settings.exportType === 'selected'}
                  disabled={selectedIds.length === 0}
                  onChange={() => {}}
                />
                <div className="content">
                  <div className="title">Выбранные записи ({selectedIds.length})</div>
                  <div className="description">Экспортировать только выбранные записи</div>
                </div>
              </div>
            </div>

            <div className="filters-section">
              <h6>Фильтры</h6>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Статусы</CFormLabel>
                  <CInputGroup className="filter-search">
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Поиск статусов..."
                      value={statusSearchQuery}
                      onChange={(e) => setStatusSearchQuery(e.target.value)}
                    />
                  </CInputGroup>
                  <div className="status-list">
                    {filteredStatusOptions.map((option) => (
                      <div key={`status-${option.value}`} className="status-item">
                        <CFormCheck
                          id={`status-${option.value}`}
                          checked={settings.statusFilters.includes(option.value)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setSettings((prev) => ({
                              ...prev,
                              statusFilters: checked
                                ? [...prev.statusFilters, option.value]
                                : prev.statusFilters.filter((s) => s !== option.value),
                            }))
                          }}
                        />
                        <span>{option.label}</span>
                        <CBadge color={option.color} className="badge">
                          {option.value}
                        </CBadge>
                      </div>
                    ))}
                  </div>
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Поиск по тексту</CFormLabel>
                  <CFormInput
                    placeholder="Поиск по логину, email и др..."
                    value={settings.searchQuery}
                    onChange={(e) => setSettings((prev) => ({ ...prev, searchQuery: e.target.value }))}
                  />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol md={3}>
                  <CFormLabel>Дата от</CFormLabel>
                  <CFormInput
                    type="date"
                    value={settings.dateFrom}
                    onChange={(e) => setSettings((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Дата до</CFormLabel>
                  <CFormInput
                    type="date"
                    value={settings.dateTo}
                    onChange={(e) => setSettings((prev) => ({ ...prev, dateTo: e.target.value }))}
                  />
                </CCol>
              </CRow>
            </div>
          </div>
        )}

        {currentStep === 'format' && (
          <div>
            <h5>Формат и поля</h5>
            <CRow className="mb-4">
              <CCol md={6}>
                <CFormLabel>Формат экспорта</CFormLabel>
                <CFormSelect
                  value={settings.format}
                  onChange={(e) => setSettings((prev) => ({ ...prev, format: e.target.value }))}
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="txt">TXT</option>
                  <option value="xml">XML</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel>Имя файла</CFormLabel>
                <CFormInput
                  placeholder={`export-${new Date().toISOString().split('T')[0]}`}
                  value={settings.filename}
                  onChange={(e) => setSettings((prev) => ({ ...prev, filename: e.target.value }))}
                />
              </CCol>
            </CRow>

            <div className="fields-grid">
              <CRow>
                <CCol md={6}>
                  <div>
                    <h6>Доступные поля</h6>
                    <CInputGroup className="filter-search">
                      <CInputGroupText>
                        <CIcon icon={cilSearch} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Поиск полей..."
                        value={fieldsSearchQuery}
                        onChange={(e) => setFieldsSearchQuery(e.target.value)}
                      />
                    </CInputGroup>
                    {fieldsLoading ? (
                      <CSpinner size="sm" />
                    ) : (
                      <div className="available-fields">
                        {filteredFieldOptions.length === 0 ? (
                          <div className="text-muted">Нет доступных полей</div>
                        ) : (
                          filteredFieldOptions.map((field, index) => {
                            const isSelected = selectedFields.includes(field.name)
                            return (
                              <div
                                key={`field-${field.name}-${index}`} // Уникальный ключ
                                className="field-chip-container"
                              >
                                <div
                                  className={`field-chip ${isSelected ? 'selected' : ''}`}
                                  onClick={() => handleFieldToggle(field.name)}
                                >
                                  <span className="field-name">{field.label}</span>
                                  {!isSelected && (
                                    <CButton
                                      size="sm"
                                      variant="ghost"
                                      className="add-field-btn"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleFieldToggle(field.name)
                                      }}
                                    >
                                      <CIcon icon={cilPlus} />
                                    </CButton>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="selected-fields">
                    <h6>Выбранные поля ({selectedFields.length})</h6>
                    <div className="selected-fields-list">
                      {selectedFields.map((fieldName, index) => {
                        const field = availableFields.find((f) => f.name === fieldName)
                        return (
                          <div key={`selected-${fieldName}-${index}`} className="selected-field-item">
                            <div className="drag-handle">
                              <CIcon icon={cilMove} />
                            </div>
                            <div className="field-order">{index + 1}</div>
                            <div className="field-label">{field?.label || fieldName}</div>
                            <div className="field-actions">
                              <CButton
                                size="sm"
                                variant="ghost"
                                onClick={() => handleFieldReorder(index, Math.max(0, index - 1))}
                                disabled={index === 0}
                              >
                                <CIcon icon={cilArrowTop} />
                              </CButton>
                              <CButton
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleFieldReorder(index, Math.min(selectedFields.length - 1, index + 1))
                                }
                                disabled={index === selectedFields.length - 1}
                              >
                                <CIcon icon={cilArrowBottom} />
                              </CButton>
                              <CButton
                                size="sm"
                                variant="ghost"
                                color="danger"
                                onClick={() => handleFieldToggle(fieldName)}
                              >
                                <CIcon icon={cilX} />
                              </CButton>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CCol>
              </CRow>
            </div>

            {settings.format === 'csv' && (
              <div className="format-options mt-4">
                <h6>Настройки CSV</h6>
                <CRow>
                  <CCol md={4}>
                    <CFormLabel>Разделитель</CFormLabel>
                    <CFormSelect
                      value={settings.csvDelimiter}
                      onChange={(e) => setSettings((prev) => ({ ...prev, csvDelimiter: e.target.value }))}
                    >
                      <option value=",">Запятая (,)</option>
                      <option value=";">Точка с запятой (;)</option>
                      <option value="\t">Табуляция</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Кодировка</CFormLabel>
                    <CFormSelect
                      value={settings.encoding}
                      onChange={(e) => setSettings((prev) => ({ ...prev, encoding: e.target.value }))}
                    >
                      <option value="utf-8">UTF-8</option>
                      <option value="windows-1251">Windows-1251</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={4} className="d-flex align-items-end">
                    <CFormCheck
                      id="includeHeader"
                      label="Включить заголовки"
                      checked={settings.includeHeader}
                      onChange={(e) => setSettings((prev) => ({ ...prev, includeHeader: e.target.checked }))}
                    />
                  </CCol>
                </CRow>
              </div>
            )}

            {settings.format === 'txt' && (
              <div className="format-options mt-4">
                <h6>Настройки TXT</h6>
                <CRow>
                  <CCol md={12}>
                    <CFormLabel>Шаблон строки</CFormLabel>
                    <CFormInput
                      placeholder="{login}:{password}"
                      value={settings.template}
                      onChange={(e) => setSettings((prev) => ({ ...prev, template: e.target.value }))}
                    />
                    <small className="text-muted">Используйте {'{fieldName}'} для вставки значений полей</small>
                  </CCol>
                </CRow>
              </div>
            )}

            <div className="security-options mt-4">
              <h6>Безопасность</h6>
              <CRow>
                <CCol md={6}>
                  <CFormCheck
                    id="maskPasswords"
                    label="Скрыть пароли (заменить на ***)"
                    checked={settings.maskPasswords}
                    onChange={(e) => setSettings((prev) => ({ ...prev, maskPasswords: e.target.checked }))}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormCheck
                    id="compressOutput"
                    label="Сжать в ZIP архив"
                    checked={settings.compressOutput}
                    onChange={(e) => setSettings((prev) => ({ ...prev, compressOutput: e.target.checked }))}
                  />
                </CCol>
              </CRow>
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div>
            <h5>Предпросмотр экспорта</h5>
            {previewLoading ? (
              <div className="text-center py-4">
                <CSpinner />
                <div className="mt-2">Загрузка предпросмотра...</div>
              </div>
            ) : previewError ? (
              <CAlert color="danger">
                <strong>Ошибка:</strong> {previewError}
              </CAlert>
            ) : previewData ? (
              <div>
                <div className="info-list mb-4">
                  <div className="info-item">
                    <div className="label">Всего записей</div>
                    <div className="value">{previewData.totalCount || 0}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Формат</div>
                    <div className="value">{settings.format.toUpperCase()}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Полей</div>
                    <div className="value">{selectedFields.length}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Приблизительный размер</div>
                    <div className="value">{formatFileSize(previewData.estimatedSize || 0)}</div>
                  </div>
                </div>

                <div className="preview-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6>Предпросмотр данных (первые 10 записей)</h6>
                    <CButton size="sm" variant="outline" onClick={loadPreview}>
                      <CIcon icon={cilCheck} className="me-1" />
                      Обновить
                    </CButton>
                  </div>
                  {settings.format === 'csv' && previewData.preview && (
                    <div className="csv-preview">
                      <pre className="preview-text">{previewData.preview}</pre>
                    </div>
                  )}
                  {settings.format === 'json' && previewData.preview && (
                    <div className="json-preview">
                      <pre className="preview-text">{JSON.stringify(JSON.parse(previewData.preview), null, 2)}</pre>
                    </div>
                  )}
                  {settings.format === 'txt' && previewData.preview && (
                    <div className="txt-preview">
                      <pre className="preview-text">{previewData.preview}</pre>
                    </div>
                  )}
                  {settings.format === 'xml' && previewData.preview && (
                    <div className="xml-preview">
                      <pre className="preview-text">{previewData.preview}</pre>
                    </div>
                  )}
                  {previewData.data && Array.isArray(previewData.data) && (
                    <div className="table-preview mt-4">
                      <h6>Табличный вид</h6>
                      <CTable striped responsive>
                        <CTableHead>
                          <CTableRow>
                            {selectedFields.map((fieldName) => {
                              const field = availableFields.find((f) => f.name === fieldName)
                              return (
                                <CTableHeaderCell key={`header-${fieldName}`}>
                                  {field?.label || fieldName}
                                </CTableHeaderCell>
                              )
                            })}
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {previewData.data.slice(0, 5).map((row, index) => (
                            <CTableRow key={`preview-row-${index}`}>
                              {selectedFields.map((fieldName) => (
                                <CTableDataCell key={`preview-${index}-${fieldName}`}>
                                  {settings.maskPasswords && fieldName.toLowerCase().includes('password')
                                    ? '***'
                                    : row[fieldName] || ''}
                                </CTableDataCell>
                              ))}
                            </CTableRow>
                          ))}
                        </CTableBody>
                      </CTable>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-muted">Предпросмотр недоступен</div>
              </div>
            )}
          </div>
        )}
      </div>

      {isExporting && (
        <div className="export-progress mt-4">
          <div className="text-center mb-3">
            <CSpinner />
            <div className="mt-2">Экспорт в процессе... {exportProgress}%</div>
          </div>
          <CProgress>
            <CProgressBar value={exportProgress} />
          </CProgress>
        </div>
      )}

      <div className="navigation-buttons mt-4">
        <div className="d-flex justify-content-between">
          <CButton variant="outline" onClick={prevStep} disabled={currentStep === 'type'}>
            Назад
          </CButton>
          <div>
            {currentStep !== 'preview' ? (
              <CButton color="primary" onClick={nextStep} disabled={!canProceed(currentStep)}>
                Далее
              </CButton>
            ) : (
              <CButton
                color="success"
                onClick={executeExport}
                disabled={isExporting || selectedFields.length === 0}
              >
                <CIcon icon={cilCloudDownload} className="me-1" />
                {isExporting ? 'Экспорт...' : 'Скачать'}
              </CButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportPanel