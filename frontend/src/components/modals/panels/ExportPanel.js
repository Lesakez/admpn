// frontend/src/components/modals/panels/ExportPanel.js
import React, { useState, useEffect } from 'react'
import {
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CSpinner,
  CAlert,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CCollapse,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload,
  cilFilter,
  cilInfo,
  cilChevronBottom,
  cilChevronTop,
} from '@coreui/icons'
import { useForm } from 'react-hook-form'
import { useEntityStatuses } from '../../../hooks/useStatuses'
import toast from 'react-hot-toast'

const ExportPanel = ({ config, type, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [service, setService] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [estimatedCount, setEstimatedCount] = useState(null)

  // Загружаем статусы для динамических фильтров
  const { data: entityStatuses } = useEntityStatuses(
    config?.filters?.find(f => f.dynamic && f.entity)?.entity
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm({
    defaultValues: {
      format: config?.formats?.[0]?.value || '',
      ...config?.defaultFilters
    }
  })

  const watchedFormat = watch('format')
  const watchedFilters = watch()

  // Загружаем сервис динамически
  useEffect(() => {
    if (config?.service) {
      const loadService = async () => {
        try {
          const serviceModule = await import(`../../../services/${config.service}.js`)
          setService(serviceModule[config.service])
        } catch (error) {
          console.error('Failed to load service:', error)
          toast.error('Ошибка загрузки сервиса')
        }
      }
      loadService()
    }
  }, [config?.service])

  // Получаем оценку количества записей
  useEffect(() => {
    if (service && config?.formats) {
      const getEstimate = async () => {
        try {
          // Используем первый доступный метод для получения статистики
          const statsMethod = service.getStats || service.getAll
          if (statsMethod) {
            const response = await statsMethod(getFilterParams())
            const count = response.data?.data?.total || response.data?.pagination?.total || 0
            setEstimatedCount(count)
          }
        } catch (error) {
          console.warn('Could not get estimate:', error)
        }
      }
      
      getEstimate()
    }
  }, [service, watchedFilters])

  const getCurrentFormat = () => {
    return config?.formats?.find(f => f.value === watchedFormat)
  }

  const getFilterParams = () => {
    const params = {}
    config?.filters?.forEach(filter => {
      const value = watchedFilters[filter.key]
      if (value && value !== '') {
        params[filter.key] = value
      }
    })
    return params
  }

  const getStatusOptions = () => {
    if (!entityStatuses) return []
    
    const options = [{ value: '', label: 'Все статусы' }]
    if (Array.isArray(entityStatuses)) {
      entityStatuses.forEach(status => {
        options.push({ value: status, label: status })
      })
    } else if (typeof entityStatuses === 'object') {
      Object.values(entityStatuses).forEach(status => {
        options.push({ value: status, label: status })
      })
    }
    return options
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
    if (!service || !config) {
      toast.error('Сервис не загружен')
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
      const exportParams = { ...filterParams, ...format.params }
      
      const response = await service[format.method](exportParams)
      
      // Генерируем имя файла
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const filename = `${type}_export_${timestamp}.${format.extension}`
      
      // Скачиваем файл
      if (format.mimeType === 'application/json') {
        const jsonData = JSON.stringify(response.data, null, 2)
        downloadFile(jsonData, filename, format.mimeType)
      } else {
        downloadFile(response.data, filename, format.mimeType)
      }
      
      toast.success(`Файл ${filename} успешно загружен`)
      onSuccess?.({ filename, format: format.label, count: estimatedCount })
      
    } catch (error) {
      const message = error.response?.data?.error || `Ошибка при экспорте ${type}`
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!config) {
    return (
      <CAlert color="warning">
        <CIcon icon={cilInfo} className="me-2" />
        Конфигурация для экспорта не найдена
      </CAlert>
    )
  }

  return (
    <CForm onSubmit={handleSubmit(onSubmit)}>
      {/* Описание */}
      {config.description && (
        <CAlert color="info" className="mb-4">
          <CIcon icon={cilInfo} className="me-2" />
          {config.description}
        </CAlert>
      )}

      <CRow>
        {/* Формат экспорта */}
        <CCol lg={6}>
          <div className="mb-4">
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
              {config.formats?.map(format => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </CFormSelect>
            {errors.format && (
              <div className="invalid-feedback d-block">{errors.format.message}</div>
            )}
            
            {/* Описание формата */}
            {getCurrentFormat() && (
              <div className="form-text mt-2">
                {getCurrentFormat().description}
              </div>
            )}
          </div>

          {/* Оценка количества */}
          {estimatedCount !== null && (
            <CAlert color="light" className="mb-4">
              <strong>Будет экспортировано:</strong> {estimatedCount} записей
            </CAlert>
          )}
        </CCol>

        {/* Фильтры */}
        <CCol lg={6}>
          <div className="mb-3">
            <CButton
              color="outline-secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="w-100 d-flex align-items-center justify-content-between"
            >
              <span>
                <CIcon icon={cilFilter} className="me-2" />
                Фильтры экспорта
              </span>
              <CIcon icon={showFilters ? cilChevronTop : cilChevronBottom} />
            </CButton>
          </div>

          <CCollapse visible={showFilters}>
            <CCard className="border-0 bg-light">
              <CCardBody>
                <CRow>
                  {config.filters?.map(filter => (
                    <CCol md={filter.type === 'date' ? 6 : 12} key={filter.key} className="mb-3">
                      <CFormLabel htmlFor={filter.key} className="fw-semibold">
                        {filter.label}
                      </CFormLabel>
                      
                      {filter.type === 'select' && (
                        <CFormSelect
                          id={filter.key}
                          {...register(filter.key)}
                        >
                          {filter.dynamic ? 
                            getStatusOptions().map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            )) :
                            filter.options?.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))
                          }
                        </CFormSelect>
                      )}
                      
                      {filter.type === 'text' && (
                        <CFormInput
                          id={filter.key}
                          placeholder={filter.placeholder}
                          {...register(filter.key)}
                        />
                      )}
                      
                      {filter.type === 'date' && (
                        <CFormInput
                          type="date"
                          id={filter.key}
                          {...register(filter.key)}
                        />
                      )}
                    </CCol>
                  ))}
                </CRow>
              </CCardBody>
            </CCard>
          </CCollapse>
        </CCol>
      </CRow>

      {/* Кнопка экспорта */}
      <div className="text-center mt-4">
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
              Скачать {getCurrentFormat()?.label}
              {estimatedCount !== null && ` (${estimatedCount})`}
            </>
          )}
        </CButton>
      </div>
    </CForm>
  )
}

export default ExportPanel