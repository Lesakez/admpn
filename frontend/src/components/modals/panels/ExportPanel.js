// frontend/src/components/modals/panels/ExportPanel.js
import React, { useState, useEffect, useMemo } from 'react'
import {
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormCheck,
  CSpinner,
  CAlert,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCollapse,
  CInputGroup,
  CInputGroupText,
  CFormTextarea,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload,
  cilFilter,
  cilInfo,
  cilChevronBottom,
  cilChevronTop,
  cilSettings,
  cilCheckCircle,
  cilWarning,
  cilReload,
} from '@coreui/icons'
import { useForm } from 'react-hook-form'
import { useEntityStatuses, useStatusConfig } from '../../../hooks/useStatuses'
import toast from 'react-hot-toast'
import './ExportPanel.scss'

const ExportPanel = ({ config, type, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [service, setService] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showFieldSelection, setShowFieldSelection] = useState(false)
  const [estimatedCount, setEstimatedCount] = useState(null)
  const [dynamicOptions, setDynamicOptions] = useState({})
  const [availableFields, setAvailableFields] = useState([])

  // Динамическая загрузка статусов для текущего типа сущности
  const { data: entityStatuses, isLoading: statusesLoading } = useEntityStatuses(type)
  const { data: statusConfig, isLoading: statusConfigLoading } = useStatusConfig()

  // Получаем все динамические сущности из фильтров
  const dynamicEntities = useMemo(() => {
    return config?.filters?.filter(f => f.dynamic && f.entity).map(f => f.entity) || []
  }, [config?.filters])

  // Загружаем статусы для всех динамических сущностей
  const dynamicStatusQueries = {}
  dynamicEntities.forEach(entity => {
    const { data } = useEntityStatuses(entity)
    dynamicStatusQueries[entity] = data
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    getValues
  } = useForm({
    defaultValues: {
      format: config?.formats?.[0]?.value || '',
      fields: [], // Поля для экспорта
      ...config?.defaultFilters,
      ...config?.defaultValues
    }
  })

  const watchedFormat = watch('format')
  const watchedFilters = watch()
  const watchedFields = watch('fields')

  // Динамическая загрузка сервиса
  useEffect(() => {
    if (!config?.service) return

    const loadService = async () => {
      try {
        const serviceModule = await import(`../../../services/${config.service}.js`)
        const serviceInstance = serviceModule[config.service] || serviceModule.default
        setService(serviceInstance)
      } catch (error) {
        console.error(`Failed to load service ${config.service}:`, error)
        toast.error(`Ошибка загрузки сервиса: ${config.service}`)
      }
    }

    loadService()
  }, [config?.service])

  // Загрузка доступных полей для экспорта
  useEffect(() => {
    if (!service) return

    const loadAvailableFields = async () => {
      try {
        // Пытаемся получить поля из сервиса
        if (service.getFields) {
          const response = await service.getFields()
          setAvailableFields(response.data?.fields || response.fields || [])
        } else if (service.getAll) {
          // Получаем первую запись для определения полей
          const response = await service.getAll({ limit: 1 })
          const firstItem = response.data?.data?.[0] || response.data?.[0]
          if (firstItem) {
            const fields = Object.keys(firstItem).map(key => ({
              key,
              label: formatFieldLabel(key),
              type: getFieldType(firstItem[key]),
              description: getFieldDescription(key, type)
            }))
            setAvailableFields(fields)
          }
        } else {
          // Базовые поля по умолчанию для разных типов
          setAvailableFields(getDefaultFields(type))
        }
      } catch (error) {
        console.warn('Could not load fields:', error)
        setAvailableFields(getDefaultFields(type))
      }
    }

    loadAvailableFields()
  }, [service, type])

  // Загрузка динамических опций для фильтров
  useEffect(() => {
    if (!config?.filters || !service) return

    const loadDynamicOptions = async () => {
      const dynamicFilters = config.filters.filter(f => f.dynamic && f.source && !f.entity)
      
      for (const filter of dynamicFilters) {
        try {
          if (filter.source && service[filter.source]) {
            const response = await service[filter.source](filter.sourceParams || {})
            const data = response?.data?.data || response?.data || response
            
            setDynamicOptions(prev => ({
              ...prev,
              [filter.key]: formatOptionsFromData(data, filter)
            }))
          }

          if (filter.endpoint) {
            const response = await fetch(filter.endpoint)
            const data = await response.json()
            
            setDynamicOptions(prev => ({
              ...prev,
              [filter.key]: formatOptionsFromData(data?.data || data, filter)
            }))
          }
        } catch (error) {
          console.error(`Failed to load options for ${filter.key}:`, error)
        }
      }
    }

    loadDynamicOptions()
  }, [service, config?.filters])

  // Оценка количества записей
  useEffect(() => {
    if (!service) return

    const getEstimate = async () => {
      try {
        const filterParams = getFilterParams()
        
        // Пробуем разные методы для получения статистики
        const methods = ['getStats', 'count', 'getAll']
        let count = 0

        for (const methodName of methods) {
          if (service[methodName]) {
            const response = await service[methodName](filterParams)
            const data = response?.data?.data || response?.data || response
            
            if (typeof data === 'number') {
              count = data
            } else if (data?.total) {
              count = data.total
            } else if (data?.count) {
              count = data.count
            } else if (Array.isArray(data)) {
              count = data.length
            } else if (data?.pagination?.total) {
              count = data.pagination.total
            }

            if (count > 0) {
              setEstimatedCount(count)
              break
            }
          }
        }
      } catch (error) {
        console.warn('Could not get estimate:', error)
        setEstimatedCount(null)
      }
    }

    const timeoutId = setTimeout(getEstimate, 500)
    return () => clearTimeout(timeoutId)
  }, [service, watchedFilters])

  // Утилиты для работы с полями
  const formatFieldLabel = (key) => {
    const labelMap = {
      id: 'ID',
      ipPort: 'IP:Port',
      createdAt: 'Дата создания',
      updatedAt: 'Дата обновления',
      projectId: 'ID проекта',
      userId: 'ID пользователя'
    }
    
    return labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
  }

  const getFieldType = (value) => {
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (value instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(value)) return 'date'
    return 'text'
  }

  const getFieldDescription = (key, entityType) => {
    const descriptions = {
      accounts: {
        login: 'Логин пользователя',
        email: 'Email адрес',
        password: 'Пароль (только для авторизованных пользователей)',
        status: 'Текущий статус аккаунта'
      },
      proxies: {
        ipPort: 'IP адрес и порт прокси',
        protocol: 'Протокол прокси (HTTP, SOCKS5, etc.)',
        login: 'Логин для авторизации на прокси',
        password: 'Пароль для авторизации на прокси',
        country: 'Страна расположения прокси'
      }
    }
    
    return descriptions[entityType]?.[key] || ''
  }

  const getDefaultFields = (entityType) => {
    const defaultFields = {
      accounts: [
        { key: 'id', label: 'ID', type: 'number' },
        { key: 'login', label: 'Логин', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'status', label: 'Статус', type: 'text' },
        { key: 'createdAt', label: 'Создан', type: 'date' }
      ],
      proxies: [
        { key: 'id', label: 'ID', type: 'number' },
        { key: 'ipPort', label: 'IP:Port', type: 'text' },
        { key: 'protocol', label: 'Протокол', type: 'text' },
        { key: 'country', label: 'Страна', type: 'text' },
        { key: 'status', label: 'Статус', type: 'text' }
      ]
    }
    
    return defaultFields[entityType] || []
  }

  const formatOptionsFromData = (data, filter) => {
    if (!Array.isArray(data)) return []
    
    return data.map(item => ({
      value: item[filter.valueField || 'id'] || item.value || item,
      label: item[filter.labelField || 'name'] || item.label || item
    }))
  }

  const getCurrentFormat = () => {
    return config?.formats?.find(f => f.value === watchedFormat)
  }

  const getFilterParams = () => {
    const params = {}
    
    config?.filters?.forEach(filter => {
      const value = watchedFilters[filter.key]
      if (value !== undefined && value !== '' && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params[filter.key] = value
          }
        } else {
          params[filter.key] = value
        }
      }
    })
    
    return params
  }

  const getStatusOptions = (entity) => {
    // Приоритет: специфические статусы для сущности -> статусы текущего типа -> общие статусы
    const statusData = dynamicStatusQueries[entity] || entityStatuses
    
    if (!statusData) return [{ value: '', label: 'Все статусы' }]
    
    const options = [{ value: '', label: 'Все статусы' }]
    
    if (Array.isArray(statusData)) {
      statusData.forEach(status => {
        options.push({ 
          value: status, 
          label: getStatusLabel(status)
        })
      })
    } else if (typeof statusData === 'object') {
      Object.entries(statusData).forEach(([key, status]) => {
        options.push({ 
          value: status, 
          label: getStatusLabel(status)
        })
      })
    }
    
    return options
  }

  const getStatusLabel = (status) => {
    return statusConfig?.descriptions?.[status] || status
  }

  const getStatusBadge = (status) => {
    const description = getStatusLabel(status)
    const color = statusConfig?.colors?.[status] || '#6b7280'
    
    const getBootstrapColor = (hexColor) => {
      const colorMap = {
        '#10b981': 'success',
        '#ef4444': 'danger', 
        '#f59e0b': 'warning',
        '#3b82f6': 'primary',
        '#6b7280': 'secondary'
      }
      return colorMap[hexColor] || 'secondary'
    }
    
    return (
      <CBadge color={getBootstrapColor(color)} className="me-1">
        {description}
      </CBadge>
    )
  }

  const getDynamicOptions = (filter) => {
    if (filter.dynamic && filter.entity) {
      return getStatusOptions(filter.entity)
    }
    
    if (filter.dynamic && filter.source) {
      const options = dynamicOptions[filter.key] || []
      return [
        { value: '', label: filter.placeholder || 'Все' },
        ...options
      ]
    }
    
    return filter.options || []
  }

  const downloadFile = (data, filename, mimeType) => {
    const blob = new Blob([data], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const onSubmit = async (data) => {
    if (!service) {
      toast.error('Сервис недоступен')
      return
    }

    const format = getCurrentFormat()
    if (!format) {
      toast.error('Выберите формат экспорта')
      return
    }

    setIsLoading(true)

    try {
      const filterParams = getFilterParams()
      const exportParams = { 
        ...filterParams, 
        ...format.params,
        fields: data.fields, // Добавляем выбранные поля
        ...config?.additionalParams
      }
      
      // Динамический вызов метода экспорта
      const method = format.method || config?.defaultMethod || 'exportJSON'
      const response = await service[method](exportParams)
      
      // Генерируем имя файла
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const filename = format.filename || 
                     `${type}_export_${timestamp}.${format.extension}`
      
      // Обработка разных типов ответов
      let fileData
      if (format.mimeType === 'application/json') {
        const jsonData = response?.data?.data || response?.data || response
        fileData = JSON.stringify(jsonData, null, 2)
      } else if (response?.data instanceof Blob) {
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(response.data)
        link.download = filename
        link.click()
        window.URL.revokeObjectURL(link.href)
      } else {
        fileData = response?.data || response
      }
      
      if (fileData && !(response?.data instanceof Blob)) {
        downloadFile(fileData, filename, format.mimeType)
      }
      
      toast.success(`Файл ${filename} успешно загружен`)
      onSuccess?.({ 
        filename, 
        format: format.label, 
        count: estimatedCount,
        fields: data.fields,
        filters: filterParams
      })
      
    } catch (error) {
      const message = error.response?.data?.error || 
                     error.response?.data?.message ||
                     error.message ||
                     `Ошибка при экспорте ${type}`
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetFilters = () => {
    reset({
      format: watchedFormat,
      fields: [],
      ...config?.defaultFilters
    })
  }

  const selectAllFields = () => {
    const allFieldKeys = availableFields.map(f => f.key)
    setValue('fields', allFieldKeys)
  }

  const clearAllFields = () => {
    setValue('fields', [])
  }

  if (!config) {
    return (
      <CAlert color="warning">
        <CIcon icon={cilInfo} className="me-2" />
        Конфигурация экспорта не найдена
      </CAlert>
    )
  }

  return (
    <div className="export-panel">
      <CForm onSubmit={handleSubmit(onSubmit)}>
        {/* Описание */}
        {config.description && (
          <CAlert color="info" className="export-panel__description">
            <CIcon icon={cilInfo} className="me-2" />
            {config.description}
          </CAlert>
        )}

        <CRow>
          {/* Формат и поля экспорта */}
          <CCol lg={6}>
            {/* Формат экспорта */}
            <div className="export-panel__format">
              <CFormLabel htmlFor="format" className="fw-semibold">
                Формат экспорта *
              </CFormLabel>
              <CFormSelect
                id="format"
                invalid={!!errors.format}
                {...register('format', {
                  required: 'Выберите формат экспорта'
                })}
              >
                <option value="">Выберите формат...</option>
                {config.formats?.map(format => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </CFormSelect>
              {errors.format && (
                <div className="invalid-feedback d-block">{errors.format.message}</div>
              )}
              
              {getCurrentFormat()?.description && (
                <div className="form-text mt-2">
                  {getCurrentFormat().description}
                </div>
              )}
            </div>

            {/* Выбор полей для экспорта */}
            {availableFields.length > 0 && (
              <div className="export-panel__fields">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <CFormLabel className="fw-semibold mb-0">
                    Поля для экспорта
                  </CFormLabel>
                  <div>
                    <CButton
                      type="button"
                      color="outline-primary"
                      size="sm"
                      onClick={selectAllFields}
                      className="me-2"
                    >
                      Все
                    </CButton>
                    <CButton
                      type="button"
                      color="outline-secondary"
                      size="sm"
                      onClick={clearAllFields}
                    >
                      Очистить
                    </CButton>
                  </div>
                </div>
                
                <CCard className="export-panel__fields-card">
                  <CCardBody>
                    <CRow>
                      {availableFields.map(field => (
                        <CCol key={field.key} md={6} className="mb-2">
                          <CFormCheck
                            id={`field-${field.key}`}
                            label={field.label}
                            value={field.key}
                            {...register('fields')}
                          />
                          {field.description && (
                            <div className="form-text small">{field.description}</div>
                          )}
                        </CCol>
                      ))}
                    </CRow>
                  </CCardBody>
                </CCard>
              </div>
            )}

            {/* Оценка количества */}
            {estimatedCount !== null && (
              <CAlert color="light" className="export-panel__estimate">
                <strong>Будет экспортировано:</strong> {estimatedCount} записей
                {watchedFields?.length > 0 && (
                  <div className="small text-muted mt-1">
                    Выбрано полей: {watchedFields.length}
                  </div>
                )}
              </CAlert>
            )}
          </CCol>

          {/* Фильтры */}
          <CCol lg={6}>
            <div className="export-panel__filters">
              <CButton
                type="button"
                color="outline-secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="export-panel__filters-toggle"
              >
                <CIcon icon={cilFilter} className="me-2" />
                Фильтры экспорта
                <CIcon icon={showFilters ? cilChevronTop : cilChevronBottom} className="ms-2" />
              </CButton>

              <CCollapse visible={showFilters}>
                <CCard className="export-panel__filters-card">
                  <CCardBody>
                    <CRow>
                      {config.filters?.map(filter => (
                        <CCol 
                          key={filter.key}
                          md={filter.type === 'date' ? 6 : 12} 
                          className="mb-3"
                        >
                          <CFormLabel htmlFor={filter.key} className="fw-semibold">
                            {filter.label}
                            {filter.dynamic && filter.entity && (
                              <CIcon 
                                icon={cilReload} 
                                className="ms-2 text-muted" 
                                title="Динамическая загрузка"
                                size="sm"
                              />
                            )}
                          </CFormLabel>
                          
                          {filter.type === 'select' ? (
                            <CFormSelect
                              id={filter.key}
                              disabled={filter.dynamic && (statusesLoading || statusConfigLoading)}
                              {...register(filter.key)}
                            >
                              {getDynamicOptions(filter).map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </CFormSelect>
                          ) : filter.type === 'text' ? (
                            <CFormInput
                              id={filter.key}
                              placeholder={filter.placeholder}
                              {...register(filter.key)}
                            />
                          ) : filter.type === 'date' ? (
                            <CFormInput
                              type="date"
                              id={filter.key}
                              {...register(filter.key)}
                            />
                          ) : filter.type === 'number' ? (
                            <CFormInput
                              type="number"
                              id={filter.key}
                              placeholder={filter.placeholder}
                              min={filter.min}
                              max={filter.max}
                              {...register(filter.key)}
                            />
                          ) : filter.type === 'multiselect' ? (
                            <CFormSelect
                              id={filter.key}
                              multiple
                              size={3}
                              {...register(filter.key)}
                            >
                              {getDynamicOptions(filter).slice(1).map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </CFormSelect>
                          ) : (
                            <CFormInput
                              type={filter.type || 'text'}
                              id={filter.key}
                              placeholder={filter.placeholder}
                              {...register(filter.key)}
                            />
                          )}
                          
                          {filter.description && (
                            <div className="form-text">{filter.description}</div>
                          )}

                          {/* Показываем загруженные статусы */}
                          {filter.dynamic && filter.entity && entityStatuses && (
                            <div className="form-text">
                              <div className="small">Доступные статусы:</div>
                              <div className="mt-1">
                                {Object.values(entityStatuses).slice(0, 3).map(status => 
                                  getStatusBadge(status)
                                )}
                                {Object.values(entityStatuses).length > 3 && (
                                  <span className="text-muted">и еще {Object.values(entityStatuses).length - 3}...</span>
                                )}
                              </div>
                            </div>
                          )}
                        </CCol>
                      ))}
                    </CRow>
                    
                    <div className="export-panel__filters-actions">
                      <CButton
                        type="button"
                        color="outline-secondary"
                        size="sm"
                        onClick={resetFilters}
                      >
                        Сбросить фильтры
                      </CButton>
                    </div>
                  </CCardBody>
                </CCard>
              </CCollapse>
            </div>
          </CCol>
        </CRow>

        {/* Кнопка экспорта */}
        <div className="export-panel__submit">
          <CButton
            type="submit"
            color="primary"
            disabled={isLoading || !watchedFormat}
            className="px-4"
          >
            {isLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Экспортируем...
              </>
            ) : (
              <>
                <CIcon icon={cilCloudDownload} className="me-2" />
                Скачать {getCurrentFormat()?.label || 'файл'}
                {estimatedCount !== null && ` (${estimatedCount})`}
              </>
            )}
          </CButton>
        </div>
      </CForm>
    </div>
  )
}

export default ExportPanel