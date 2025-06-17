import React, { useState } from 'react'
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
  cilPeople,
  cilShieldAlt,
  cilUser,
  cilLockLocked,
} from '@coreui/icons'
import { useForm } from 'react-hook-form'
import { useCreateProxy, useUpdateProxy } from '../../hooks/useProxies'
import { useProjects } from '../../hooks/useProjects'

const ProxyFormModal = ({ visible, onClose, proxy = null, isEdit = false }) => {
  const [showPasswords, setShowPasswords] = useState(false)
  
  const createMutation = useCreateProxy()
  const updateMutation = useUpdateProxy()
  const { data: projectsData } = useProjects()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      ipPort: proxy?.ipPort || '',
      protocol: proxy?.protocol || 'http',
      login: proxy?.login || '',
      password: proxy?.password || '',
      country: proxy?.country || '',
      status: proxy?.status || 'free',
      projectId: proxy?.projectId || '',
      notes: proxy?.notes || '',
    }
  })

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
  const projects = projectsData?.projects || []

  const getStatusColor = (status) => {
    const colors = {
      free: 'success',
      busy: 'warning',
      disabled: 'danger'
    }
    return colors[status] || 'secondary'
  }

  const getProtocolColor = (protocol) => {
    const colors = {
      http: 'primary',
      https: 'success',
      socks4: 'info',
      socks5: 'warning'
    }
    return colors[protocol] || 'secondary'
  }

  return (
    <CModal 
      visible={visible} 
      onClose={handleClose} 
      size="lg"
      className="proxy-modal"
      backdrop="static"
    >
      <CModalHeader className="border-bottom-0 pb-2">
        <div className="d-flex align-items-center">
          <div className="me-3">
            <div className="avatar avatar-lg bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center">
              <CIcon icon={cilGlobeAlt} size="lg" />
            </div>
          </div>
          <div>
            <CModalTitle className="mb-1">
              {isEdit ? `Редактировать прокси` : 'Добавить новый прокси'}
            </CModalTitle>
            {isEdit && (
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">{proxy?.ipPort}</span>
                <CBadge color={getStatusColor(proxy?.status)} shape="rounded-pill">
                  {proxy?.status}
                </CBadge>
                <CBadge color={getProtocolColor(proxy?.protocol)} shape="rounded-pill">
                  {proxy?.protocol?.toUpperCase()}
                </CBadge>
              </div>
            )}
          </div>
        </div>
      </CModalHeader>
      
      <CForm onSubmit={handleSubmit(onSubmit)} className="h-100">
        <CModalBody className="pt-2">
          <CRow>
            {/* Основные настройки */}
            <CCol xs={12}>
              <CCard className="mb-4 border-0 bg-light">
                <CCardHeader className="bg-transparent border-0 pb-0">
                  <h6 className="mb-0 text-warning">
                    <CIcon icon={cilGlobeAlt} className="me-2" />
                    Основные настройки
                  </h6>
                </CCardHeader>
                <CCardBody>
                  <CRow>
                    <CCol md={8}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="ipPort" className="fw-semibold">
                          IP:Порт <span className="text-danger">*</span>
                        </CFormLabel>
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon={cilGlobeAlt} />
                          </CInputGroupText>
                          <CFormInput
                            id="ipPort"
                            placeholder="192.168.1.1:8080"
                            invalid={!!errors.ipPort}
                            {...register('ipPort', { 
                              required: 'IP:Порт обязательно',
                              pattern: {
                                value: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}:[0-9]+$/,
                                message: 'Формат: IP:PORT (например, 192.168.1.1:8080)'
                              }
                            })}
                          />
                        </CInputGroup>
                        {errors.ipPort && (
                          <div className="text-danger small mt-1">
                            {errors.ipPort.message}
                          </div>
                        )}
                      </div>
                    </CCol>

                    <CCol md={4}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="protocol" className="fw-semibold">Протокол</CFormLabel>
                        <CFormSelect
                          id="protocol"
                          {...register('protocol')}
                          className="form-select-custom"
                        >
                          <option value="http">HTTP</option>
                          <option value="https">HTTPS</option>
                          <option value="socks4">SOCKS4</option>
                          <option value="socks5">SOCKS5</option>
                        </CFormSelect>
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="status" className="fw-semibold">Статус</CFormLabel>
                        <CFormSelect 
                          id="status" 
                          {...register('status')}
                          className="form-select-custom"
                        >
                          <option value="free">🟢 Свободен</option>
                          <option value="busy">🟡 Занят</option>
                          <option value="disabled">🔴 Отключен</option>
                        </CFormSelect>
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="country" className="fw-semibold">Страна</CFormLabel>
                        <CFormInput
                          id="country"
                          placeholder="RU, US, DE..."
                          maxLength={2}
                          {...register('country')}
                          style={{ textTransform: 'uppercase' }}
                        />
                        <div className="form-text">
                          Код страны (2 символа)
                        </div>
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Авторизация */}
            <CCol xs={12}>
              <CCard className="mb-4 border-0 bg-light">
                <CCardHeader className="bg-transparent border-0 pb-0">
                  <h6 className="mb-0 text-primary">
                    <CIcon icon={cilShieldAlt} className="me-2" />
                    Авторизация
                  </h6>
                </CCardHeader>
                <CCardBody>
                  <CRow>
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="login" className="fw-semibold">Логин</CFormLabel>
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon={cilUser} />
                          </CInputGroupText>
                          <CFormInput
                            id="login"
                            placeholder="Логин для авторизации (необязательно)"
                            {...register('login')}
                          />
                        </CInputGroup>
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="password" className="fw-semibold">Пароль</CFormLabel>
                        <CInputGroup>
                          <CFormInput
                            id="password"
                            type={showPasswords ? 'text' : 'password'}
                            placeholder="Пароль для авторизации (необязательно)"
                            {...register('password')}
                          />
                          <CButton
                            type="button"
                            color="outline-secondary"
                            onClick={() => setShowPasswords(!showPasswords)}
                          >
                            <CIcon icon={showPasswords ? cilLockLocked : cilUser} />
                          </CButton>
                        </CInputGroup>
                      </div>
                    </CCol>
                  </CRow>

                  {!watch('login') && !watch('password') && (
                    <CAlert color="info" className="border-0 bg-info bg-opacity-10">
                      <small>
                        <CIcon icon={cilShieldAlt} className="me-1" />
                        Если прокси не требует авторизации, оставьте поля пустыми
                      </small>
                    </CAlert>
                  )}
                </CCardBody>
              </CCard>
            </CCol>

            {/* Привязка к проекту */}
            <CCol xs={12}>
              <CCard className="mb-4 border-0 bg-light">
                <CCardHeader className="bg-transparent border-0 pb-0">
                  <h6 className="mb-0 text-success">
                    <CIcon icon={cilPeople} className="me-2" />
                    Управление проектом
                  </h6>
                </CCardHeader>
                <CCardBody>
                  <CRow>
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="projectId" className="fw-semibold">Проект</CFormLabel>
                        <CFormSelect id="projectId" {...register('projectId')}>
                          <option value="">Без проекта</option>
                          {projects.map(project => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </CFormSelect>
                        <div className="form-text">
                          Выберите проект для привязки прокси
                        </div>
                      </div>
                    </CCol>

                    <CCol xs={12}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="notes" className="fw-semibold">Заметки</CFormLabel>
                        <CFormTextarea
                          id="notes"
                          rows={3}
                          placeholder="Дополнительная информация о прокси..."
                          {...register('notes')}
                        />
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Информационное сообщение */}
            {!isEdit && (
              <CCol xs={12}>
                <CAlert color="warning" className="border-0 bg-warning bg-opacity-10">
                  <h6 className="alert-heading mb-2">
                    <CIcon icon={cilSettings} className="me-2" />
                    Проверка прокси
                  </h6>
                  <small>
                    После сохранения будет выполнена автоматическая проверка доступности прокси. 
                    Убедитесь, что указанные данные корректны.
                  </small>
                </CAlert>
              </CCol>
            )}
          </CRow>
        </CModalBody>

        <CModalFooter className="border-top-0 pt-2">
          <div className="d-flex justify-content-between w-100">
            <div className="d-flex align-items-center text-muted small">
              {isEdit ? (
                <span>ID прокси: #{proxy?.id}</span>
              ) : (
                <span>Новый прокси будет добавлен в систему</span>
              )}
            </div>
            <div className="d-flex gap-2">
              <CButton 
                color="light" 
                onClick={handleClose}
                disabled={isLoading}
                className="px-4"
              >
                Отмена
              </CButton>
              <CButton 
                color="primary" 
                type="submit"
                disabled={isLoading}
                className="px-4"
              >
                {isLoading ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    {isEdit ? 'Обновление...' : 'Создание...'}
                  </>
                ) : (
                  <>
                    <CIcon icon={cilTask} className="me-2" />
                    {isEdit ? 'Обновить' : 'Создать'}
                  </>
                )}
              </CButton>
            </div>
          </div>
        </CModalFooter>
      </CForm>

      <style jsx>{`
        .proxy-modal .modal-content {
          border: none;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border-radius: 1rem;
        }
        
        .avatar {
          width: 3rem;
          height: 3rem;
        }
        
        .form-select-custom {
          cursor: pointer;
        }
        
        .form-label.fw-semibold {
          color: var(--cui-body-color);
          margin-bottom: 0.5rem;
        }
        
        .input-group-text {
          background-color: var(--cui-body-secondary-bg);
          border-color: var(--cui-border-color);
        }
        
        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        }
        
        .card {
          transition: all 0.2s ease;
          background-color: var(--cui-body-tertiary-bg) !important;
        }
        
        .card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        @media (prefers-color-scheme: dark) {
          .proxy-modal .modal-content {
            background-color: var(--cui-dark);
            color: var(--cui-light);
          }
          
          .card {
            background-color: var(--cui-dark-bg-subtle) !important;
          }
        }
      `}</style>
    </CModal>
  )
}

export default ProxyFormModal