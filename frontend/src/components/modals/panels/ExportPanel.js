// frontend/src/components/modals/panels/ExportPanel.js

import React, { useState, useCallback, useEffect } from 'react'
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
  CInputGroup,
  CInputGroupText,
  CProgress,
  CProgressBar,
  CForm,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload,
  cilCheckCircle,
  cilFilter,
  cilCode,
  cilX,
  cilSettings,
  cilSearch,
  cilFile,
  cilTask,
} from '@coreui/icons'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'

const ExportPanel = ({
  type = 'accounts',
  selectedIds = [],
  currentFilters = {},
  config,
  onSuccess,
  onError,
  onLoadingChange,
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [selectedFields, setSelectedFields] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      export_type: selectedIds.length > 0 ? 'selected' : 'all',
      format: 'csv',
      include_headers: true,
      delimiter: ',',
      encoding: 'utf-8',
    }
  })

  // Получаем конфигурацию экспорта с сервера
  const { data: exportConfig, isLoading: configLoading, error: configError } = useQuery({
    queryKey: [type, 'export-config'],
    queryFn: async () => {
      const serviceModule = await getExportService()()
      const service = serviceModule.default || serviceModule[getServiceName()]
      
      if (service?.getExportConfig) {
        const response = await service.getExportConfig()
        return response.data?.data || response.data
      }
      
      throw new Error('Метод getExportConfig не найден в сервисе')
    },
  })

  // Получаем доступные поля с сервера
  const { data: fieldsData, isLoading: fieldsLoading, error: fieldsError } = useQuery({
    queryKey: [type, 'export-fields'],
    queryFn: async () => {
      const serviceModule = await getExportService()()
      const service = serviceModule.default || serviceModule[getServiceName()]
      
      if (service?.getExportFields) {
        const response = await service.getExportFields()
        return response.data?.data || response.data
      }
      
      throw new Error('Метод getExportFields не найден в сервисе')
    },
  })

  const watchedFormat = watch('format')
  const watchedExportType = watch('export_type')

  // Получаем сервис для экспорта
  const getExportService = useCallback(() => {
    const services = {
      accounts: () => import('../../../services/accountsService'),
      proxies: () => import('../../../services/proxiesService'),
      phones: () => import('../../../services/phonesService'),
      profiles: () => import('../../../services/profilesService'),
      projects: () => import('../../../services/projectsService'),
    }
    return services[type] || services.accounts
  }, [type])

  const getServiceName = () => {
    return `${type}Service`
  }

  // Инициализация полей после загрузки конфигурации
  useEffect(() => {
    if (fieldsData && fieldsData.length > 0) {
      // Выбираем поля по умолчанию на основе серверной конфигурации
      const defaultFields = fieldsData.filter(field => 
        field.defaultSelected || field.required
      )
      setSelectedFields(defaultFields)
    }
  }, [fieldsData])

  // Уведомляем родителя о состоянии загрузки
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isExporting)
    }
  }, [isExporting, onLoadingChange])

  // Получаем типы экспорта из конфигурации
  const getExportTypes = () => {
    if (!exportConfig?.exportTypes) {
      return [
        { 
          value: 'all', 
          label: 'Все записи', 
          description: 'Экспортировать все записи с учетом фильтров',
          icon: cilTask
        }
      ]
    }

    return exportConfig.exportTypes.map(type => ({
      ...type,
      disabled: type.value === 'selected' && selectedIds.length === 0,
      description: type.value === 'selected' 
        ? `Экспортировать ${selectedIds.length} выбранных записей`
        : type.description
    }))
  }

  // Получаем форматы экспорта из конфигурации
  const getExportFormats = () => {
    if (!exportConfig?.formats) {
      return [
        { value: 'csv', label: 'CSV', description: 'Comma Separated Values' }
      ]
    }
    return exportConfig.formats
  }

  // Обработка выбора/снятия выбора поля
  const toggleField = (field) => {
    setSelectedFields(prev => {
      const isSelected = prev.find(f => f.key === field.key)
      if (isSelected) {
        if (field.required) {
          toast.warning('Это поле обязательно для экспорта')
          return prev
        }
        return prev.filter(f => f.key !== field.key)
      } else {
        return [...prev, field]
      }
    })
  }

  // Фильтрация полей по поиску
  const filteredFields = fieldsData?.filter(field =>
    field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.key.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Обработка экспорта
  const onSubmit = async (data) => {
    if (selectedFields.length === 0) {
      toast.error('Выберите хотя бы одно поле для экспорта')
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    try {
      const serviceModule = await getExportService()()
      const service = serviceModule.default || serviceModule[getServiceName()]

      if (!service) {
        throw new Error('Сервис экспорта не найден')
      }

      // Имитация прогресса
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const exportParams = {
        ...data,
        fields: selectedFields.map(f => f.key),
        selectedIds: data.export_type === 'selected' ? selectedIds : undefined,
        filters: data.export_type === 'filtered' ? currentFilters : undefined,
      }

      // Используем универсальный метод экспорта
      const result = await service.export(exportParams)

      clearInterval(progressInterval)
      setExportProgress(100)

      // Обработка результата экспорта
      if (result.data) {
        // Если сервер возвращает прямую ссылку на скачивание
        if (result.data.downloadUrl) {
          const link = document.createElement('a')
          link.href = result.data.downloadUrl
          link.download = result.data.filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } 
        // Если сервер возвращает данные для скачивания
        else if (result.data.content) {
          const blob = new Blob([result.data.content], { 
            type: result.data.contentType || getContentType(data.format)
          })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = result.data.filename || `${type}_export_${new Date().toISOString().split('T')[0]}.${data.format}`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }
      }

      toast.success('Экспорт завершен! Файл сохранен')
      
      if (onSuccess) {
        onSuccess({
          format: data.format,
          fieldsCount: selectedFields.length,
          recordsCount: result.data.recordsCount || 0
        })
      }

    } catch (error) {
      console.error('Export error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Ошибка экспорта'
      toast.error(errorMessage)
      
      if (onError) {
        onError(error)
      }
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const getContentType = (format) => {
    const types = {
      csv: 'text/csv;charset=utf-8;',
      json: 'application/json;charset=utf-8;',
      txt: 'text/plain;charset=utf-8;',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    return types[format] || types.csv
  }

  // Показываем загрузку конфигурации
  if (configLoading || fieldsLoading) {
    return (
      <div className="export-panel p-4 text-center">
        <CSpinner color="primary" className="mb-3" />
        <div>Загрузка конфигурации экспорта...</div>
      </div>
    )
  }

  // Показываем ошибку загрузки
  if (configError || fieldsError) {
    return (
      <div className="export-panel p-4">
        <CAlert color="danger">
          <h6>Ошибка загрузки конфигурации</h6>
          <p className="mb-0">{configError?.message || fieldsError?.message}</p>
        </CAlert>
      </div>
    )
  }

  const exportTypes = getExportTypes()
  const exportFormats = getExportFormats()

  return (
    <div className="export-panel p-4">
      <CForm onSubmit={handleSubmit(onSubmit)}>
        <CRow>
          {/* Настройки экспорта */}
          <CCol lg={6}>
            <CCard className="mb-4">
              <CCardHeader>
                <h6 className="mb-0 d-flex align-items-center">
                  <CIcon icon={cilSettings} className="me-2" />
                  Настройки экспорта
                </h6>
              </CCardHeader>
              <CCardBody>
                {/* Тип экспорта */}
                <div className="mb-4">
                  <CFormLabel className="fw-semibold mb-3">
                    Что экспортировать? <span className="text-danger">*</span>
                  </CFormLabel>
                  <div className="export-type-grid">
                    {exportTypes.map(exportType => (
                      <div
                        key={exportType.value}
                        className={`export-type-card ${watch('export_type') === exportType.value ? 'selected' : ''} ${exportType.disabled ? 'disabled' : ''}`}
                        onClick={() => !exportType.disabled && setValue('export_type', exportType.value)}
                      >
                        <div className="d-flex align-items-start">
                          <CIcon icon={exportType.icon || cilTask} className="me-2 mt-1" />
                          <div className="flex-grow-1">
                            <div className="fw-semibold">{exportType.label}</div>
                            <div className="small text-muted">{exportType.description}</div>
                          </div>
                          <CFormCheck
                            type="radio"
                            {...register('export_type', { required: 'Выберите тип экспорта' })}
                            value={exportType.value}
                            checked={watch('export_type') === exportType.value}
                            disabled={exportType.disabled}
                            readOnly
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.export_type && (
                    <div className="text-danger small mt-2">{errors.export_type.message}</div>
                  )}
                </div>

                {/* Формат файла */}
                <div className="mb-3">
                  <CFormLabel htmlFor="format" className="fw-semibold">
                    Формат файла <span className="text-danger">*</span>
                  </CFormLabel>
                  <CFormSelect
                    id="format"
                    {...register('format', { required: 'Выберите формат' })}
                  >
                    {exportFormats.map(format => (
                      <option key={format.value} value={format.value}>
                        {format.label} {format.description && `- ${format.description}`}
                      </option>
                    ))}
                  </CFormSelect>
                  {errors.format && (
                    <div className="text-danger small mt-1">{errors.format.message}</div>
                  )}
                </div>

                {/* Дополнительные настройки из конфигурации */}
                {exportConfig?.additionalSettings?.map(setting => (
                  <div key={setting.key} className="mb-3">
                    {setting.type === 'checkbox' ? (
                      <CFormCheck
                        id={setting.key}
                        label={setting.label}
                        {...register(setting.key)}
                      />
                    ) : setting.type === 'select' ? (
                      <>
                        <CFormLabel htmlFor={setting.key} className="fw-semibold">
                          {setting.label}
                        </CFormLabel>
                        <CFormSelect
                          id={setting.key}
                          {...register(setting.key)}
                        >
                          {setting.options?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </CFormSelect>
                      </>
                    ) : (
                      <>
                        <CFormLabel htmlFor={setting.key} className="fw-semibold">
                          {setting.label}
                        </CFormLabel>
                        <CFormInput
                          id={setting.key}
                          type={setting.type || 'text'}
                          placeholder={setting.placeholder}
                          {...register(setting.key)}
                        />
                      </>
                    )}
                  </div>
                ))}
              </CCardBody>
            </CCard>
          </CCol>

          {/* Выбор полей */}
          <CCol lg={6}>
            <CCard className="mb-4">
              <CCardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 d-flex align-items-center">
                    <CIcon icon={cilTask} className="me-2" />
                    Поля для экспорта
                  </h6>
                  <CBadge color="primary">
                    Выбрано: {selectedFields.length}
                  </CBadge>
                </div>
              </CCardHeader>
              <CCardBody>
                {/* Поиск полей */}
                <div className="mb-3">
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Найти поле..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </CInputGroup>
                </div>

                {/* Список полей */}
                <div className="fields-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {filteredFields.map(field => {
                    const isSelected = selectedFields.find(f => f.key === field.key)
                    return (
                      <div
                        key={field.key}
                        className={`field-item ${isSelected ? 'selected' : ''} ${field.required ? 'required' : ''}`}
                        onClick={() => toggleField(field)}
                      >
                        <div className="d-flex align-items-center">
                          <CFormCheck
                            checked={!!isSelected}
                            disabled={field.required}
                            readOnly
                            className="me-2"
                          />
                          <div className="flex-grow-1">
                            <div className="fw-semibold d-flex align-items-center">
                              {field.label}
                              {field.required && (
                                <CBadge color="danger" size="sm" className="ms-2">
                                  Обязательно
                                </CBadge>
                              )}
                              {field.sensitive && (
                                <CBadge color="warning" size="sm" className="ms-2">
                                  Конфиденциально
                                </CBadge>
                              )}
                            </div>
                            <div className="small text-muted">
                              {field.key} • {field.type}
                              {field.description && ` • ${field.description}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {filteredFields.length === 0 && searchTerm && (
                  <div className="text-center text-muted py-3">
                    <CIcon icon={cilSearch} className="mb-2" />
                    <div>Поля не найдены</div>
                  </div>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* Предпросмотр настроек */}
        {selectedFields.length > 0 && (
          <CCard className="mb-4">
            <CCardHeader>
              <h6 className="mb-0 d-flex align-items-center">
                <CIcon icon={cilCheckCircle} className="me-2" />
                Предпросмотр экспорта
              </h6>
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol md={3}>
                  <div className="export-info-item">
                    <div className="label">Тип экспорта</div>
                    <div className="value">
                      {exportTypes.find(t => t.value === watch('export_type'))?.label}
                    </div>
                  </div>
                </CCol>
                <CCol md={2}>
                  <div className="export-info-item">
                    <div className="label">Формат</div>
                    <div className="value">{watch('format').toUpperCase()}</div>
                  </div>
                </CCol>
                <CCol md={2}>
                  <div className="export-info-item">
                    <div className="label">Полей</div>
                    <div className="value">{selectedFields.length}</div>
                  </div>
                </CCol>
                <CCol md={5}>
                  <div className="export-info-item">
                    <div className="label">Выбранные поля</div>
                    <div className="selected-fields-preview">
                      {selectedFields.slice(0, 3).map(f => f.label).join(', ')}
                      {selectedFields.length > 3 && ` и еще ${selectedFields.length - 3}...`}
                    </div>
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        )}

        {/* Прогресс экспорта */}
        {isExporting && (
          <CCard className="mb-4">
            <CCardBody>
              <div className="d-flex justify-content-between mb-2">
                <span>Экспорт данных...</span>
                <span>{exportProgress}%</span>
              </div>
              <CProgress>
                <CProgressBar value={exportProgress} />
              </CProgress>
            </CCardBody>
          </CCard>
        )}

        {/* Кнопка экспорта */}
        <div className="d-flex justify-content-end">
          <CButton
            type="submit"
            color="primary"
            disabled={isExporting || selectedFields.length === 0}
            className="px-4"
          >
            {isExporting ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Экспорт...
              </>
            ) : (
              <>
                <CIcon icon={cilCloudDownload} className="me-2" />
                Экспортировать ({selectedFields.length} полей)
              </>
            )}
          </CButton>
        </div>
      </CForm>

      <style jsx>{`
        .export-type-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .export-type-card {
          border: 2px solid var(--cui-border-color);
          border-radius: 0.75rem;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--cui-body-bg);
        }

        .export-type-card:hover:not(.disabled) {
          border-color: var(--cui-primary);
          background: var(--cui-primary-bg-subtle);
        }

        .export-type-card.selected {
          border-color: var(--cui-primary);
          background: var(--cui-primary-bg-subtle);
        }

        .export-type-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .field-item {
          border: 1px solid var(--cui-border-color);
          border-radius: 0.5rem;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--cui-body-bg);
        }

        .field-item:hover:not(.required) {
          border-color: var(--cui-primary);
          background: var(--cui-primary-bg-subtle);
        }

        .field-item.selected {
          border-color: var(--cui-success);
          background: var(--cui-success-bg-subtle);
        }

        .field-item.required {
          border-color: var(--cui-info);
          background: var(--cui-info-bg-subtle);
        }

        .export-info-item .label {
          font-size: 0.75rem;
          color: var(--cui-secondary-color);
          margin-bottom: 0.25rem;
        }

        .export-info-item .value {
          font-weight: 500;
          color: var(--cui-body-color);
        }

        .selected-fields-preview {
          font-size: 0.875rem;
          color: var(--cui-body-color);
        }
      `}</style>
    </div>
  )
}

export default ExportPanel