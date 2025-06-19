// frontend/src/components/modals/panels/ImportPanel.js
import React, { useState, useEffect, useRef, useMemo } from 'react'
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
  cilCloudUpload,
  cilFile,
  cilInfo,
  cilCheckCircle,
  cilXCircle,
  cilWarning,
  cilTrash,
  cilReload,
} from '@coreui/icons'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import './ImportPanel.scss'

const ImportPanel = ({ config, type, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [service, setService] = useState(null)
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewData, setPreviewData] = useState(null)
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
      format: config?.formats?.[0]?.value || '',
      delimiter: config?.delimiters?.[0]?.value || '\n',
      text: '',
      ...config?.defaultValues
    }
  })

  const watchedFormat = watch('format')
  const watchedText = watch('text')
  const watchedDelimiter = watch('delimiter')

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

  // Автоматический предпросмотр данных
  useEffect(() => {
    if (watchedText && watchedDelimiter && watchedFormat) {
      generatePreview()
    } else {
      setPreviewData(null)
    }
  }, [watchedText, watchedDelimiter, watchedFormat])

  // Сброс результатов при изменении входных данных
  useEffect(() => {
    if (importResult) {
      setImportResult(null)
    }
  }, [watchedText, watchedFormat, watchedDelimiter])

  const getCurrentFormat = () => {
    return config?.formats?.find(f => f.value === watchedFormat)
  }

  const generatePreview = () => {     
    try {
      const lines = watchedText.split(watchedDelimiter).filter(line => line.trim())
      const format = getCurrentFormat()
      
      if (!format || lines.length === 0) {
        setPreviewData(null)
        return
      }

      const preview = {
        totalLines: lines.length,
        validLines: 0,
        invalidLines: 0,
        samples: []
      }

      // Анализируем первые 5 строк как примеры
      const sampleLines = lines.slice(0, 5)
      
      sampleLines.forEach((line, index) => {
        const parsed = parseLineByFormat(line, format)
        preview.samples.push({
          line: index + 1,
          raw: line,
          parsed,
          valid: parsed.valid
        })
        
        if (parsed.valid) {
          preview.validLines++
        } else {
          preview.invalidLines++
        }
      })

      // Примерная оценка для всех строк
      const validRatio = preview.validLines / sampleLines.length
      preview.estimatedValid = Math.round(lines.length * validRatio)
      preview.estimatedInvalid = lines.length - preview.estimatedValid

      setPreviewData(preview)
    } catch (error) {
      console.error('Preview generation error:', error)
      setPreviewData(null)
    }
  }

  const parseLineByFormat = (line, format) => {
    if (!line?.trim()) {
      return { valid: false, reason: 'Пустая строка' }
    }

    try {
      // Динамический парсинг на основе формата
      if (format.parser && typeof format.parser === 'function') {
        return format.parser(line)
      }

      // Стандартный парсинг для базовых форматов
      if (format.value.includes(':')) {
        const parts = line.split(':')
        if (parts.length < 2) {
          return { valid: false, reason: 'Неверный формат' }
        }
        
        const result = { valid: true }
        const formatParts = format.value.split(':')
        
        formatParts.forEach((part, index) => {
          result[part] = parts[index]?.trim() || ''
        })
        
        return result
      }

      // Парсинг через кастомный разделитель
      if (format.separator) {
        const parts = line.split(format.separator)
        if (parts.length < (format.requiredFields || 1)) {
          return { valid: false, reason: 'Недостаточно полей' }
        }
        
        const result = { valid: true }
        format.fields?.forEach((field, index) => {
          result[field] = parts[index]?.trim() || ''
        })
        
        return result
      }

      return { valid: true, data: line }
    } catch (error) {
      return { valid: false, reason: 'Ошибка парсинга' }
    }
  }

  const handleFileUpload = (file) => {
    if (!file) return

    // Динамическая проверка типов файлов
    if (config?.acceptedFileTypes) {
      const allowedTypes = config.acceptedFileTypes.split(',').map(t => t.trim())
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
      if (!allowedTypes.includes(fileExtension)) {
        toast.error(`Неподдерживаемый тип файла. Разрешены: ${config.acceptedFileTypes}`)
        return
      }
    }

    // Динамическая проверка размера
    if (config?.maxFileSize && file.size > config.maxFileSize) {
      const maxSizeMB = Math.round(config.maxFileSize / 1024 / 1024)
      toast.error(`Файл слишком большой. Максимальный размер: ${maxSizeMB}MB`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setValue('text', e.target.result)
      toast.success(`Файл "${file.name}" загружен`)
    }
    reader.onerror = () => {
      toast.error('Ошибка при чтении файла')
    }
    reader.readAsText(file, config?.encoding || 'UTF-8')
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const onSubmit = async (data) => {
    if (!service) {
      toast.error('Сервис недоступен')
      return
    }

    if (!data.text?.trim()) {
      toast.error('Введите данные для импорта')
      return
    }

    setIsLoading(true)
    setProgress(0)
    setImportResult(null)

    try {
      // Прогресс-бар
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // Подготовка данных для импорта
      const importPayload = {
        text: data.text,
        format: data.format,
        delimiter: data.delimiter,
        ...config?.additionalParams,
        ...data
      }

      // Динамический вызов метода сервиса
      const method = config?.method || 'importFromText'
      const response = await service[method](importPayload)
      
      clearInterval(progressInterval)
      setProgress(100)
      
      // Универсальная обработка результата
      const result = response?.data?.data || response?.data || response
      setImportResult(result)
      
      // Динамическое определение успешности
      const isSuccess = result?.success !== false && (
        result?.imported > 0 || 
        result?.created > 0 || 
        result?.processed > 0 ||
        (result?.errors?.length === 0 && result?.total > 0)
      )
      
      if (isSuccess) {
        toast.success(config?.successMessage || 'Импорт завершен успешно')
        onSuccess?.(result)
      } else {
        toast.warning(config?.warningMessage || 'Импорт завершен с ошибками')
      }
      
    } catch (error) {
      setProgress(100)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          error.message ||
                          `Ошибка при импорте ${type}`
      
      toast.error(errorMessage)
      setImportResult({
        success: false,
        imported: 0,
        errors: [errorMessage],
        total: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearData = () => {
    setValue('text', '')
    setImportResult(null)
    setPreviewData(null)
  }

  const loadExample = () => {
    const format = getCurrentFormat()
    if (format?.example) {
      setValue('text', format.example)
    }
  }

  if (!config) {
    return (
      <CAlert color="warning">
        <CIcon icon={cilInfo} className="me-2" />
        Конфигурация импорта не найдена
      </CAlert>
    )
  }

  return (
    <div className="import-panel">
      <CForm onSubmit={handleSubmit(onSubmit)}>
        {/* Описание */}
        {config.description && (
          <CAlert color="info" className="mb-4">
            <CIcon icon={cilInfo} className="me-2" />
            {config.description}
          </CAlert>
        )}

        <CRow>
          {/* Настройки формата */}
          <CCol lg={6}>
            <div className="mb-4">
              <CFormLabel htmlFor="format" className="fw-semibold">
                Формат данных *
              </CFormLabel>
              <CFormSelect
                id="format"
                invalid={!!errors.format}
                {...register('format', {
                  required: 'Выберите формат данных'
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
              
              {/* Описание формата */}
              {getCurrentFormat()?.description && (
                <div className="form-text mt-2">
                  {getCurrentFormat().description}
                </div>
              )}
            </div>

            {/* Разделитель */}
            {config.delimiters && (
              <div className="mb-4">
                <CFormLabel htmlFor="delimiter" className="fw-semibold">
                  Разделитель строк
                </CFormLabel>
                <CFormSelect
                  id="delimiter"
                  {...register('delimiter')}
                >
                  {config.delimiters.map(delimiter => (
                    <option key={delimiter.value} value={delimiter.value}>
                      {delimiter.label}
                    </option>
                  ))}
                </CFormSelect>
              </div>
            )}

            {/* Дополнительные поля из конфигурации */}
            {config.additionalFields?.map(field => (
              <div key={field.key} className="mb-3">
                <CFormLabel htmlFor={field.key} className="fw-semibold">
                  {field.label} {field.required && '*'}
                </CFormLabel>
                
                {field.type === 'select' ? (
                  <CFormSelect
                    id={field.key}
                    {...register(field.key, field.validation)}
                  >
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </CFormSelect>
                ) : (
                  <CFormInput
                    type={field.type || 'text'}
                    id={field.key}
                    placeholder={field.placeholder}
                    {...register(field.key, field.validation)}
                  />
                )}
                
                {field.description && (
                  <div className="form-text">{field.description}</div>
                )}
              </div>
            ))}
          </CCol>

          {/* Загрузка данных */}
          <CCol lg={6}>
            {/* Drag & Drop зона */}
            <div
              className={`import-panel__drag-zone ${dragActive ? 'import-panel__drag-zone--active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CIcon icon={cilFile} size="2xl" className="import-panel__drag-icon" />
              <p className="import-panel__drag-title">
                <strong>Перетащите файл сюда</strong> или нажмите для выбора
              </p>
              <p className="import-panel__drag-subtitle">
                {config.acceptedFileTypes && `Поддерживаемые форматы: ${config.acceptedFileTypes}`}
                {config.maxFileSize && ` • Макс. размер: ${Math.round(config.maxFileSize / 1024 / 1024)}MB`}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="import-panel__file-input"
              accept={config.acceptedFileTypes}
              onChange={handleFileInputChange}
            />

            {/* Кнопки управления */}
            <div className="import-panel__controls">
              <CButton
                type="button"
                color="outline-primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <CIcon icon={cilFile} className="me-1" />
                Выбрать файл
              </CButton>
              
              {getCurrentFormat()?.example && (
                <CButton
                  type="button"
                  color="outline-secondary"
                  size="sm"
                  onClick={loadExample}
                >
                  Загрузить пример
                </CButton>
              )}
              
              {watchedText && (
                <CButton
                  type="button"
                  color="outline-danger"
                  size="sm"
                  onClick={clearData}
                >
                  <CIcon icon={cilTrash} className="me-1" />
                  Очистить
                </CButton>
              )}
            </div>
          </CCol>
        </CRow>

        {/* Текстовое поле для ввода данных */}
        <div className="mb-4">
          <CFormLabel htmlFor="text" className="fw-semibold">
            Данные для импорта
          </CFormLabel>
          <CFormTextarea
            id="text"
            rows={8}
            className="import-panel__textarea"
            placeholder={getCurrentFormat()?.example || 'Введите или вставьте данные для импорта...'}
            invalid={!!errors.text}
            {...register('text', {
              required: 'Введите данные для импорта'
            })}
          />
          {errors.text && (
            <div className="invalid-feedback d-block">{errors.text.message}</div>
          )}
        </div>

        {/* Предпросмотр данных */}
        {previewData && (
          <CCard className="import-panel__preview">
            <CCardBody>
              <h6 className="import-panel__preview-title">
                <CIcon icon={cilInfo} className="me-2" />
                Предпросмотр данных
              </h6>
              
              <div className="import-panel__preview-stats">
                <span className="badge bg-primary me-2">
                  Всего строк: {previewData.totalLines}
                </span>
                <span className="badge bg-success me-2">
                  Валидные: ~{previewData.estimatedValid}
                </span>
                {previewData.estimatedInvalid > 0 && (
                  <span className="badge bg-warning">
                    С ошибками: ~{previewData.estimatedInvalid}
                  </span>
                )}
              </div>

              {previewData.samples.length > 0 && (
                <CTable size="sm" className="import-panel__preview-table">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Строка</CTableHeaderCell>
                      <CTableHeaderCell>Данные</CTableHeaderCell>
                      <CTableHeaderCell>Статус</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {previewData.samples.map((sample, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell>{sample.line}</CTableDataCell>
                        <CTableDataCell>
                          <code className="import-panel__code">{sample.raw}</code>
                        </CTableDataCell>
                        <CTableDataCell>
                          {sample.valid ? (
                            <CIcon icon={cilCheckCircle} className="text-success" />
                          ) : (
                            <CIcon 
                              icon={cilXCircle} 
                              className="text-danger" 
                              title={sample.parsed?.reason}
                            />
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
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
              <CProgressBar value={progress} />
            </CProgress>
          </div>
        )}

        {/* Результат импорта */}
        {importResult && (
          <CCard className="import-panel__result">
            <CCardBody>
              <h6 className="import-panel__result-title">
                <CIcon 
                  icon={importResult.success !== false ? cilCheckCircle : cilXCircle} 
                  className={`me-2 ${importResult.success !== false ? 'text-success' : 'text-danger'}`}
                />
                Результат импорта
              </h6>

              <CRow>
                {Object.entries(config.resultFields || {}).map(([key, label]) => (
                  importResult[key] !== undefined && (
                    <CCol key={key} sm={6} md={3} className="mb-2">
                      <div className="import-panel__result-stat">
                        <div className="import-panel__result-value">{importResult[key]}</div>
                        <div className="import-panel__result-label">{label}</div>
                      </div>
                    </CCol>
                  )
                ))}
              </CRow>

              {/* Ошибки */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="import-panel__errors">
                  <h6 className="text-danger">Ошибки:</h6>
                  <ul className="import-panel__errors-list">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <li key={index} className="text-danger">{error}</li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li className="text-muted">
                        И еще {importResult.errors.length - 10} ошибок...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </CCardBody>
          </CCard>
        )}

        {/* Кнопка импорта */}
        <div className="import-panel__submit">
          <CButton
            type="submit"
            color="primary"
            disabled={isLoading || !watchedText?.trim()}
            className="px-4"
          >
            {isLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Импортируем...
              </>
            ) : (
              <>
                <CIcon icon={cilCloudUpload} className="me-2" />
                {config.submitLabel || 'Импортировать'}
                {previewData && ` (${previewData.totalLines})`}
              </>
            )}
          </CButton>
        </div>
      </CForm>
    </div>
  )
}

export default ImportPanel