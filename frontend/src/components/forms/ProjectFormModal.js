import React from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CRow,
  CCol,
  CSpinner,
} from '@coreui/react'
import { useForm } from 'react-hook-form'
import { useCreateProject, useUpdateProject } from '../../hooks/useProjects'

const ProjectFormModal = ({ visible, onClose, project = null, isEdit = false }) => {
  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
    }
  })

  const onSubmit = async (data) => {
    try {
      // Очищаем пустые значения
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '' && value !== null)
      )

      if (isEdit) {
        await updateMutation.mutateAsync({ id: project.id, data: cleanData })
      } else {
        await createMutation.mutateAsync(cleanData)
      }
      
      reset()
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading

  return (
    <CModal visible={visible} onClose={handleClose}>
      <CModalHeader>
        <CModalTitle>{isEdit ? 'Редактировать проект' : 'Создать проект'}</CModalTitle>
      </CModalHeader>
      
      <CForm onSubmit={handleSubmit(onSubmit)}>
        <CModalBody>
          <CRow>
            {/* Название проекта */}
            <CCol xs={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="name">Название проекта *</CFormLabel>
                <CFormInput
                  id="name"
                  placeholder="Мой проект"
                  invalid={!!errors.name}
                  {...register('name', { 
                    required: 'Название проекта обязательно',
                    minLength: { value: 1, message: 'Минимум 1 символ' },
                    maxLength: { value: 255, message: 'Максимум 255 символов' }
                  })}
                />
                {errors.name && (
                  <div className="invalid-feedback">{errors.name.message}</div>
                )}
                <div className="form-text">
                  Будет автоматически создан транслитерированный ID проекта
                </div>
              </div>
            </CCol>

            {/* Описание */}
            <CCol xs={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="description">Описание</CFormLabel>
                <CFormTextarea
                  id="description"
                  rows={4}
                  placeholder="Описание проекта, его цели и задачи..."
                  invalid={!!errors.description}
                  {...register('description', {
                    maxLength: { value: 1000, message: 'Максимум 1000 символов' }
                  })}
                />
                {errors.description && (
                  <div className="invalid-feedback">{errors.description.message}</div>
                )}
              </div>
            </CCol>

            {/* Информация для редактирования */}
            {isEdit && project && (
              <>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Транслитерированное название</CFormLabel>
                    <CFormInput
                      value={project.transliterateName || ''}
                      disabled
                      readOnly
                    />
                    <div className="form-text">Автоматически генерируется из названия</div>
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Дата создания</CFormLabel>
                    <CFormInput
                      value={project.createdAt ? new Date(project.createdAt).toLocaleDateString('ru-RU') : ''}
                      disabled
                      readOnly
                    />
                  </div>
                </CCol>
              </>
            )}
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={handleClose} disabled={isLoading}>
            Отмена
          </CButton>
          <CButton color="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {isEdit ? 'Сохранение...' : 'Создание...'}
              </>
            ) : (
              isEdit ? 'Сохранить' : 'Создать'
            )}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default ProjectFormModal