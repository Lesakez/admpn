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

const ImportPanel = ({ 
  type, 
  config, 
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

  // Получаем сервис для импорта
  const getImportService = useCallback(() => {
    const services = {
      accounts: () => import('../../../services/accountsService'),
      proxies: () => import('../../../services/proxiesService'),
      phones: () => import('../../../services/phonesService'),
      profiles: () => import('../../../services/profilesService'),
      projects: () => import('../../../services/projectsService'),
    }
    return services[type] || services.accounts
  }, [type])

  // Уведомляем родителя о состоянии загрузки
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading)
    }
  }, [isLoading, onLoadingChange])

  // Автоматический предпросмотр данных
  useEffect(() => {
    if (watchedText && watchedDelimiter && watchedFormat) {
      generatePreview()
    } else {
      setPreviewData(null)
      setValidationErrors([])
    }
  }, [watchedText, watchedDelimiter, watchedFormat])

  // Сброс результатов при изменении входных данных
  useEffect(() => {
    if (importResult) {
      setImportResult(null)
      setProgress(0)
    }
  }, [watchedText, watchedFormat, watchedDelimiter])

  const getCurrentFormat = () => {
    return config?.formats?.find(f => f.value === watchedFormat)
  }

  const parseLineByFormat = (line, format) => {
    const trimmedLine = line.trim()
    if (!trimmedLine) return null

    try {
      switch (format) {
        case 'login:password':
          const [login, password] = trimmedLine.split(':')
          return login && password ? { login, password } : null

        case 'email:password':
          const [email, emailPassword] = trimmedLine.split(':')
          return email && emailPassword && email.includes('@') ? { email, password: emailPassword } : null

        case 'login:email:password':
          const [loginPart, emailPart, passwordPart] = trimmedLine.split(':')
          return loginPart && emailPart && passwordPart && emailPart.includes('@') 
            ? { login: loginPart, email: emailPart, password: passwordPart } : null

        case 'ip:port':
          const [ip, port] = trimmedLine.split(':')
          const portNum = parseInt(port)
          return ip && portNum && portNum > 0 && portNum <= 65535 ? { ip, port: portNum } : null

        case 'ip:port:login:password':
          const [proxyIp, proxyPort, proxyLogin, proxyPassword] = trimmedLine.split(':')
          const proxyPortNum = parseInt(proxyPort)
          return proxyIp && proxyPortNum && proxyLogin && proxyPassword 
            ? { ip: proxyIp, port: proxyPortNum, login: proxyLogin, password: proxyPassword } : null

        case 'protocol://ip:port':
          const urlMatch = trimmedLine.match(/^(https?|socks[45]?):\/\/([^:]+):(\d+)$/)
          if (urlMatch) {
            const [, protocol, ip, port] = urlMatch
            return { protocol, ip, port: parseInt(port) }
          }
          return null

        case 'model:device':
          const [model, device] = trimmedLine.split(':')
          return model && device ? { model, device } : null

        case 'name:platform':
          const [name, platform] = trimmedLine.split(':')
          return name && platform ? { name, platform } : null

        case 'name:description':
          const [projectName, description] = trimmedLine.split(':')
          return projectName ? { name: projectName, description: description || '' } : null

        case 'json':
          return JSON.parse(trimmedLine)

        default:
          return { raw: trimmedLine }
      }
    } catch (error) {
      return null
    }
  }

  const generatePreview = () => {
    try {
      const lines = watchedText.split(watchedDelimiter).filter(line => line.trim())
      const samples = []
      const errors = []
      let validCount = 0
      let invalidCount = 0

      lines.slice(0, 10).forEach((line, index) => {
        const parsed = parseLineByFormat(line, watchedFormat)
        const isValid = parsed !== null
        
        if (isValid) {
          validCount++
        } else {
          invalidCount++
          errors.push({
            line: index + 1,
            text: line.trim(),
            error: 'Неверный формат данных'
          })
        }

        samples.push({
          line: index + 1,
          raw: line.trim(),
          parsed,
          valid: isValid
        })
      })

      // Оценка для всех строк
      const totalLines = lines.length
      const sampleRate = Math.min(10, totalLines) / totalLines
      const estimatedValid = Math.round(validCount / sampleRate)
      const estimatedInvalid = Math.round(invalidCount / sampleRate)

      setPreviewData({
        totalLines,
        estimatedValid,
        estimatedInvalid,
        samples,
        hasData: samples.length > 0
      })

      setValidationErrors(errors)
    } catch (error) {
      setPreviewData(null)
      setValidationErrors([{ line: 0, text: 'Ошибка парсинга', error: error.message }])
    }
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
      const serviceModule = await getImportService()()
      const service = serviceModule.default || serviceModule[config.service]

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
          skipInvalid: true,
          validateBeforeImport: true
        }
      })

      clearInterval(progressInterval)
      setProgress(100)

      setImportResult(result.data)
      toast.success(`Импорт завершен! Добавлено: ${result.data.imported}, Ошибок: ${result.data.errors}`)
      
      if (onSuccess) {
        onSuccess(result.data)
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
    }
  }

  const handleClearData = () => {
    setValue('text', '')
    setPreviewData(null)
    setValidationErrors([])
    setImportResult(null)
    setProgress(0)
  }

  const loadSampleData = () => {
    const format = getCurrentFormat()
    if (format?.example) {
      const sampleLines = [
        format.example,
        format.example.replace(/user123|user@mail\.com/g, 'user456').replace(/pass123/g, 'pass456'),
        format.example.replace(/user123|user@mail\.com/g, 'user789').replace(/pass123/g, 'pass789')
      ]
      setValue('text', sampleLines.join('\n'))
      toast.info('Загружены примеры данных')
    }
  }

  return (
    <div className="import-panel p-4">
      {/* Результат импорта */}
      {importResult && (
        <CAlert color="success" className="mb-4">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h6 className="mb-2">
                <CIcon icon={cilCheckCircle} className="me-2" />
                Импорт завершен успешно!
              </h6>
              <div className="d-flex gap-3">
                <CBadge color="success">Добавлено: {importResult.imported}</CBadge>
                <CBadge color="info">Обновлено: {importResult.updated || 0}</CBadge>
                <CBadge color="warning">Пропущено: {importResult.skipped || 0}</CBadge>
                {importResult.errors > 0 && (
                  <CBadge color="danger">Ошибок: {importResult.errors}</CBadge>
                )}
              </div>
            </div>
            <CButton 
              color="light" 
              size="sm" 
              onClick={handleClearData}
            >
              Новый импорт
            </CButton>
          </div>
        </CAlert>
      )}

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
                  
                  {/* Пример формата */}
                  {getCurrentFormat()?.example && (
                    <div className="form-text mt-2">
                      <strong>Пример:</strong> <code>{getCurrentFormat().example}</code>
                    </div>
                  )}
                </div>

                {/* Разделитель строк */}
                {config.delimiters && (
                  <div className="mb-3">
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

                {/* Кнопки управления */}
                <div className="d-flex gap-2 flex-wrap">
                  <CButton
                    color="info"
                    variant="outline"
                    size="sm"
                    onClick={loadSampleData}
                    disabled={!getCurrentFormat()?.example}
                  >
                    <CIcon icon={cilTask} className="me-1" />
                    Примеры
                  </CButton>
                  <CButton
                    color="secondary"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CIcon icon={cilFile} className="me-1" />
                    Файл
                  </CButton>
                  <CButton
                    color="warning"
                    variant="outline"
                    size="sm"
                    onClick={handleClearData}
                    disabled={!watchedText}
                  >
                    <CIcon icon={cilTrash} className="me-1" />
                    Очистить
                  </CButton>
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* Загрузка данных */}
          <CCol lg={6}>
            <CCard className="mb-4">
              <CCardHeader>
                <h6 className="mb-0 d-flex align-items-center">
                  <CIcon icon={cilDataTransferUp} className="me-2" />
                  Загрузка данных
                </h6>
              </CCardHeader>
              <CCardBody>
                {/* Drag & Drop зона */}
                <div
                  className={`drag-drop-zone mb-3 ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragEvents}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CIcon icon={cilCloudUpload} size="xl" className="text-muted mb-2" />
                  <div className="fw-semibold">Перетащите файл сюда</div>
                  <div className="text-muted small">или нажмите для выбора</div>
                </div>

                {/* Скрытый input для файлов */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.json"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />

                {/* Текстовое поле */}
                <div className="mb-3">
                  <CFormLabel htmlFor="text" className="fw-semibold">
                    Данные для импорта <span className="text-danger">*</span>
                  </CFormLabel>
                  <CFormTextarea
                    id="text"
                    rows={8}
                    placeholder="Вставьте данные здесь..."
                    className="font-monospace"
                    invalid={!!errors.text}
                    {...register('text', {
                      required: 'Введите данные для импорта'
                    })}
                  />
                  {errors.text && (
                    <div className="invalid-feedback d-block">{errors.text.message}</div>
                  )}
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* Предпросмотр данных */}
        {previewData && (
          <CCard className="mb-4">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 d-flex align-items-center">
                  <CIcon icon={cilInfo} className="me-2" />
                  Предпросмотр данных
                </h6>
                <div className="d-flex gap-2">
                  <CBadge color="primary">Всего: {previewData.totalLines}</CBadge>
                  <CBadge color="success">Валидные: ~{previewData.estimatedValid}</CBadge>
                  {previewData.estimatedInvalid > 0 && (
                    <CBadge color="danger">Ошибки: ~{previewData.estimatedInvalid}</CBadge>
                  )}
                </div>
              </div>
            </CCardHeader>
            <CCardBody>
              {previewData.samples.length > 0 && (
                <CTable size="sm" responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: '80px' }}>Строка</CTableHeaderCell>
                      <CTableHeaderCell>Исходные данные</CTableHeaderCell>
                      <CTableHeaderCell>Результат парсинга</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '100px' }}>Статус</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {previewData.samples.map((sample, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell>{sample.line}</CTableDataCell>
                        <CTableDataCell>
                          <code className="small">{sample.raw}</code>
                        </CTableDataCell>
                        <CTableDataCell>
                          {sample.parsed ? (
                            <code className="small text-success">
                              {JSON.stringify(sample.parsed, null, 0)}
                            </code>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {sample.valid ? (
                            <CBadge color="success">
                              <CIcon icon={cilCheckCircle} className="me-1" />
                              OK
                            </CBadge>
                          ) : (
                            <CBadge color="danger">
                              <CIcon icon={cilXCircle} className="me-1" />
                              Ошибка
                            </CBadge>
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

        {/* Ошибки валидации */}
        {validationErrors.length > 0 && (
          <CAlert color="warning" className="mb-4">
            <h6 className="mb-2">
              <CIcon icon={cilWarning} className="me-2" />
              Найдены ошибки в данных
            </h6>
            <div className="small">
              {validationErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="mb-1">
                  <strong>Строка {error.line}:</strong> {error.error}
                  {error.text && <><br /><code>{error.text}</code></>}
                </div>
              ))}
              {validationErrors.length > 5 && (
                <div className="text-muted">
                  ... и еще {validationErrors.length - 5} ошибок
                </div>
              )}
            </div>
          </CAlert>
        )}

        {/* Прогресс */}
        {isLoading && (
          <div className="mb-4">
            <div className="d-flex justify-content-between mb-2">
              <span>Импорт данных...</span>
              <span>{progress}%</span>
            </div>
            <CProgress>
              <CProgressBar value={progress} />
            </CProgress>
          </div>
        )}

        {/* Кнопка импорта */}
        <div className="d-flex justify-content-end">
          <CButton
            type="submit"
            color="primary"
            disabled={isLoading || !previewData || previewData.estimatedValid === 0}
            className="px-4"
          >
            {isLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Импорт...
              </>
            ) : (
              <>
                <CIcon icon={cilCloudUpload} className="me-2" />
                Импортировать {previewData ? `(~${previewData.estimatedValid})` : ''}
              </>
            )}
          </CButton>
        </div>
      </CForm>

      <style jsx>{`
        .drag-drop-zone {
          border: 2px dashed var(--cui-border-color);
          border-radius: 0.75rem;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--cui-body-bg);
        }

        .drag-drop-zone:hover,
        .drag-drop-zone.drag-active {
          border-color: var(--cui-primary);
          background: var(--cui-primary-bg-subtle);
        }

        .font-monospace {
          font-family: var(--cui-font-monospace);
          font-size: 0.875rem;
          line-height: 1.4;
        }
      `}</style>
    </div>
  )
}

export default ImportPanel