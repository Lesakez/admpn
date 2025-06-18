const onSubmit = async (data) => {
    try {
      // Очищаем пустые значения
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '' && value !== null)
      )

      if (isEdit) {
        await updateMutation.mutateAsync({ id: profile.id, data: cleanData })
      } else {
        // Для создания профиля отправляем массив
        await createMutation.mutateAsync([cleanData])
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
  }// frontend/src/components/modals/ProfileFormModal.js
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
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave, cilX } from '@coreui/icons'
import { useForm } from 'react-hook-form'
import { useCreateProfiles, useUpdateProfile, useFolders } from '../../hooks/useProfiles'
import { useEntityStatuses } from '../../hooks/useStatuses' // ДОБАВЛЕНО

const ProfileFormModal = ({ visible, onClose, profile = null, isEdit = false }) => {
  const createMutation = useCreateProfiles()
  const updateMutation = useUpdateProfile()
  const { data: folders } = useFolders()
  
  // ДОБАВЛЕНО: Загружаем статусы для профилей динамически
  const { data: profileStatuses, isLoading: statusesLoading } = useEntityStatuses('profile')
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      profileId: profile?.profileId || '',
      name: profile?.name || '',
      folderId: profile?.folderId || '',
      folderName: profile?.folderName || '',
      workspaceId: profile?.workspaceId || '',
      workspaceName: profile?.workspaceName || '',
      proxy: profile?.proxy || 'none',
      userId: profile?.userId || '',
      status: profile?.status || 'created',
    }
  })

  const isLoading = createMutation.isLoading || updateMutation.isLoading

  return (
    <CModal 
      visible={visible} 
      onClose={handleClose} 
      size="lg"
      fullscreen="md"
    >
      <CModalHeader>
        <CModalTitle>{isEdit ? 'Редактировать профиль' : 'Создать профиль'}</CModalTitle>
      </CModalHeader>
      
      <CForm onSubmit={handleSubmit(onSubmit)}>
        <CModalBody>
          <CRow>
            {/* Основная информация */}
            <CCol md={6} sm={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="profileId">Profile ID *</CFormLabel>
                <CFormInput
                  id="profileId"
                  placeholder="profile_001"
                  invalid={!!errors.profileId}
                  {...register('profileId', { 
                    required: 'Profile ID обязателен',
                    minLength: { value: 1, message: 'Минимум 1 символ' }
                  })}
                />
                {errors.profileId && (
                  <div className="invalid-feedback">{errors.profileId.message}</div>
                )}
              </div>
            </CCol>

            <CCol md={6} sm={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="name">Название профиля *</CFormLabel>
                <CFormInput
                  id="name"
                  placeholder="Мой профиль"
                  invalid={!!errors.name}
                  {...register('name', { 
                    required: 'Название профиля обязательно',
                    minLength: { value: 1, message: 'Минимум 1 символ' }
                  })}
                />
                {errors.name && (
                  <div className="invalid-feedback">{errors.name.message}</div>
                )}
              </div>
            </CCol>

            {/* Папка */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="folderId">Folder ID *</CFormLabel>
                <CFormInput
                  id="folderId"
                  placeholder="folder_001"
                  invalid={!!errors.folderId}
                  {...register('folderId', { 
                    required: 'Folder ID обязателен',
                    minLength: { value: 1, message: 'Минимум 1 символ' }
                  })}
                />
                {errors.folderId && (
                  <div className="invalid-feedback">{errors.folderId.message}</div>
                )}
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="folderName">Название папки *</CFormLabel>
                <CFormInput
                  id="folderName"
                  placeholder="Моя папка"
                  invalid={!!errors.folderName}
                  {...register('folderName', { 
                    required: 'Название папки обязательно',
                    minLength: { value: 1, message: 'Минимум 1 символ' }
                  })}
                />
                {errors.folderName && (
                  <div className="invalid-feedback">{errors.folderName.message}</div>
                )}
              </div>
            </CCol>

            {/* Workspace */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="workspaceId">Workspace ID *</CFormLabel>
                <CFormInput
                  id="workspaceId"
                  placeholder="workspace_001"
                  invalid={!!errors.workspaceId}
                  {...register('workspaceId', { 
                    required: 'Workspace ID обязателен',
                    minLength: { value: 1, message: 'Минимум 1 символ' }
                  })}
                />
                {errors.workspaceId && (
                  <div className="invalid-feedback">{errors.workspaceId.message}</div>
                )}
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="workspaceName">Название Workspace *</CFormLabel>
                <CFormInput
                  id="workspaceName"
                  placeholder="Мой workspace"
                  invalid={!!errors.workspaceName}
                  {...register('workspaceName', { 
                    required: 'Название workspace обязательно',
                    minLength: { value: 1, message: 'Минимум 1 символ' }
                  })}
                />
                {errors.workspaceName && (
                  <div className="invalid-feedback">{errors.workspaceName.message}</div>
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
                  {...register('userId')}
                />
              </div>
            </CCol>

            {/* Статус */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="status">Статус</CFormLabel>
                
                {/* ИЗМЕНЕНО: Динамическая загрузка статусов */}
                {statusesLoading ? (
                  <div className="d-flex align-items-center">
                    <CSpinner size="sm" className="me-2" />
                    <span className="text-muted">Загрузка статусов...</span>
                  </div>
                ) : (
                  <CFormSelect id="status" {...register('status')}>
                    {profileStatuses && Object.values(profileStatuses).map(status => (
                      <option key={status} value={status}>
                        {status === 'created' && '🆕 Создан'}
                        {status === 'active' && '🟢 Активный'}
                        {status === 'inactive' && '⚪ Неактивный'}
                        {status === 'working' && '🟡 В работе'}
                        {status === 'banned' && '🔴 Заблокирован'}
                        {status === 'warming' && '🔥 Прогрев'}
                        {status === 'ready' && '✅ Готов'}
                        {status === 'error' && '❌ Ошибка'}
                        {!['created', 'active', 'inactive', 'working', 'banned', 'warming', 'ready', 'error'].includes(status) && `⚪ ${status}`}
                      </option>
                    ))}
                  </CFormSelect>
                )}
              </div>
            </CCol>

            {/* Прокси настройки */}
            <CCol xs={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="proxy">Прокси настройки *</CFormLabel>
                <CFormTextarea
                  id="proxy"
                  rows={3}
                  placeholder="none, socks5://127.0.0.1:1080, http://user:pass@proxy.com:8080"
                  invalid={!!errors.proxy}
                  {...register('proxy', { 
                    required: 'Прокси настройки обязательны'
                  })}
                />
                {errors.proxy && (
                  <div className="invalid-feedback">{errors.proxy.message}</div>
                )}
                <div className="form-text">
                  Укажите настройки прокси: none (без прокси), socks5://IP:PORT, http://login:pass@IP:PORT
                </div>
              </div>
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={handleClose} disabled={isLoading}>
            <CIcon icon={cilX} className="me-2" />
            Отмена
          </CButton>
          <CButton color="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {isEdit ? 'Сохранение...' : 'Создание...'}
              </>
            ) : (
              <>
                <CIcon icon={cilSave} className="me-2" />
                {isEdit ? 'Сохранить' : 'Создать'}
              </>
            )}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default ProfileFormModal