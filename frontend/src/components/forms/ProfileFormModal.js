// frontend/src/components/forms/ProfileFormModal.js
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
  CFormSelect,
  CFormTextarea,
  CRow,
  CCol,
  CSpinner,
  CInputGroup,
  CInputGroupText,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilUser,
  cilSettings,
  cilTask,
  cilPeople,
  cilFolder,
  cilDevices,
} from '@coreui/icons'
import { useForm } from 'react-hook-form'
import { useEntityCRUD } from '../../hooks/useEntityCRUD'
import { profilesService } from '../../services/profilesService'
import PropTypes from 'prop-types'

/**
 * ИСПРАВЛЕНИЯ В КОМПОНЕНТЕ:
 * 1. Завершена обрезанная реализация
 * 2. Добавлены PropTypes для валидации props
 * 3. Улучшена обработка ошибок
 * 4. Добавлена правильная валидация полей
 * 5. Исправлены проблемы с формой
 */

const ProfileFormModal = ({ visible, onClose, profile = null, isEdit = false }) => {
  // Используем универсальный хук для CRUD операций
  const { 
    createMutation, 
    updateMutation,
    isLoading 
  } = useEntityCRUD('profiles', profilesService, {
    successMessages: {
      create: 'Профиль создан успешно',
      update: 'Профиль обновлен успешно'
    }
  })
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      profileName: profile?.profileName || '',
      folderName: profile?.folderName || '',
      workspaceId: profile?.workspaceId || '',
      workspaceName: profile?.workspaceName || '',
      userId: profile?.userId || '',
      status: profile?.status || 'active',
      notes: profile?.notes || ''
    }
  })

  const watchedStatus = watch('status')

  const onSubmit = async (data) => {
    try {
      // Очищаем пустые значения
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '' && value !== null)
      )

      if (isEdit) {
        await updateMutation.mutateAsync({ id: profile.id, data: cleanData })
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

  // Предопределенные статусы профилей
  const profileStatuses = [
    { value: 'active', label: 'Активный', color: 'success' },
    { value: 'inactive', label: 'Неактивный', color: 'secondary' },
    { value: 'blocked', label: 'Заблокирован', color: 'danger' },
    { value: 'error', label: 'Ошибка', color: 'warning' },
    { value: 'maintenance', label: 'На обслуживании', color: 'info' }
  ]

  const getCurrentStatusInfo = () => {
    return profileStatuses.find(s => s.value === watchedStatus)
  }

  return (
    <CModal 
      visible={visible} 
      onClose={handleClose} 
      size="lg"
      backdrop="static" // Предотвращаем закрытие по клику вне модального окна
    >
      <CModalHeader>
        <CModalTitle>
          <CIcon icon={cilUser} className="me-2" />
          {isEdit ? 'Редактировать профиль' : 'Создать профиль'}
        </CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit(onSubmit)}>
        <CModalBody>
          <CRow>
            {/* Название профиля */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="profileName">
                  Название профиля <span className="text-danger">*</span>
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText>
                    <CIcon icon={cilUser} />
                  </CInputGroupText>
                  <CFormInput
                    id="profileName"
                    placeholder="Profile_001"
                    invalid={!!errors.profileName}
                    {...register('profileName', { 
                      required: 'Название профиля обязательно',
                      minLength: { value: 1, message: 'Минимум 1 символ' },
                      maxLength: { value: 255, message: 'Максимум 255 символов' }
                    })}
                  />
                </CInputGroup>
                {errors.profileName && (
                  <div className="invalid-feedback d-block">{errors.profileName.message}</div>
                )}
              </div>
            </CCol>

            {/* Папка */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="folderName">
                  Название папки <span className="text-danger">*</span>
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText>
                    <CIcon icon={cilFolder} />
                  </CInputGroupText>
                  <CFormInput
                    id="folderName"
                    placeholder="folder_001"
                    invalid={!!errors.folderName}
                    {...register('folderName', { 
                      required: 'Название папки обязательно',
                      minLength: { value: 1, message: 'Минимум 1 символ' },
                      maxLength: { value: 255, message: 'Максимум 255 символов' }
                    })}
                  />
                </CInputGroup>
                {errors.folderName && (
                  <div className="invalid-feedback d-block">{errors.folderName.message}</div>
                )}
              </div>
            </CCol>

            {/* Workspace ID */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="workspaceId">
                  Workspace ID <span className="text-danger">*</span>
                </CFormLabel>
                <CInputGroup>
                  <CInputGroupText>
                    <CIcon icon={cilDevices} />
                  </CInputGroupText>
                  <CFormInput
                    id="workspaceId"
                    placeholder="workspace_001"
                    invalid={!!errors.workspaceId}
                    {...register('workspaceId', { 
                      required: 'Workspace ID обязателен',
                      minLength: { value: 1, message: 'Минимум 1 символ' },
                      maxLength: { value: 255, message: 'Максимум 255 символов' }
                    })}
                  />
                </CInputGroup>
                {errors.workspaceId && (
                  <div className="invalid-feedback d-block">{errors.workspaceId.message}</div>
                )}
              </div>
            </CCol>

            {/* Workspace Name */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="workspaceName">Workspace Name</CFormLabel>
                <CInputGroup>
                  <CInputGroupText>
                    <CIcon icon={cilPeople} />
                  </CInputGroupText>
                  <CFormInput
                    id="workspaceName"
                    placeholder="Workspace Name"
                    invalid={!!errors.workspaceName}
                    {...register('workspaceName', {
                      maxLength: { value: 255, message: 'Максимум 255 символов' }
                    })}
                  />
                </CInputGroup>
                {errors.workspaceName && (
                  <div className="invalid-feedback d-block">{errors.workspaceName.message}</div>
                )}
              </div>
            </CCol>

            {/* User ID */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="userId">User ID</CFormLabel>
                <CInputGroup>
                  <CInputGroupText>
                    <CIcon icon={cilSettings} />
                  </CInputGroupText>
                  <CFormInput
                    id="userId"
                    placeholder="user_001"
                    invalid={!!errors.userId}
                    {...register('userId', {
                      maxLength: { value: 255, message: 'Максимум 255 символов' }
                    })}
                  />
                </CInputGroup>
                {errors.userId && (
                  <div className="invalid-feedback d-block">{errors.userId.message}</div>
                )}
              </div>
            </CCol>

            {/* Статус */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="status">
                  Статус <span className="text-danger">*</span>
                </CFormLabel>
                <CFormSelect
                  id="status"
                  invalid={!!errors.status}
                  {...register('status', { 
                    required: 'Статус обязателен' 
                  })}
                >
                  <option value="">Выберите статус</option>
                  {profileStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </CFormSelect>
                {errors.status && (
                  <div className="invalid-feedback d-block">{errors.status.message}</div>
                )}
              </div>
            </CCol>

            {/* Заметки */}
            <CCol md={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="notes">Заметки</CFormLabel>
                <CFormTextarea
                  id="notes"
                  rows={3}
                  placeholder="Дополнительная информация о профиле..."
                  invalid={!!errors.notes}
                  {...register('notes', {
                    maxLength: { value: 1000, message: 'Максимум 1000 символов' }
                  })}
                />
                {errors.notes && (
                  <div className="invalid-feedback d-block">{errors.notes.message}</div>
                )}
              </div>
            </CCol>
          </CRow>

          {/* Информация о статусе */}
          {watchedStatus && (
            <CAlert 
              color={getCurrentStatusInfo()?.color || 'info'} 
              className="d-flex align-items-center"
            >
              <CIcon icon={cilTask} className="me-2" />
              <div>
                <strong>
                  Статус: {getCurrentStatusInfo()?.label || watchedStatus}
                  <CBadge 
                    color={getCurrentStatusInfo()?.color || 'secondary'} 
                    className="ms-2"
                  >
                    {watchedStatus}
                  </CBadge>
                </strong>
                <div className="small mt-1">
                  {watchedStatus === 'active' && 'Профиль готов к использованию'}
                  {watchedStatus === 'inactive' && 'Профиль временно отключен'}
                  {watchedStatus === 'blocked' && 'Профиль заблокирован'}
                  {watchedStatus === 'error' && 'Профиль содержит ошибки'}
                  {watchedStatus === 'maintenance' && 'Профиль на техническом обслуживании'}
                </div>
              </div>
            </CAlert>
          )}

          {/* Информация о редактировании */}
          {isEdit && profile && (
            <CCard className="mt-3">
              <CCardHeader>
                <small className="text-muted">
                  <CIcon icon={cilUser} className="me-1" />
                  Информация о профиле
                </small>
              </CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol sm={6}>
                    <small className="text-muted">ID профиля:</small>
                    <div className="fw-semibold">{profile.id}</div>
                  </CCol>
                  <CCol sm={6}>
                    <small className="text-muted">Создан:</small>
                    <div className="fw-semibold">
                      {profile.createdAt ? 
                        new Date(profile.createdAt).toLocaleString('ru-RU') : 
                        'Неизвестно'
                      }
                    </div>
                  </CCol>
                  {profile.updatedAt && (
                    <CCol sm={6}>
                      <small className="text-muted">Обновлен:</small>
                      <div className="fw-semibold">
                        {new Date(profile.updatedAt).toLocaleString('ru-RU')}
                      </div>
                    </CCol>
                  )}
                  {profile.lastActivity && (
                    <CCol sm={6}>
                      <small className="text-muted">Последняя активность:</small>
                      <div className="fw-semibold">
                        {new Date(profile.lastActivity).toLocaleString('ru-RU')}
                      </div>
                    </CCol>
                  )}
                </CRow>
              </CCardBody>
            </CCard>
          )}

          {/* Предупреждения валидации */}
          {Object.keys(errors).length > 0 && (
            <CAlert color="danger" className="mt-3">
              <strong>Пожалуйста, исправьте следующие ошибки:</strong>
              <ul className="mb-0 mt-2">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{error.message}</li>
                ))}
              </ul>
            </CAlert>
          )}
        </CModalBody>

        <CModalFooter className="d-flex justify-content-between">
          <div>
            {isEdit && (
              <small className="text-muted">
                Последнее изменение: {profile?.updatedAt ? 
                  new Date(profile.updatedAt).toLocaleString('ru-RU') : 
                  'неизвестно'
                }
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
              Отмена
            </CButton>
            <CButton 
              color="primary" 
              type="submit" 
              disabled={isLoading || Object.keys(errors).length > 0}
            >
              {isLoading && <CSpinner component="span" size="sm" className="me-2" />}
              {isEdit ? 'Обновить профиль' : 'Создать профиль'}
            </CButton>
          </div>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

// ИСПРАВЛЕНИЕ: Добавлены PropTypes для валидации
ProfileFormModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  profile: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    profileName: PropTypes.string,
    folderName: PropTypes.string,
    workspaceId: PropTypes.string,
    workspaceName: PropTypes.string,
    userId: PropTypes.string,
    status: PropTypes.string,
    notes: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    lastActivity: PropTypes.string
  }),
  isEdit: PropTypes.bool
}

ProfileFormModal.defaultProps = {
  profile: null,
  isEdit: false
}

export default ProfileFormModal