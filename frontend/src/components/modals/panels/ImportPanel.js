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
      delimiter: '',
      text: '',
      skipInvalid: true,
      validateBeforeImport: true,
      updateExisting: false,
    }
  })

  const textValue = watch('text')
  const formatValue = watch('format')
  const delimiterValue = watch('delimiter')

  // Загрузка конфигурации с сервера
  useEffect(() => {
    loadImportConfig()
  }, [type])

  // Парсинг данных при изменении
  useEffect(() => {
    if (textValue && formatValue) {
      parseAndValidateText()
    } else {
      setPreviewData(null)
      setValidationErrors([])
    }
  }, [textValue, formatValue, delimiterValue])

  // Уведомление родительского компонента о загрузке
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
          setImportConfig(response.data.data)
          // Устанавливаем значения по умолчанию
          if (response.data.data.formats?.length > 0) {
            setValue('format', response.data.data.formats[0].value)
          }
          if (response.data.data.delimiters?.length > 0) {
            setValue('delimiter', response.data.data.delimiters[0].value)
          }
        }
      }
    } catch (error) {
      console.error('Error loading import config:', error)
      toast.error('Ошибка загрузки конфигурации')
    } finally {
      setConfigLoading(false)
    }
  }

  const getCurrentFormat = () => {
    return importConfig?.formats?.find(f => f.value === formatValue)
  }

  const parseAndValidateText = () => {
    const lines = textValue.trim().split('\n').filter(line => line.trim())
    if (lines.length === 0) {
      setPreviewData(null)
      return
    }

    const format = getCurrentFormat()
    if (!format) return

    const samples = []
    const errors = []
    let validCount = 0
    let invalidCount = 0

    // Анализируем максимум 100 строк для предпросмотра
    const linesToAnalyze = Math.min(lines.length, 100)
    
    for (let i = 0; i < linesToAnalyze; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const parsed = parseLine(line, format, delimiterValue)
        if (parsed && Object.keys(parsed).length > 0) {
          samples.push({
            line: i + 1,
            data: parsed,
            valid: true
          })
          validCount++
        } else {
          throw new Error('Пустой результат парсинга')
        }
      } catch (error) {
        errors.push({
          line: i + 1,
          text: line,
          error: error.message
        })
        invalidCount++
      }

      // Ограничиваем количество примеров
      if (samples.length >= 10) break
    }

    // Оценка для больших файлов
    const totalLines = lines.length
    const sampleRate = linesToAnalyze / totalLines
    const estimatedValid = Math.round(validCount / sampleRate)
    const estimatedInvalid = Math.round(invalidCount / sampleRate)

    setPreviewData({
      totalLines,
      estimatedValid,
      estimatedInvalid,
      samples: samples.slice(0, 5), // Показываем максимум 5 примеров
      hasData: samples.length > 0
    })

    setValidationErrors(errors.slice(0, 10)) // Показываем максимум 10 ошибок
  }

  const parseLine = (line, format, delimiter) => {
    if (!format.pattern) {
      // Простой парсинг по разделителю
      const parts = line.split(delimiter || format.delimiter || ':')
      const result = {}
      
      format.fields?.forEach((field, index) => {
        if (parts[index]) {
          result[field] = parts[index].trim()
        }
      })
      
      return result
    }

    // Парсинг по паттерну регулярного выражения
    const regex = new RegExp(format.pattern)
    const match = line.match(regex)
    
    if (!match) {
      throw new Error('Строка не соответствует формату')
    }

    const result = {}
    format.fields?.forEach((field, index) => {
      if (match[index + 1]) {
        result[field] = match[index + 1].trim()
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
                      <option value="">Выберите формат</option>
                      {importConfig?.formats?.map(format => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </CFormSelect>
                    {errors.format && (
                      <div className="invalid-feedback">{errors.format.message}</div>
                    )}
                  </div>

                  {/* Разделитель */}
                  {getCurrentFormat()?.requiresDelimiter && (
                    <div className="mb-3">
                      <CFormLabel htmlFor="delimiter" className="fw-semibold">
                        Разделитель
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
                  )}

                  {/* Пример формата */}
                  {getCurrentFormat()?.example && (
                    <CAlert color="info" className="mb-3">
                      <h6 className="alert-heading">
                        <CIcon icon={cilInfo} className="me-2" />
                        Пример формата:
                      </h6>
                      <code className="d-block">{getCurrentFormat().example}</code>
                      {getCurrentFormat().description && (
                        <small className="d-block mt-2">
                          {getCurrentFormat().description}
                        </small>
                      )}
                    </CAlert>
                  )}

                  {/* Опции импорта */}
                  <h6 className="mb-3">Опции импорта</h6>
                  
                  <div className="mb-2">
                    <CFormCheck
                      id="skipInvalid"
                      label="Пропускать невалидные строки"
                      {...register('skipInvalid')}
                    />
                  </div>
                  
                  <div className="mb-2">
                    <CFormCheck
                      id="validateBeforeImport"
                      label="Валидировать перед импортом"
                      {...register('validateBeforeImport')}
                    />
                  </div>
                  
                  <div className="mb-2">
                    <CFormCheck
                      id="updateExisting"
                      label="Обновлять существующие записи"
                      {...register('updateExisting')}
                    />
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Ввод данных */}
            <CCol lg={6}>
              <CCard className="mb-4">
                <CCardHeader>
                  <h6 className="mb-0 d-flex align-items-center">
                    <CIcon icon={cilCloudUpload} className="me-2" />
                    Данные для импорта
                  </h6>
                </CCardHeader>
                <CCardBody>
                  {/* Drag & Drop зона */}
                  <div
                    className={`import-panel__drag-zone ${dragActive ? 'import-panel__drag-zone--active' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragEvents}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CIcon icon={cilFile} size="3xl" className="import-panel__drag-icon" />
                    <h5 className="import-panel__drag-title">
                      Перетащите файл сюда
                    </h5>
                    <p className="import-panel__drag-subtitle">
                      или нажмите для выбора файла
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="import-panel__file-input"
                    accept=".txt,.csv"
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