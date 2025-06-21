// frontend/src/components/modals/panels/ExportPanel.js - Enhanced with FormatBuilder
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormSelect,
  CFormCheck,
  CFormInput,
  CAlert,
  CSpinner,
  CBadge,
  CRow,
  CCol,
  CCollapse,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload,
  cilSettings,
  cilFilter,
  cilChevronBottom,
  cilChevronTop,
  cilCheckCircle,
  cilFile,
  cilCode,
  cilWarning
} from '@coreui/icons'
import { accountsService } from '../../../services/accountsService'
import { useEntityStatuses } from '../../../hooks/useStatuses'
import FormatBuilder from './FormatBuilder'
import toast from 'react-hot-toast'

const ExportPanel = ({ config, type = 'accounts', onSuccess }) => {
  const [format, setFormat] = useState(config?.formats?.[0]?.value || 'json')
  const [filters, setFilters] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customTemplate, setCustomTemplate] = useState('')
  const [customSeparator, setCustomSeparator] = useState(':')
  const [estimatedCount, setEstimatedCount] = useState(null)
  const [availableFields, setAvailableFields] = useState([])

  // Загружаем статусы для аккаунтов
  const { data: statusesResponse, isLoading: statusesLoading } = useEntityStatuses('account')

  // Загружаем доступные поля
  useEffect(() => {
    const loadFields = async () => {
      try {
        const response = await accountsService.getFields()
        setAvailableFields(response.data.fields || {})
      } catch (error) {
        console.error('Error loading fields:', error)
      }
    }

    loadFields()
  }, [])

  // Оценка количества записей
  useEffect(() => {
    const estimateCount = async () => {
      try {
        const response = await accountsService.getAll({
          ...filters,
          page: 1,
          limit: 1
        })
        setEstimatedCount(response.data.pagination?.total || 0)
      } catch (error) {
        setEstimatedCount(null)
      }
    }

    const timeoutId = setTimeout(estimateCount, 500)
    return () => clearTimeout(timeoutId)
  }, [filters])

  // Преобразуем статусы в опции для select
  const statusOptions = useMemo(() => {
    if (!statusesResponse) return []
    
    const statuses = statusesResponse.statuses || {}
    const descriptions = statusesResponse.descriptions || {}
    
    return Object.entries(statuses).map(([key, value]) => ({
      value,
      label: descriptions[value] || value,
      key
    }))
  }, [statusesResponse])

  // Текущий формат
  const currentFormat = config?.formats?.find(f => f.value === format)

  const handleExport = useCallback(async () => {
    setIsLoading(true)
    try {
      if (!currentFormat) {
        throw new Error('Формат не выбран')
      }

      const params = {
        ...currentFormat.params,
        filters,
        template: currentFormat.isCustom ? customTemplate : currentFormat.template,
        separator: customSeparator
      }

      let response
      const method = currentFormat.method

      if (method === 'exportJSON') {
        response = await accountsService.exportJSON(params)
      } else if (method === 'exportCSV') {
        response = await accountsService.exportCSV(params)
      } else if (method === 'exportTXT') {
        response = await accountsService.exportTXT(params)
      } else if (method === 'exportCustom') {
        response = await accountsService.exportCustom(params)
      } else {
        throw new Error('Неизвестный метод экспорта')
      }

      // Скачиваем файл
      const blob = new Blob([response.data], { type: currentFormat.mimeType })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = currentFormat.filename?.replace('.', `_${timestamp}.`) || 
                     `${type}_export_${timestamp}.${currentFormat.extension}`
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success(`Файл ${filename} успешно загружен`)
      
      onSuccess?.({
        format: currentFormat.label,
        filename,
        recordsCount: estimatedCount,
        template: params.template
      }, 'export', type)

    } catch (error) {
      console.error('Export error:', error)
      toast.error(error.message || 'Ошибка при экспорте')
    } finally {
      setIsLoading(false)
    }
  }, [format, filters, customTemplate, customSeparator, currentFormat, estimatedCount, onSuccess, type])

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  return (
    <div className="export-panel">
      {/* Описание */}
      {config?.description && (
        <CAlert color="info" className="mb-3">
          <CIcon icon={cilFile} className="me-2" />
          {config.description}
        </CAlert>
      )}

      {/* Выбор формата */}
      <CCard className="mb-3">
        <CCardHeader className="py-2">
          <h6 className="mb-0">Формат экспорта</h6>
        </CCardHeader>
        <CCardBody>
          <CFormSelect
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="mb-2"
          >
            {config?.formats?.map(fmt => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label}
              </option>
            ))}
          </CFormSelect>
          {currentFormat && (
            <small className="text-muted">
              <CIcon icon={cilFile} className="me-1" />
              {currentFormat.description}
            </small>
          )}
        </CCardBody>
      </CCard>

      {/* Конструктор формата для кастомного TXT */}
      {currentFormat?.isCustom && (
        <FormatBuilder
          config={config}
          value={customTemplate}
          separator={customSeparator}
          onTemplateChange={setCustomTemplate}
          onSeparatorChange={setCustomSeparator}
        />
      )}

      {/* Фильтры */}
      <CCard className="mb-3">
        <CCardHeader className="py-2 d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <CIcon icon={cilFilter} className="me-2" />
            Фильтры
          </h6>
          <div className="d-flex gap-2">
            {Object.keys(filters).length > 0 && (
              <CBadge color="primary">
                {Object.keys(filters).length}
              </CBadge>
            )}
            <CButton
              color="light"
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <CIcon icon={showFilters ? cilChevronTop : cilChevronBottom} />
            </CButton>
          </div>
        </CCardHeader>
        <CCollapse visible={showFilters}>
          <CCardBody>
            <CRow>
              {config?.filters?.map(filter => (
                <CCol key={filter.key} xs={12} md={6} className="mb-3">
                  <label className="form-label">{filter.label}</label>
                  {filter.type === 'select' && filter.dynamic && filter.entity === 'account' ? (
                    // Динамическая загрузка статусов
                    <CFormSelect
                      value={filters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      disabled={statusesLoading}
                    >
                      <option value="">{filter.placeholder || 'Все'}</option>
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </CFormSelect>
                  ) : filter.type === 'select' ? (
                    // Статичные опции
                    <CFormSelect
                      value={filters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    >
                      {filter.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </CFormSelect>
                  ) : filter.type === 'checkbox' ? (
                    <CFormCheck
                      checked={!!filters[filter.key]}
                      onChange={(e) => handleFilterChange(filter.key, e.target.checked)}
                      label={filter.description}
                    />
                  ) : filter.type === 'date' ? (
                    <CFormInput
                      type="date"
                      value={filters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    />
                  ) : (
                    <CFormInput
                      type={filter.type}
                      placeholder={filter.placeholder}
                      value={filters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    />
                  )}
                  {filter.description && (
                    <small className="text-muted">{filter.description}</small>
                  )}
                </CCol>
              ))}
            </CRow>
            {Object.keys(filters).length > 0 && (
              <div className="d-flex justify-content-end">
                <CButton
                  color="light"
                  size="sm"
                  onClick={clearFilters}
                >
                  Очистить фильтры
                </CButton>
              </div>
            )}
          </CCardBody>
        </CCollapse>
      </CCard>

      {/* Оценка записей */}
      {estimatedCount !== null && (
        <CAlert color={estimatedCount > 10000 ? 'warning' : 'info'} className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Будет экспортировано: {estimatedCount.toLocaleString()} записей</strong>
              {estimatedCount > 10000 && (
                <div className="small">
                  <CIcon icon={cilWarning} className="me-1" />
                  Большое количество записей может замедлить экспорт
                </div>
              )}
            </div>
          </div>
        </CAlert>
      )}

      {/* Предупреждение о чувствительных данных */}
      {(currentFormat?.isCustom && customTemplate.includes('password')) || 
       (currentFormat?.template && currentFormat.template.includes('password')) && (
        <CAlert color="warning" className="mb-3">
          <CIcon icon={cilWarning} className="me-2" />
          <strong>Внимание!</strong> Ваш формат содержит пароли и другие чувствительные данные.
        </CAlert>
      )}

      {/* Кнопка экспорта */}
      <div className="d-grid">
        <CButton
          color="success"
          size="lg"
          onClick={handleExport}
          disabled={
            isLoading || 
            (currentFormat?.isCustom && !customTemplate.trim())
          }
        >
          {isLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Экспортирую данные...
            </>
          ) : (
            <>
              <CIcon icon={cilCloudDownload} className="me-2" />
              Экспортировать {currentFormat?.label}
            </>
          )}
        </CButton>
      </div>

      {/* Информация о формате */}
      {currentFormat && (
        <CAlert color="info" className="mt-3">
          <div className="d-flex align-items-center">
            <CIcon icon={cilCheckCircle} className="me-2" />
            <div>
              <strong>Экспорт в формате {currentFormat.label}</strong>
              <br />
              <small>{currentFormat.description}</small>
              {currentFormat.isCustom && customTemplate && (
                <>
                  <br />
                  <code className="small">{customTemplate}</code>
                </>
              )}
            </div>
          </div>
        </CAlert>
      )}
    </div>
  )
}

export default ExportPanel