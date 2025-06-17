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
} from '@coreui/react'
import { useForm } from 'react-hook-form'
import { useCreateProfiles, useUpdateProfile, useFolders } from '../../hooks/useProfiles'

const ProfileFormModal = ({ visible, onClose, profile = null, isEdit = false }) => {
  const createMutation = useCreateProfiles()
  const updateMutation = useUpdateProfile()
  const { data: folders } = useFolders()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading

  return (
    <CModal visible={visible} onClose={handleClose} size="lg">
      <CModalHeader>
        <CModalTitle>{isEdit ? 'Редактировать профиль' : 'Создать профиль'}</CModalTitle>
      </CModalHeader>
      
      <CForm onSubmit={handleSubmit(onSubmit)}>
        <CModalBody>
          <CRow>
            {/* Основная информация */}
            <CCol md={6}>
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
            
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="name">Название профиля *</CFormLabel>
                <CFormInput
                  id="name"
                  placeholder="Мой профиль 1"
                  invalid={!!errors.name}
                  {...register('name', { 
                    required: 'Название обязательно',
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
                <CFormLabel htmlFor="folderId">Folder ID</CFormLabel>
                <CFormInput
                  id="folderId"
                  {...register('folderId')}
                />
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="folderName">Название папки</CFormLabel>
                <CFormSelect id="folderName" {...register('folderName')}>
                  <option value="">Без папки</option>
                  {folders?.map((folder) => (
                    <option key={folder.name} value={folder.name}>
                      {folder.name}
                    </option>
                  ))}
                </CFormSelect>
              </div>
            </CCol>

            {/* Workspace */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="workspaceId">Workspace ID *</CFormLabel>
                <CFormInput
                  id="workspaceId"
                  placeholder="ws_001"
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
                <CFormSelect id="status" {...register('status')}>
                  <option value="created">created</option>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="working">working</option>
                  <option value="banned">banned</option>
                </CFormSelect>
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

export default ProfileFormModal