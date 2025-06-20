// frontend/src/components/forms/ProxyFormModal.js
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
  cilGlobeAlt,
  cilSettings,
  cilTask,
  cilShieldAlt,
  cilUser,
  cilLockLocked,
  cilEyedropper
} from '@coreui/icons'
import { useForm } from 'react-hook-form'
import { useCreateProxy, useUpdateProxy } from '../../hooks/useProxies'
import { useProjects } from '../../hooks/useProjects'
import { useEntityStatuses } from '../../hooks/useStatuses'

const ProxyFormModal = ({ visible, onClose, proxy = null, isEdit = false }) => {
  const [showPasswords, setShowPasswords] = useState(false)
  
  const createMutation = useCreateProxy()
  const updateMutation = useUpdateProxy()
  const { data: projectsData } = useProjects()
  
  // Загружаем статусы для прокси динамически
  const { data: proxyStatuses, isLoading: statusesLoading } = useEntityStatuses('proxy')
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      ipPort: '',
      protocol: 'http',
      login: '',
      password: '',
      country: '',
      status: 'free',
      projectId: '',
      notes: '',
    }
  })

  // Обновляем форму при изменении proxy
  useEffect(() => {
    if (visible) {
      if (proxy && isEdit) {
        // Устанавливаем значения формы из данных прокси
        setValue('ipPort', proxy.ipPort || '')
        setValue('protocol', proxy.protocol || 'http')
        setValue('login', proxy.login || '')
        setValue('password', proxy.password || '')
        setValue('country', proxy.country || '')
        setValue('status', proxy.status || 'free')
        setValue('projectId', proxy.projectId ? String(proxy.projectId) : '')
        setValue('notes', proxy.notes || '')
      } else {
        // Для нового прокси сбрасываем форму
        reset({
          ipPort: '',
          protocol: 'http',
          login: '',
          password: '',
          country: '',
          status: 'free',
          projectId: '',
          notes: '',
        })
      }
    }
  }, [proxy, isEdit, visible, setValue, reset])

  const watchedStatus = watch('status')

  const onSubmit = async (data) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '' && value !== null)
      )

      if (cleanData.projectId) {
        cleanData.projectId = parseInt(cleanData.projectId)
      }

      if (isEdit) {
        await updateMutation.mutateAsync({ id: proxy.id, data: cleanData })
      } else {
        await createMutation.mutateAsync(cleanData)
      }
      
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleClose = () => {
    onClose()
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading
  const projects = projectsData?.data?.projects || []

  return (
    <CModal 
      visible={visible} 
      onClose={handleClose} 
      size="lg"
      fullscreen="md"
    >
      <CModalHeader>
        <CModalTitle>
          <CIcon icon={cilGlobeAlt} className="me-2" />
          {isEdit ? `Редактировать прокси ${proxy?.ipPort}` : 'Добавить прокси'}
        </CModalTitle>
      </CModalHeader>
      
      <CForm onSubmit={handleSubmit(onSubmit)}>
        <CModalBody className="pb-2">
          <CRow>
            {/* Основная информация */}
            <CCol xs={12}>
              <CCard className="mb-3">
                <CCardHeader className="py-2">
                  <h6 className="mb-0">
                    <CIcon icon={cilSettings} className="me-2" />
                    Основная информация
                  </h6>
                </CCardHeader>
                <CCardBody className="py-3">
                  <CRow>
                    <CCol lg={8} md={12}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="ipPort" className="fw-semibold">
                          IP:PORT *
                        </CFormLabel>
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon={cilGlobeAlt} />
                          </CInputGroupText>
                          <CFormInput
                            id="ipPort"
                            placeholder="127.0.0.1:8080"
                            invalid={!!errors.ipPort}
                            {...register('ipPort', { 
                              required: 'IP:PORT обязателен',
                              pattern: {
                                value: /^[\d\.]+:\d+$/,
                                message: 'Формат: IP:PORT (например, 127.0.0.1:8080)'
                              }
                            })}
                          />
                        </CInputGroup>
                        {errors.ipPort && (
                          <div className="invalid-feedback d-block">{errors.ipPort.message}</div>
                        )}
                      </div>
                    </CCol>

                    <CCol lg={4} md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="protocol" className="fw-semibold">Протокол</CFormLabel>
                        <CFormSelect 
                          id="protocol" 
                          {...register('protocol')}
                        >
                          <option value="http">HTTP</option>
                          <option value="https">HTTPS</option>
                          <option value="socks4">SOCKS4</option>
                          <option value="socks5">SOCKS5</option>
                        </CFormSelect>
                      </div>
                    </CCol>

                    <CCol lg={6} md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="status" className="fw-semibold">Статус</CFormLabel>
                        
                        {statusesLoading ? (
                          <CFormSelect disabled>
                            <option>Загрузка статусов...</option>
                          </CFormSelect>
                        ) : (
                          <CFormSelect 
                            id="status" 
                            {...register('status')}
                          >
                            {proxyStatuses?.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </CFormSelect>
                        )}
                      </div>
                    </CCol>

                    <CCol lg={6} md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="country" className="fw-semibold">Страна</CFormLabel>
                        <CFormInput
                          id="country"
                          placeholder="RU, US, DE..."
                          maxLength={2}
                          {...register('country')}
                          style={{ textTransform: 'uppercase' }}
                        />
                        <div className="form-text small">
                          Код страны (2 символа)
                        </div>
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Авторизация и проект */}
            <CCol lg={6} xs={12}>
              <CCard className="mb-3 h-100">
                <CCardHeader className="py-2">
                  <h6 className="mb-0">
                    <CIcon icon={cilShieldAlt} className="me-2" />
                    Авторизация
                  </h6>
                </CCardHeader>
                <CCardBody className="py-3">
                  <div className="mb-3">
                    <CFormLabel htmlFor="login" className="fw-semibold">Логин</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        id="login"
                        placeholder="Необязательно"
                        {...register('login')}
                      />
                    </CInputGroup>
                  </div>
                  
                  <div className="mb-3">
                    <CFormLabel htmlFor="password" className="fw-semibold">Пароль</CFormLabel>
                    <CInputGroup>
                      <CFormInput
                        id="password"
                        type={showPasswords ? 'text' : 'password'}
                        placeholder="Необязательно"
                        {...register('password')}
                      />
                      <CButton
                        type="button"
                        color="outline-secondary"
                        onClick={() => setShowPasswords(!showPasswords)}
                      >
                        {showPasswords ? '🙈' : '👁️'}
                      </CButton>
                    </CInputGroup>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Проект */}
            <CCol lg={6} xs={12}>
              <CCard className="mb-3 h-100">
                <CCardHeader className="py-2">
                  <h6 className="mb-0">
                    <CIcon icon={cilTask} className="me-2" />
                    Проект
                  </h6>
                </CCardHeader>
                <CCardBody className="py-3">
                  <div className="mb-3">
                    <CFormLabel htmlFor="projectId" className="fw-semibold">Назначить проекту</CFormLabel>
                    <CFormSelect 
                      id="projectId" 
                      {...register('projectId')}
                    >
                      <option value="">Без проекта</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </CFormSelect>
                    {projects.length === 0 && (
                      <div className="form-text small text-warning">
                        Нет доступных проектов
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <CFormLabel htmlFor="notes" className="fw-semibold">Заметки</CFormLabel>
                    <CFormTextarea
                      id="notes"
                      rows={3}
                      placeholder="Дополнительная информация..."
                      {...register('notes')}
                    />
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
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
            {isLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {isEdit ? 'Сохранение...' : 'Создание...'}
              </>
            ) : (
              isEdit ? 'Сохранить изменения' : 'Создать прокси'
            )}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default ProxyFormModal