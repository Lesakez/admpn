// frontend/src/components/modals/panels/ImportPanel.js

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CSpinner,
  CAlert,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CProgress,
  CProgressBar,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CButtonGroup,
  CFormCheck,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudUpload,
  cilFile,
  cilInfo,
  cilCheckCircle,
  cilXCircle,
  cilWarning,
  cilTrash,
  cilReload,
  cilTask,
  cilCode,
  cilDataTransferUp,
  cilEyedropper,
} from '@coreui/icons'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import './ImportPanel.scss'

// Динамическая загрузка сервисов
const getImportService = (type) => {
  switch (type) {
    case 'accounts':
      return () => import('../../../services/accountsService')
    case 'profiles':
      return () => import('../../../services/profilesService')
    case 'proxies':
      return () => import('../../../services/proxiesService')
    case 'phones':
      return () => import('../../../services/phonesService')
    case 'projects':
      return () => import('../../../services/projectsService')
    default:
      return () => import('../../../services/accountsService')
  }
}

const ImportPanel = ({ 
  type = 'accounts', 
  onSuccess, 
  onError, 
  onLoadingChange 
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [importConfig, setImportConfig] = useState(null)
  const [configLoading, setConfigLoading] = useState(true)
  const fileInputRef = useRef(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    trigger
  } = useForm({
    defaultValues: {
      format: '',
      delimiter: '\n',
      text: '',
      skipInvalid: false,
      validateBeforeImport: true,
      updateExisting: false,
    }
  })

  const formatValue = watch('format')
  const delimiterValue = watch('delimiter')
  const textValue = watch('text')

  // Загрузка конфигурации импорта
  useEffect(() => {
    loadImportConfig()
  }, [type])

  // Обновление превью при изменении данных
  useEffect(() => {
    if (textValue && formatValue) {
      updatePreview()
    } else {
      setPreviewData(null)
      setValidationErrors([])
    }
  }, [textValue, formatValue, delimiterValue])

  // Уведомление о загрузке
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading)
    }
  }, [isLoading, onLoadingChange])

  const loadImportConfig = async () => {
    try {
      setConfigLoading(true)
      const serviceModule = await getImportService(type)()
      const service = serviceModule.default || serviceModule[`${type}Service`]

      if (service?.getImportConfig) {
        const response = await service.getImportConfig()
        
        if (response.data?.success) {
          const config = response.data.data
          setImportConfig(config)
          
          // Устанавливаем значения по умолчанию из конфигурации
          if (config.defaultFormat) {
            setValue('format', config.defaultFormat)
          }
          if (config.defaultDelimiter) {
            setValue('delimiter', config.defaultDelimiter)
          }
        } else {
          throw new Error('Invalid config response')
        }
      } else {
        // Fallback конфигурация
        console.warn(`getImportConfig not implemented for ${type}`)
        setImportConfig(getDefaultImportConfig(type))
      }
    } catch (error) {
      console.error('Error loading import config:', error)
      toast.error('Ошибка при загрузке конфигурации импорта')
      
      // Устанавливаем базовую конфигурацию для работы
      setImportConfig(getDefaultImportConfig(type))
    } finally {
      setConfigLoading(false)
    }
  }

  const getDefaultImportConfig = (entityType) => {
    const baseConfig = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxRecords: 10000,
      acceptedFileTypes: '.txt,.csv',
      defaultFormat: 'login:password',
      defaultDelimiter: '\n',
    }

    switch (entityType) {
      case 'accounts':
        return {
          ...baseConfig,
          formats: [
            {
              value: 'login:password',
              label: 'Логин:Пароль',
              example: 'user123:password123',
              description: 'Базовый формат для быстрого импорта'
            },
            {
              value: 'email:password',
              label: 'Email:Пароль',
              example: 'user@example.com:password123',
              description: 'Импорт через email'
            }
          ],
          delimiters: [
            { value: '\n', label: 'Новая строка' },
            { value: ';', label: 'Точка с запятой' },
            { value: ',', label: 'Запятая' },
          ]
        }
      case 'proxies':
        return {
          ...baseConfig,
          formats: [
            {
              value: 'ip:port:login:password',
              label: 'IP:Port:Login:Password',
              example: '192.168.1.1:8080:user:pass',
              description: 'Полный формат прокси'
            },
            {
              value: 'ip:port',
              label: 'IP:Port',
              example: '192.168.1.1:8080',
              description: 'Без авторизации'
            }
          ],
          delimiters: [
            { value: '\n', label: 'Новая строка' },
          ]
        }
      default:
        return {
          ...baseConfig,
          formats: [
            {
              value: 'default',
              label: 'Стандартный формат',
              example: 'data1:data2',
              description: 'Базовый формат импорта'
            }
          ],
          delimiters: [
            { value: '\n', label: 'Новая строка' },
          ]
        }
    }
  }

  const getCurrentFormat = () => {
    if (!importConfig?.formats || !formatValue) return null
    return importConfig.formats.find(f => f.value === formatValue)
  }

  const updatePreview = useCallback(() => {
    if (!textValue || !formatValue) {
      setPreviewData(null)
      return
    }

    const lines = textValue.split(delimiterValue).filter(line => line.trim())
    const format = getCurrentFormat()
    
    if (!format) return

    const validLines = []
    const invalidLines = []
    const samples = []

    lines.forEach((line, index) => {
      const lineNum = index + 1
      const trimmedLine = line.trim()
      
      if (!trimmedLine) return

      try {
        // Простая валидация на основе формата
        const parts = trimmedLine.split(':')
        const expectedParts = format.value.split(':').length
        
        if (parts.length !== expectedParts) {
          invalidLines.push({
            line: lineNum,
            text: trimmedLine,
            error: `Ожидается ${expectedParts} частей, получено ${parts.length}`
          })
        } else {
          validLines.push(trimmedLine)
          
          // Добавляем в примеры первые 5 валидных строк
          if (samples.length < 5) {
            const data = {}
            format.value.split(':').forEach((field, i) => {
              data[field] = parts[i]
            })
            samples.push({ line: lineNum, data })
          }
        }
      } catch (error) {
        invalidLines.push({
          line: lineNum,
          text: trimmedLine,
          error: error.message
        })
      }
    })

    setPreviewData({
      totalLines: lines.length,
      estimatedValid: validLines.length,
      estimatedInvalid: invalidLines.length,
      hasData: validLines.length > 0,
      samples
    })

    setValidationErrors(invalidLines.slice(0, 10)) // Показываем только первые 10 ошибок
  }, [textValue, formatValue, delimiterValue, importConfig])

  const parseImportData = (text) => {
    const format = getCurrentFormat()
    if (!format) return []

    const lines = text.split(delimiterValue).filter(line => line.trim())
    const result = []

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return

      const parts = trimmedLine.split(':')
      const fields = format.value.split(':')
      
      if (parts.length === fields.length) {
        const record = {}
        fields.forEach((field, i) => {
          record[field] = parts[i]
        })
        result.push(record)
      }
    })

    return result
  }

  const handleDragEvents = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e) => {
    handleDragEvents(e)
    setDragActive(true)
  }, [handleDragEvents])

  const handleDragLeave = useCallback((e) => {
    handleDragEvents(e)
    setDragActive(false)
  }, [handleDragEvents])

  const handleDrop = useCallback((e) => {
    handleDragEvents(e)
    setDragActive(false)

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleDragEvents])

  const handleFileUpload = (file) => {
    if (!file) return

    // Проверка размера файла
    if (importConfig?.maxFileSize && file.size > importConfig.maxFileSize) {
      toast.error(`Файл слишком большой. Максимальный размер: ${Math.round(importConfig.maxFileSize / 1024 / 1024)}MB`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result
      if (typeof content === 'string') {
        setValue('text', content)
        toast.success(`Файл "${file.name}" загружен успешно`)
      }
    }
    reader.onerror = () => {
      toast.error('Ошибка чтения файла')
    }
    reader.readAsText(file)
  }

  const onSubmit = async (data) => {
    if (!previewData || previewData.estimatedValid === 0) {
      toast.error('Нет валидных данных для импорта')
      return
    }

    setIsLoading(true)
    setProgress(0)

    try {
      const serviceModule = await getImportService(type)()
      const service = serviceModule.default || serviceModule[`${type}Service`]

      if (!service?.importFromText) {
        throw new Error('Сервис импорта не найден')
      }

      // Имитация прогресса
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await service.importFromText({
        text: data.text,
        format: data.format,
        delimiter: data.delimiter,
        options: {
          skipInvalid: data.skipInvalid,
          validateBeforeImport: data.validateBeforeImport,
          updateExisting: data.updateExisting,
        }
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (result.data?.success) {
        setImportResult(result.data.data)
        toast.success(`Импорт завершен! Добавлено: ${result.data.data.imported}, Ошибок: ${result.data.data.errors}`)
        
        if (onSuccess) {
          onSuccess({
            type: 'import',
            ...result.data.data
          })
        }
      } else {
        throw new Error(result.data?.error || 'Ошибка импорта')
      }

    } catch (error) {
      console.error('Import error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Ошибка импорта'
      toast.error(errorMessage)
      
      if (onError) {
        onError(error)
      }
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  const handleClearData = () => {
    reset()
    setPreviewData(null)
    setValidationErrors([])
    setImportResult(null)
    setProgress(0)
  }

  const loadSampleData = () => {
    const format = getCurrentFormat()
    if (format?.example) {
      const sampleLines = []
      for (let i = 0; i < 5; i++) {
        sampleLines.push(format.example.replace(/\d+/g, (match) => parseInt(match) + i))
      }
      setValue('text', sampleLines.join('\n'))
      toast.info('Загружены примеры данных')
    }
  }

  if (configLoading) {
    return (
      <div className="text-center p-5">
        <CSpinner color="primary" />
        <p className="mt-2">Загрузка конфигурации...</p>
      </div>
    )
  }

  return (
    <div className="import-panel">
      {/* Результат импорта */}
      {importResult && (
        <CCard className="import-panel__result">
          <CCardBody>
            <h6 className="import-panel__result-title">
              <CIcon icon={cilCheckCircle} className="text-success me-2" />
              Импорт завершен успешно!
            </h6>
            <CRow>
              <CCol xs={6} md={3}>
                <div className="import-panel__result-stat">
                  <div className="import-panel__result-value text-success">
                    {importResult.imported || 0}
                  </div>
                  <div className="import-panel__result-label">Добавлено</div>
                </div>
              </CCol>
              <CCol xs={6} md={3}>
                <div className="import-panel__result-stat">
                  <div className="import-panel__result-value text-info">
                    {importResult.updated || 0}
                  </div>
                  <div className="import-panel__result-label">Обновлено</div>
                </div>
              </CCol>
              <CCol xs={6} md={3}>
                <div className="import-panel__result-stat">
                  <div className="import-panel__result-value text-warning">
                    {importResult.skipped || 0}
                  </div>
                  <div className="import-panel__result-label">Пропущено</div>
                </div>
              </CCol>
              <CCol xs={6} md={3}>
                <div className="import-panel__result-stat">
                  <div className="import-panel__result-value text-danger">
                    {importResult.errors || 0}
                  </div>
                  <div className="import-panel__result-label">Ошибок</div>
                </div>
              </CCol>
            </CRow>
            <div className="text-center mt-3">
              <CButton color="primary" onClick={handleClearData}>
                Новый импорт
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}

      {!importResult && (
        <CForm onSubmit={handleSubmit(onSubmit)}>
          <CRow>
            {/* Настройки формата */}
            <CCol lg={6}>
              <CCard className="mb-4">
                <CCardHeader>
                  <h6 className="mb-0 d-flex align-items-center">
                    <CIcon icon={cilCode} className="me-2" />
                    Настройки формата
                  </h6>
                </CCardHeader>
                <CCardBody>
                  {/* Формат данных */}
                  <div className="mb-3">
                    <CFormLabel htmlFor="format" className="fw-semibold">
                      Формат данных <span className="text-danger">*</span>
                    </CFormLabel>
                    <CFormSelect
                      id="format"
                      invalid={!!errors.format}
                      {...register('format', { required: 'Выберите формат' })}
                    >
                      <option value="">-- Выберите формат --</option>
                      {importConfig?.formats?.map(fmt => (
                        <option key={fmt.value} value={fmt.value}>
                          {fmt.label}
                        </option>
                      ))}
                    </CFormSelect>
                    {errors.format && (
                      <div className="invalid-feedback">{errors.format.message}</div>
                    )}
                    
                    {formatValue && getCurrentFormat() && (
                      <CAlert color="info" className="mt-2 py-2">
                        <small>
                          <strong>Пример:</strong> {getCurrentFormat().example}
                        </small>
                      </CAlert>
                    )}
                  </div>

                  {/* Разделитель */}
                  <div className="mb-3">
                    <CFormLabel htmlFor="delimiter" className="fw-semibold">
                      Разделитель строк
                    </CFormLabel>
                    <CFormSelect
                      id="delimiter"
                      {...register('delimiter')}
                    >
                      {importConfig?.delimiters?.map(delim => (
                        <option key={delim.value} value={delim.value}>
                          {delim.label}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>

                  {/* Опции импорта */}
                  <div className="import-panel__options">
                    <CFormCheck
                      id="skipInvalid"
                      label="Пропускать невалидные строки"
                      {...register('skipInvalid')}
                    />
                    <CFormCheck
                      id="validateBeforeImport"
                      label="Валидировать перед импортом"
                      defaultChecked
                      {...register('validateBeforeImport')}
                    />
                    <CFormCheck
                      id="updateExisting"
                      label="Обновлять существующие записи"
                      {...register('updateExisting')}
                    />
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Загрузка данных */}
            <CCol lg={6}>
              <CCard className="mb-4">
                <CCardHeader>
                  <h6 className="mb-0 d-flex align-items-center">
                    <CIcon icon={cilCloudUpload} className="me-2" />
                    Загрузка данных
                  </h6>
                </CCardHeader>
                <CCardBody>
                  {/* Drag & Drop зона */}
                  <div
                    className={`import-panel__drag-zone ${dragActive ? 'import-panel__drag-zone--active' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragEvents}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CIcon icon={cilFile} size="3xl" className="import-panel__drag-icon" />
                    <h5 className="import-panel__drag-title">
                      Перетащите файл сюда или кликните для выбора
                    </h5>
                    <p className="import-panel__drag-subtitle mb-0">
                      Поддерживаются файлы: {importConfig?.acceptedFileTypes || '.txt, .csv'}
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="import-panel__file-input"
                    accept={importConfig?.acceptedFileTypes || '.txt,.csv'}
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />

                  {/* Кнопки управления */}
                  <div className="import-panel__controls mt-3">
                    <CButton
                      size="sm"
                      color="secondary"
                      onClick={loadSampleData}
                      disabled={!formatValue}
                    >
                      <CIcon icon={cilTask} className="me-2" />
                      Загрузить примеры
                    </CButton>
                    <CButton
                      size="sm"
                      color="danger"
                      variant="outline"
                      onClick={handleClearData}
                      disabled={!textValue}
                    >
                      <CIcon icon={cilTrash} className="me-2" />
                      Очистить
                    </CButton>
                  </div>

                  {/* Textarea для ввода */}
                  <div className="mt-3">
                    <CFormLabel htmlFor="importText" className="fw-semibold">
                      Текст для импорта <span className="text-danger">*</span>
                    </CFormLabel>
                    <CFormTextarea
                      id="importText"
                      rows="10"
                      placeholder="Вставьте данные сюда или загрузите файл..."
                      className="import-panel__textarea"
                      invalid={!!errors.text}
                      {...register('text', { required: 'Введите данные для импорта' })}
                    />
                    {errors.text && (
                      <div className="invalid-feedback">{errors.text.message}</div>
                    )}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* Предпросмотр и валидация */}
          {previewData && (
            <CCard className="import-panel__preview mb-4">
              <CCardBody>
                <h6 className="import-panel__preview-title">
                  <CIcon icon={cilEyedropper} className="me-2" />
                  Предпросмотр данных
                </h6>

                {/* Статистика */}
                <div className="import-panel__preview-stats">
                  <CBadge color="info" className="me-2">
                    Всего строк: {previewData.totalLines}
                  </CBadge>
                  <CBadge color="success" className="me-2">
                    Валидных: {previewData.estimatedValid}
                  </CBadge>
                  <CBadge color="danger">
                    Ошибок: {previewData.estimatedInvalid}
                  </CBadge>
                </div>

                {/* Таблица примеров */}
                {previewData.samples.length > 0 && (
                  <>
                    <h6 className="mt-3 mb-2">Примеры данных:</h6>
                    <CTable small bordered className="import-panel__preview-table">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell width="60">#</CTableHeaderCell>
                          {Object.keys(previewData.samples[0].data).map(key => (
                            <CTableHeaderCell key={key}>{key}</CTableHeaderCell>
                          ))}
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {previewData.samples.map((sample, idx) => (
                          <CTableRow key={idx}>
                            <CTableDataCell>
                              <small className="text-muted">{sample.line}</small>
                            </CTableDataCell>
                            {Object.values(sample.data).map((value, i) => (
                              <CTableDataCell key={i}>
                                <code className="import-panel__code">{value}</code>
                              </CTableDataCell>
                            ))}
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </>
                )}

                {/* Ошибки валидации */}
                {validationErrors.length > 0 && (
                  <>
                    <h6 className="mt-4 mb-2 text-danger">
                      <CIcon icon={cilWarning} className="me-2" />
                      Ошибки валидации:
                    </h6>
                    <div className="import-panel__errors">
                      {validationErrors.map((error, idx) => (
                        <CAlert key={idx} color="danger" className="py-2">
                          <strong>Строка {error.line}:</strong> {error.error}
                          <br />
                          <small className="text-muted">Данные: {error.text}</small>
                        </CAlert>
                      ))}
                    </div>
                  </>
                )}
              </CCardBody>
            </CCard>
          )}

          {/* Прогресс импорта */}
          {isLoading && (
            <div className="import-panel__progress">
              <div className="import-panel__progress-header">
                <span>Импорт данных...</span>
                <span>{progress}%</span>
              </div>
              <CProgress>
                <CProgressBar value={progress} animated />
              </CProgress>
            </div>
          )}

          {/* Кнопка импорта */}
          <div className="text-center">
            <CButton
              type="submit"
              color="primary"
              size="lg"
              disabled={isLoading || !previewData?.hasData}
            >
              {isLoading ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Импортируется...
                </>
              ) : (
                <>
                  <CIcon icon={cilDataTransferUp} className="me-2" />
                  Импортировать {previewData?.estimatedValid || 0} записей
                </>
              )}
            </CButton>
          </div>
        </CForm>
      )}
    </div>
  )
}

export default ImportPanel