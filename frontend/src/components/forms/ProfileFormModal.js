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
    { value: 'active', label: 'Активный' },
    { value: 'inactive', label: 'Неактивный' },
    { value: 'blocked', label: 'Заблокирован' },
    { value: 'error', label: 'Ошибка' },
    { value: 'maintenance', label: 'На обслуживании' }
  ]

  return (
    <CModal 
      visible={visible} 
      onClose={handleClose} 
      size="lg"
      fullscreen="md"
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
                <CFormLabel htmlFor="profileName">Название профиля *</CFormLabel>
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
                <CFormLabel htmlFor="folderName">Название папки *</CFormLabel>
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
                <CFormLabel htmlFor="workspaceId">Workspace ID *</CFormLabel>
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
                <CFormLabel htmlFor="workspaceName">Название Workspace *</CFormLabel>
                <CFormInput
                  id="workspaceName"
                  placeholder="Мой workspace"
                  invalid={!!errors.workspaceName}
                  {...register('workspaceName', { 
                    required: 'Название workspace обязательно',
                    minLength: { value: 1, message: 'Минимум 1 символ' },
                    maxLength: { value: 255, message: 'Максимум 255 символов' }
                  })}
                />
                {errors.workspaceName && (
                  <div className="invalid-feedback d-block">{errors.workspaceName.message}</div>
                )}
              </div>
            </CCol>

            {/* User ID */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="userId">User ID</CFormLabel>
                <CFormInput
                  id="userId"
                  placeholder="user_123"
                  {...register('userId', {
                    maxLength: { value: 255, message: 'Максимум 255 символов' }
                  })}
                />
                {errors.userId && (
                  <div className="invalid-feedback d-block">{errors.userId.message}</div>
                )}
              </div>
            </CCol>

            {/* Статус */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="status">Статус</CFormLabel>
                <CFormSelect
                  id="status"
                  {...register('status')}
                  invalid={!!errors.status}
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
            <CAlert color="info" className="d-flex align-items-center">
              <CIcon icon={cilTask} className="me-2" />
              <div>
                <strong>Статус: {profileStatuses.find(s => s.value === watchedStatus)?.label || watchedStatus}</strong>
                <div className="small">
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
                <small>Информация о профиле</small>
              </CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol sm={6}>
                    <small className="text-muted">ID профиля:</small>
                    <div>{profile.id}</div>
                  </CCol>
                  <CCol sm={6}>
                    <small className="text-muted">Создан:</small>
                    <div>{profile.createdAt ? new Date(profile.createdAt).toLocaleString() : 'Неизвестно'}</div>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton 
            color="secondary" 
            onClick={handleClose} 
            disabled={isLoading}
          >
            Отмена
          </CButton>
          <CButton 
            color="primary" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading && <CSpinner component="span" size="sm" className="me-2" />}
            {isEdit ? 'Обновить' : 'Создать'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default ProfileFormModal