// frontend/src/components/forms/ProjectFormModal.js

import React, { useState, useEffect } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormLabel,
  CAlert,
  CSpinner,
  CRow,
  CCol
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave, cilX } from '@coreui/icons'

const ProjectFormModal = ({
  visible,
  project = null,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    transliterateName: '',
    description: ''
  })
  
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const isEdit = Boolean(project)

  // Загрузка данных проекта при редактировании
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        transliterateName: project.transliterateName || '',
        description: project.description || ''
      })
    } else {
      setFormData({
        name: '',
        transliterateName: '',
        description: ''
      })
    }
    setErrors({})
    setTouched({})
  }, [project, visible])

  // Функция транслитерации
  const transliterate = (text) => {
    const map = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ь': '', 'ы': 'y', 'ъ': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      ' ': '_', '-': '_'
    }
    
    return text
      .toLowerCase()
      .split('')
      .map(char => map[char] || char)
      .join('')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  // Валидация
  const validate = (field, value) => {
    const newErrors = { ...errors }

    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Название обязательно'
        } else if (value.trim().length < 2) {
          newErrors.name = 'Название должно содержать минимум 2 символа'
        } else if (value.trim().length > 100) {
          newErrors.name = 'Название не должно превышать 100 символов'
        } else {
          delete newErrors.name
        }
        break

      case 'transliterateName':
        if (!value.trim()) {
          newErrors.transliterateName = 'Транслитерированное название обязательно'
        } else if (!/^[a-z0-9_]+$/.test(value)) {
          newErrors.transliterateName = 'Только латинские буквы, цифры и подчеркивания'
        } else if (value.length < 2) {
          newErrors.transliterateName = 'Минимум 2 символа'
        } else if (value.length > 50) {
          newErrors.transliterateName = 'Максимум 50 символов'
        } else {
          delete newErrors.transliterateName
        }
        break

      case 'description':
        if (value && value.length > 500) {
          newErrors.description = 'Описание не должно превышать 500 символов'
        } else {
          delete newErrors.description
        }
        break

      default:
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Обработка изменений полей
  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Автоматическая генерация транслитерации при вводе названия
      if (field === 'name' && !touched.transliterateName) {
        newData.transliterateName = transliterate(value)
      }
      
      return newData
    })

    // Валидация при изменении
    if (touched[field]) {
      validate(field, value)
    }
  }

  // Обработка потери фокуса
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validate(field, formData[field])
  }

  // Валидация всей формы
  const validateForm = () => {
    const fields = ['name', 'transliterateName', 'description']
    let isValid = true
    
    fields.forEach(field => {
      if (!validate(field, formData[field])) {
        isValid = false
      }
    })
    
    setTouched({
      name: true,
      transliterateName: true,
      description: true
    })
    
    return isValid
  }

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const submitData = {
      name: formData.name.trim(),
      transliterateName: formData.transliterateName.trim(),
      description: formData.description.trim() || null
    }

    try {
      if (isEdit) {
        await onSubmit(project.id, submitData)
      } else {
        await onSubmit(submitData)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  // Обработка закрытия
  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  // Проверка наличия изменений
  const hasChanges = () => {
    if (!project) return Object.values(formData).some(value => value.trim() !== '')
    
    return (
      formData.name !== (project.name || '') ||
      formData.transliterateName !== (project.transliterateName || '') ||
      formData.description !== (project.description || '')
    )
  }

  const isFormValid = Object.keys(errors).length === 0 && 
                     formData.name.trim() && 
                     formData.transliterateName.trim()

  return (
    <CModal
      visible={visible}
      onClose={handleClose}
      size="lg"
      backdrop="static"
      keyboard={!isLoading}
    >
      <CModalHeader>
        <CModalTitle>
          {isEdit ? 'Редактировать проект' : 'Создать новый проект'}
        </CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          <CRow>
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="name">
                  Название проекта <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  invalid={touched.name && !!errors.name}
                  placeholder="Введите название проекта"
                  disabled={isLoading}
                  maxLength={100}
                />
                {touched.name && errors.name && (
                  <div className="invalid-feedback">{errors.name}</div>
                )}
                <div className="form-text">
                  Название проекта для отображения в интерфейсе
                </div>
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="transliterateName">
                  Системное имя <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  id="transliterateName"
                  type="text"
                  value={formData.transliterateName}
                  onChange={(e) => handleChange('transliterateName', e.target.value.toLowerCase())}
                  onBlur={() => handleBlur('transliterateName')}
                  invalid={touched.transliterateName && !!errors.transliterateName}
                  placeholder="project_name"
                  disabled={isLoading}
                  maxLength={50}
                />
                {touched.transliterateName && errors.transliterateName && (
                  <div className="invalid-feedback">{errors.transliterateName}</div>
                )}
                <div className="form-text">
                  Только латинские буквы, цифры и подчеркивания
                </div>
              </div>
            </CCol>
          </CRow>

          <div className="mb-3">
            <CFormLabel htmlFor="description">Описание</CFormLabel>
            <CFormTextarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              invalid={touched.description && !!errors.description}
              placeholder="Описание проекта (необязательно)"
              disabled={isLoading}
              maxLength={500}
            />
            {touched.description && errors.description && (
              <div className="invalid-feedback">{errors.description}</div>
            )}
            <div className="form-text">
              {formData.description.length}/500 символов
            </div>
          </div>

          {/* Предупреждения и подсказки */}
          {isEdit && (
            <CAlert color="info" className="mb-0">
              <strong>Внимание:</strong> Изменение системного имени может повлиять на 
              работу связанных ресурсов и API.
            </CAlert>
          )}

          {!isEdit && (
            <CAlert color="success" className="mb-0">
              <strong>Совет:</strong> Системное имя автоматически генерируется из названия, 
              но вы можете его изменить.
            </CAlert>
          )}
        </CModalBody>

        <CModalFooter>
          <div className="d-flex justify-content-between w-100">
            <div>
              {hasChanges() && (
                <small className="text-warning">
                  * Есть несохраненные изменения
                </small>
              )}
            </div>
            <div>
              <CButton
                color="secondary"
                onClick={handleClose}
                disabled={isLoading}
                className="me-2"
              >
                <CIcon icon={cilX} className="me-1" />
                Отмена
              </CButton>
              <CButton
                color="primary"
                type="submit"
                disabled={!isFormValid || isLoading || !hasChanges()}
              >
                {isLoading ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    {isEdit ? 'Сохранение...' : 'Создание...'}
                  </>
                ) : (
                  <>
                    <CIcon icon={cilSave} className="me-1" />
                    {isEdit ? 'Сохранить' : 'Создать'}
                  </>
                )}
              </CButton>
            </div>
          </div>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default ProjectFormModal