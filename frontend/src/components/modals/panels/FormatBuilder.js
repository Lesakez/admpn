// frontend/src/components/modals/panels/FormatBuilder.js
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CButtonGroup,
  CBadge,
  CFormSelect,
  CFormInput,
  CFormTextarea,
  CFormLabel,
  CRow,
  CCol,
  CCollapse,
  CAlert,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
  CTooltip
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilTrash,
  cilCopy,
  cilMove,
  cilChevronBottom,
  cilChevronTop,
  cilInfo,
  cilWarning,
  cilCheckCircle,
  cilReload,
  cilCode,
  cilEyedropper,
  cilArrowTop,
  cilArrowBottom
} from '@coreui/icons'

const FormatBuilder = ({ 
  config, 
  value = '', 
  separator = ':', 
  onTemplateChange, 
  onSeparatorChange 
}) => {
  const [selectedFields, setSelectedFields] = useState([])
  const [customSeparator, setCustomSeparator] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [showFieldCategories, setShowFieldCategories] = useState(true)

  // Инициализация полей из существующего шаблона
  useEffect(() => {
    if (value) {
      const parsedFields = parseTemplate(value)
      setSelectedFields(parsedFields)
    }
  }, [value])

  // Разбираем текущий шаблон на поля
  const parseTemplate = useCallback((template) => {
    if (!template) return []
    
    const fieldRegex = /{(\w+)}/g
    const matches = []
    let match
    
    while ((match = fieldRegex.exec(template)) !== null) {
      matches.push(match[1])
    }
    
    return matches
  }, [])

  // Строим шаблон из выбранных полей
  const buildTemplate = useCallback((fields, sep) => {
    return fields.map(field => `{${field}}`).join(sep)
  }, [])

  // Группируем поля по категориям
  const fieldsByCategory = useMemo(() => {
    if (!config?.availableFields || !config?.fieldCategories) return {}
    
    const grouped = {}
    
    config.fieldCategories.forEach(category => {
      grouped[category.key] = {
        ...category,
        fields: config.availableFields.filter(field => field.category === category.key)
      }
    })
    
    return grouped
  }, [config])

  // Добавить поле в конструктор
  const addField = useCallback((fieldKey) => {
    const newFields = [...selectedFields, fieldKey]
    setSelectedFields(newFields)
    
    const currentSep = separator === 'custom' ? customSeparator : separator
    const template = buildTemplate(newFields, currentSep)
    onTemplateChange?.(template)
  }, [selectedFields, separator, customSeparator, buildTemplate, onTemplateChange])

  // Дублировать поле
  const duplicateField = useCallback((index) => {
    const fieldToDuplicate = selectedFields[index]
    const newFields = [...selectedFields]
    newFields.splice(index + 1, 0, fieldToDuplicate)
    setSelectedFields(newFields)
    
    const currentSep = separator === 'custom' ? customSeparator : separator
    const template = buildTemplate(newFields, currentSep)
    onTemplateChange?.(template)
  }, [selectedFields, separator, customSeparator, buildTemplate, onTemplateChange])

  // Удалить поле
  const removeField = useCallback((index) => {
    const newFields = selectedFields.filter((_, i) => i !== index)
    setSelectedFields(newFields)
    
    const currentSep = separator === 'custom' ? customSeparator : separator
    const template = buildTemplate(newFields, currentSep)
    onTemplateChange?.(template)
  }, [selectedFields, separator, customSeparator, buildTemplate, onTemplateChange])

  // Переместить поле вверх
  const moveFieldUp = useCallback((index) => {
    if (index === 0) return
    
    const newFields = [...selectedFields]
    const temp = newFields[index]
    newFields[index] = newFields[index - 1]
    newFields[index - 1] = temp
    setSelectedFields(newFields)
    
    const currentSep = separator === 'custom' ? customSeparator : separator
    const template = buildTemplate(newFields, currentSep)
    onTemplateChange?.(template)
  }, [selectedFields, separator, customSeparator, buildTemplate, onTemplateChange])

  // Переместить поле вниз
  const moveFieldDown = useCallback((index) => {
    if (index === selectedFields.length - 1) return
    
    const newFields = [...selectedFields]
    const temp = newFields[index]
    newFields[index] = newFields[index + 1]
    newFields[index + 1] = temp
    setSelectedFields(newFields)
    
    const currentSep = separator === 'custom' ? customSeparator : separator
    const template = buildTemplate(newFields, currentSep)
    onTemplateChange?.(template)
  }, [selectedFields, separator, customSeparator, buildTemplate, onTemplateChange])

  // Обработка смены разделителя
  const handleSeparatorChange = useCallback((newSeparator) => {
    const currentSep = newSeparator === 'custom' ? customSeparator : newSeparator
    const template = buildTemplate(selectedFields, currentSep)
    onSeparatorChange?.(newSeparator)
    onTemplateChange?.(template)
  }, [selectedFields, customSeparator, buildTemplate, onSeparatorChange, onTemplateChange])

  // Обработка смены кастомного разделителя
  const handleCustomSeparatorChange = useCallback((newCustomSeparator) => {
    setCustomSeparator(newCustomSeparator)
    
    if (separator === 'custom') {
      const template = buildTemplate(selectedFields, newCustomSeparator)
      onTemplateChange?.(template)
    }
  }, [selectedFields, separator, buildTemplate, onTemplateChange])

  // Очистить конструктор
  const clearFields = useCallback(() => {
    setSelectedFields([])
    onTemplateChange?.('')
  }, [onTemplateChange])

  // Генерация превью
  const previewTemplate = useMemo(() => {
    if (!selectedFields.length) return 'Выберите поля для создания шаблона'
    
    const currentSep = separator === 'custom' ? customSeparator : separator
    return buildTemplate(selectedFields, currentSep)
  }, [selectedFields, separator, customSeparator, buildTemplate])

  // Получить информацию о поле
  const getFieldInfo = useCallback((fieldKey) => {
    if (!config?.availableFields) return null
    return config.availableFields.find(field => field.key === fieldKey)
  }, [config])

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <CIcon icon={cilCode} className="me-2" />
            Конструктор формата
          </h6>
          <CButtonGroup size="sm">
            <CButton
              color="info"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <CIcon icon={cilEyedropper} className="me-1" />
              Превью
            </CButton>
            <CButton
              color="warning"
              variant="outline"
              onClick={clearFields}
              disabled={!selectedFields.length}
            >
              <CIcon icon={cilReload} className="me-1" />
              Очистить
            </CButton>
          </CButtonGroup>
        </div>
      </CCardHeader>
      
      <CCardBody>
        {/* Настройки разделителя */}
        <CRow className="mb-3">
          <CCol md={6}>
            <CFormLabel>Разделитель полей</CFormLabel>
            <CFormSelect
              value={separator}
              onChange={(e) => handleSeparatorChange(e.target.value)}
            >
              <option value=":">Двоеточие (:)</option>
              <option value="|">Вертикальная черта (|)</option>
              <option value="-">Дефис (-)</option>
              <option value="_">Подчеркивание (_)</option>
              <option value=" ">Пробел ( )</option>
              <option value="">Без разделителя</option>
              <option value="custom">Пользовательский</option>
            </CFormSelect>
          </CCol>
          
          {separator === 'custom' && (
            <CCol md={6}>
              <CFormLabel>Пользовательский разделитель</CFormLabel>
              <CFormInput
                value={customSeparator}
                onChange={(e) => handleCustomSeparatorChange(e.target.value)}
                placeholder="Введите разделитель"
              />
            </CCol>
          )}
        </CRow>

        {/* Превью шаблона */}
        <CCollapse visible={showPreview}>
          <CAlert color="info" className="mb-3">
            <strong>Превью шаблона:</strong>
            <div className="mt-2">
              <code>{previewTemplate}</code>
            </div>
          </CAlert>
        </CCollapse>

        <CRow>
          {/* Доступные поля */}
          <CCol md={6}>
            <h6 className="mb-3">
              <CIcon icon={cilPlus} className="me-2" />
              Доступные поля
            </h6>
            
            <div className="available-fields" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {Object.entries(fieldsByCategory).map(([categoryKey, category]) => (
                <div key={categoryKey} className="mb-3">
                  <h6 className="text-muted mb-2">
                    {category.name}
                    <CBadge color="secondary" className="ms-2">
                      {category.fields?.length || 0}
                    </CBadge>
                  </h6>
                  
                  <div className="d-flex flex-wrap gap-2">
                    {category.fields?.map((field) => (
                      <CTooltip
                        key={field.key}
                        content={field.description || field.name}
                        placement="top"
                      >
                        <CButton
                          size="sm"
                          color="primary"
                          variant="outline"
                          onClick={() => addField(field.key)}
                          className="text-nowrap"
                        >
                          <CIcon icon={cilPlus} size="sm" className="me-1" />
                          {field.name}
                        </CButton>
                      </CTooltip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CCol>

          {/* Выбранные поля */}
          <CCol md={6}>
            <h6 className="mb-3">
              <CIcon icon={cilMove} className="me-2" />
              Выбранные поля
              {selectedFields.length > 0 && (
                <CBadge color="success" className="ms-2">
                  {selectedFields.length}
                </CBadge>
              )}
            </h6>
            
            <div className="selected-fields" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {selectedFields.length === 0 ? (
                <CAlert color="light" className="text-center">
                  <CIcon icon={cilInfo} className="me-2" />
                  Поля не выбраны
                  <br />
                  <small className="text-muted">
                    Добавьте поля из левой панели
                  </small>
                </CAlert>
              ) : (
                selectedFields.map((fieldKey, index) => {
                  const fieldInfo = getFieldInfo(fieldKey)
                  return (
                    <div key={`${fieldKey}-${index}`} className="selected-field-item mb-2">
                      <div className="d-flex align-items-center bg-light p-2 rounded">
                        <div className="flex-grow-1">
                          <strong>{fieldInfo?.name || fieldKey}</strong>
                          {fieldInfo?.description && (
                            <small className="text-muted d-block">
                              {fieldInfo.description}
                            </small>
                          )}
                        </div>
                        
                        <CButtonGroup size="sm">
                          <CTooltip content="Переместить вверх">
                            <CButton
                              color="secondary"
                              variant="outline"
                              onClick={() => moveFieldUp(index)}
                              disabled={index === 0}
                            >
                              <CIcon icon={cilArrowTop} size="sm" />
                            </CButton>
                          </CTooltip>
                          
                          <CTooltip content="Переместить вниз">
                            <CButton
                              color="secondary"
                              variant="outline"
                              onClick={() => moveFieldDown(index)}
                              disabled={index === selectedFields.length - 1}
                            >
                              <CIcon icon={cilArrowBottom} size="sm" />
                            </CButton>
                          </CTooltip>
                          
                          <CTooltip content="Дублировать">
                            <CButton
                              color="info"
                              variant="outline"
                              onClick={() => duplicateField(index)}
                            >
                              <CIcon icon={cilCopy} size="sm" />
                            </CButton>
                          </CTooltip>
                          
                          <CTooltip content="Удалить">
                            <CButton
                              color="danger"
                              variant="outline"
                              onClick={() => removeField(index)}
                            >
                              <CIcon icon={cilTrash} size="sm" />
                            </CButton>
                          </CTooltip>
                        </CButtonGroup>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CCol>
        </CRow>

        {/* Дополнительная информация */}
        {selectedFields.length > 0 && (
          <CRow className="mt-3">
            <CCol>
              <CAlert color="success" className="mb-0">
                <CIcon icon={cilCheckCircle} className="me-2" />
                <strong>Шаблон готов!</strong>
                <br />
                <small className="text-muted">
                  Выбрано полей: {selectedFields.length} | 
                  Результат: <code>{previewTemplate}</code>
                </small>
              </CAlert>
            </CCol>
          </CRow>
        )}
      </CCardBody>
    </CCard>
  )
}

export default FormatBuilder