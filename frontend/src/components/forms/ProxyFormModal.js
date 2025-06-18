// frontend/src/components/modals/ProxyFormModal.js
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
import { useEntityStatuses } from '../../hooks/useStatuses' // ДОБАВЛЕНО

const ProxyFormModal = ({ visible, onClose, proxy = null, isEdit = false }) => {
  const [showPasswords, setShowPasswords] = useState(false)
  
  const createMutation = useCreateProxy()
  const updateMutation = useUpdateProxy()
  const { data: projectsData } = useProjects()
  
  // ДОБАВЛЕНО: Загружаем статусы для прокси динамически
  const { data: proxyStatuses, isLoading: statusesLoading } = useEntityStatuses('proxy')
  
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
          {isEdit ? 'Редактировать прокси' : 'Добавить прокси'}
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
                          <div className="d-flex align-items-center">
                            <CSpinner size="sm" className="me-2" />
                            <span className="text-muted">Загрузка...</span>
                          </div>
                        ) : (
                          <CFormSelect 
                            id="status" 
                            {...register('status')}
                          >
                            {proxyStatuses && Object.values(proxyStatuses).map(status => (
                              <option key={status} value={status}>
                                {status === 'free' && '🟢 Свободен'}
                                {status === 'busy' && '🟡 Занят'}
                                {status === 'inactive' && '⚪ Неактивен'}
                                {status === 'banned' && '🔴 Заблокирован'}
                                {status === 'checking' && '🔍 Проверяется'}
                                {status === 'error' && '❌ Ошибка'}
                                {status === 'maintenance' && '🔧 Обслуживание'}
                                {!['free', 'busy', 'inactive', 'banned', 'checking', 'error', 'maintenance'].includes(status) && `⚪ ${status}`}
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

            {/* Авторизация и проект в одном ряду */}
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
                        <CIcon icon={showPasswords ? cilLockLocked : cilUser} />
                      </CButton>
                    </CInputGroup>
                  </div>

                  {!watch('login') && !watch('password') && (
                    <CAlert color="info" className="py-2 mb-0">
                      <small>
                        <CIcon icon={cilShieldAlt} className="me-1" />
                        Оставьте пустым, если авторизация не нужна
                      </small>
                    </CAlert>
                  )}
                </CCardBody>
              </CCard>
            </CCol>

            <CCol lg={6} xs={12}>
              <CCard className="mb-3 h-100">
                <CCardHeader className="py-2">
                  <h6 className="mb-0">
                    <CIcon icon={cilPeople} className="me-2" />
                    Управление
                  </h6>
                </CCardHeader>
                <CCardBody className="py-3">
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
                    <div className="form-text small">
                      Выберите проект для привязки
                    </div>
                  </div>

                  <div className="mb-0">
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

export default ProxyFormModal