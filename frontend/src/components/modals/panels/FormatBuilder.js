// frontend/src/components/modals/panels/FormatBuilder.js
import React, { useState, useCallback, useMemo } from 'react'
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
  cilEyedropper
} from '@coreui/icons'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

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

  // Перетаскивание полей
  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return

    const newFields = Array.from(selectedFields)
    const [reorderedField] = newFields.splice(result.source.index, 1)
    newFields.splice(result.destination.index, 0, reorderedField)
    
    setSelectedFields(newFields)
    
    const currentSep = separator === 'custom' ? customSeparator : separator
    const template = buildTemplate(newFields, currentSep)
    onTemplateChange?.(template)
  }, [selectedFields, separator, customSeparator, buildTemplate, onTemplateChange])

  // Применить быстрый шаблон
  const applyQuickTemplate = useCallback((template) => {
    const fields = parseTemplate(template)
    setSelectedFields(fields)
    onTemplateChange?.(template)
  }, [parseTemplate, onTemplateChange])

  // Изменение разделителя
  const handleSeparatorChange = useCallback((newSep) => {
    onSeparatorChange?.(newSep)
    
    const currentSep = newSep === 'custom' ? customSeparator : newSep
    const template = buildTemplate(selectedFields, currentSep)
    onTemplateChange?.(template)
  }, [selectedFields, customSeparator, buildTemplate, onTemplateChange, onSeparatorChange])

  // Изменение кастомного разделителя
  const handleCustomSeparatorChange = useCallback((newCustomSep) => {
    setCustomSeparator(newCustomSep)
    
    if (separator === 'custom') {
      const template = buildTemplate(selectedFields, newCustomSep)
      onTemplateChange?.(template)
    }
  }, [selectedFields, separator, buildTemplate, onTemplateChange])

  // Очистить все поля
  const clearAll = useCallback(() => {
    setSelectedFields([])
    onTemplateChange?.('')
  }, [onTemplateChange])

  // Получить информацию о поле
  const getFieldInfo = useCallback((fieldKey) => {
    return config?.availableFields?.find(f => f.key === fieldKey)
  }, [config])

  // Пример данных для превью
  const previewData = {
    id: '12345',
    login: 'example_user',
    password: 'password123',
    email: 'user@example.com',
    emailPassword: 'emailpass456',
    twoFA: 'JBSWY3DPEHPK3PXP',
    status: 'active',
    userAgent: 'Mozilla/5.0...',
    createdAt: '2024-01-15T10:30:00Z'
  }

  // Генерация превью
  const generatePreview = useCallback(() => {
    if (!value || selectedFields.length === 0) return 'Выберите поля для превью...'
    
    const currentSep = separator === 'custom' ? customSeparator : separator
    return selectedFields.map(fieldKey => previewData[fieldKey] || `{${fieldKey}}`).join(currentSep)
  }, [value, selectedFields, separator, customSeparator])

  return (
    <div className="format-builder">
      {/* Быстрые шаблоны */}
      {config?.quickTemplates && (
        <CCard className="mb-3">
          <CCardHeader className="py-2">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Быстрые шаблоны</h6>
              <CBadge color="info" className="fs-7">
                {config.quickTemplates.length}
              </CBadge>
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-2">
              {config.quickTemplates.map((template, index) => (
                <CCol key={index} xs={12} md={6}>
                  <CButton
                    color="light"
                    variant="outline"
                    size="sm"
                    className="w-100 text-start"
                    onClick={() => applyQuickTemplate(template.template)}
                  >
                    <div>
                      <strong>{template.label}</strong>
                      <br />
                      <small className="text-muted">{template.description}</small>
                      <br />
                      <code className="small">{template.template}</code>
                    </div>
                  </CButton>
                </CCol>
              ))}
            </CRow>
          </CCardBody>
        </CCard>
      )}

      {/* Разделитель */}
      <CCard className="mb-3">
        <CCardHeader className="py-2">
          <h6 className="mb-0">Разделитель полей</h6>
        </CCardHeader>
        <CCardBody>
          <CRow className="align-items-end">
            <CCol xs={8}>
              <CFormSelect
                value={separator}
                onChange={(e) => handleSeparatorChange(e.target.value)}
              >
                {config?.separators?.map(sep => (
                  <option key={sep.value} value={sep.value}>
                    {sep.label}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            {separator === 'custom' && (
              <CCol xs={4}>
                <CFormInput
                  placeholder="Символ"
                  value={customSeparator}
                  onChange={(e) => handleCustomSeparatorChange(e.target.value)}
                  maxLength={3}
                />
              </CCol>
            )}
          </CRow>
        </CCardBody>
      </CCard>

      {/* Конструктор полей */}
      <CCard className="mb-3">
        <CCardHeader className="py-2">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              <CIcon icon={cilCode} className="me-2" />
              Конструктор формата
            </h6>
            <div className="d-flex gap-2">
              {selectedFields.length > 0 && (
                <CButton
                  color="danger"
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                >
                  <CIcon icon={cilTrash} size="sm" />
                </CButton>
              )}
              <CButton
                color="light"
                variant="ghost"
                size="sm"
                onClick={() => setShowFieldCategories(!showFieldCategories)}
              >
                <CIcon icon={showFieldCategories ? cilChevronTop : cilChevronBottom} />
              </CButton>
            </div>
          </div>
        </CCardHeader>
        <CCardBody>
          {/* Выбранные поля */}
          {selectedFields.length > 0 && (
            <div className="mb-3">
              <CFormLabel className="small fw-semibold text-muted">
                Выбранные поля ({selectedFields.length}):
              </CFormLabel>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="selected-fields">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="selected-fields-list"
                    >
                      {selectedFields.map((fieldKey, index) => {
                        const fieldInfo = getFieldInfo(fieldKey)
                        return (
                          <Draggable
                            key={`${fieldKey}-${index}`}
                            draggableId={`${fieldKey}-${index}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`selected-field-item ${snapshot.isDragging ? 'dragging' : ''}`}
                                style={{
                                  ...provided.draggableProps.style,
                                  marginBottom: '8px',
                                  padding: '8px 12px',
                                  backgroundColor: 'var(--cui-tertiary-bg)',
                                  border: '1px solid var(--cui-border-color)',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  style={{ cursor: 'grab', color: 'var(--cui-secondary-color)' }}
                                >
                                  <CIcon icon={cilMove} size="sm" />
                                </div>
                                
                                <CBadge 
                                  color={fieldInfo?.sensitive ? 'warning' : 'primary'}
                                  className="me-2"
                                >
                                  {fieldInfo?.label || fieldKey}
                                </CBadge>
                                
                                <div className="ms-auto d-flex gap-1">
                                  <CButton
                                    color="info"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => duplicateField(index)}
                                  >
                                    <CIcon icon={cilCopy} size="sm" />
                                  </CButton>
                                  <CButton
                                    color="danger"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeField(index)}
                                  >
                                    <CIcon icon={cilTrash} size="sm" />
                                  </CButton>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}

          {/* Категории полей */}
          <CCollapse visible={showFieldCategories}>
            <div className="field-categories">
              {Object.entries(fieldsByCategory).map(([categoryKey, category]) => (
                <div key={categoryKey} className="mb-3">
                  <h6 className="text-muted small fw-semibold mb-2">
                    <CIcon icon={category.icon} className="me-2" />
                    {category.label}
                    <CBadge color={category.color} variant="ghost" className="ms-2">
                      {category.fields.length}
                    </CBadge>
                  </h6>
                  <div className="d-flex flex-wrap gap-1">
                    {category.fields.map(field => (
                      <CButton
                        key={field.key}
                        color={field.sensitive ? 'warning' : category.color}
                        variant="outline"
                        size="sm"
                        onClick={() => addField(field.key)}
                        className="position-relative"
                      >
                        {field.label}
                        {field.sensitive && (
                          <CTooltip content="Чувствительные данные">
                            <CIcon 
                              icon={cilWarning} 
                              size="sm" 
                              className="position-absolute top-0 end-0 text-warning"
                              style={{ fontSize: '10px', marginTop: '-2px', marginRight: '-2px' }}
                            />
                          </CTooltip>
                        )}
                      </CButton>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CCollapse>
        </CCardBody>
      </CCard>

      {/* Превью и результат */}
      <CCard className="mb-3">
        <CCardHeader className="py-2">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              <CIcon icon={cilEyedropper} className="me-2" />
              Превью формата
            </h6>
            <CButton
              color="light"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <CIcon icon={showPreview ? cilChevronTop : cilChevronBottom} />
            </CButton>
          </div>
        </CCardHeader>
        <CCollapse visible={showPreview}>
          <CCardBody>
            {/* Шаблон */}
            <div className="mb-3">
              <CFormLabel className="small fw-semibold">Шаблон:</CFormLabel>
              <CFormTextarea
                rows={2}
                value={value}
                onChange={(e) => onTemplateChange?.(e.target.value)}
                placeholder="Создайте шаблон выше или введите вручную: {login}:{password}:{email}"
                className="font-monospace"
              />
              <small className="text-muted">
                Используйте {'{field_name}'} для вставки значений полей
              </small>
            </div>

            {/* Превью данных */}
            <div className="mb-3">
              <CFormLabel className="small fw-semibold">Пример результата:</CFormLabel>
              <div 
                className="p-2 rounded"
                style={{ 
                  backgroundColor: 'var(--cui-tertiary-bg)', 
                  border: '1px solid var(--cui-border-color)',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              >
                {generatePreview()}
              </div>
            </div>

            {/* Статистика */}
            {selectedFields.length > 0 && (
              <CAlert color="info" className="mb-0">
                <div className="d-flex justify-content-between small">
                  <span>Полей: {selectedFields.length}</span>
                  <span>Чувствительных: {selectedFields.filter(f => getFieldInfo(f)?.sensitive).length}</span>
                  <span>Разделитель: "{separator === 'custom' ? customSeparator : separator}"</span>
                </div>
              </CAlert>
            )}
          </CCardBody>
        </CCollapse>
      </CCard>
    </div>
  )
}

export default FormatBuilder