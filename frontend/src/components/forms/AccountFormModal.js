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
  CTabs,
  CTabList,
  CTab,
  CTabContent,
  CTabPanel,
  CInputGroup,
  CInputGroupText,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilUser,
  cilPeople,
  cilShieldAlt,
  cilSettings,
  cilBell,
  cilLockLocked,
  cilTask,
  cilEnvelopeOpen,
} from '@coreui/icons'
import { useForm } from 'react-hook-form'
import { useCreateAccount, useUpdateAccount } from '../../hooks/useAccounts'

const AccountFormModal = ({ visible, onClose, account = null, isEdit = false }) => {
  const [activeTab, setActiveTab] = useState('basic')
  const [showPasswords, setShowPasswords] = useState(false)
  
  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      login: account?.login || '',
      password: account?.password || '',
      email: account?.email || '',
      emailPassword: account?.emailPassword || '',
      emailRecovery: account?.emailRecovery || '',
      emailPasswordRecovery: account?.emailPasswordRecovery || '',
      userAgent: account?.userAgent || '',
      twoFA: account?.twoFA || '',
      dob: account?.dob ? account.dob.split('T')[0] : '',
      nameProfiles: account?.nameProfiles || '',
      userId: account?.userId || '',
      cookies: account?.cookies || '',
      status: account?.status || 'active',
      friendsCounts: account?.friendsCounts || '',
      note: account?.note || '',
      statusCheck: account?.statusCheck || '',
      eaab: account?.eaab || '',
      namePage: account?.namePage || '',
      data: account?.data || '',
      dataRegistration: account?.dataRegistration ? account.dataRegistration.split('T')[0] + 'T' + account.dataRegistration.split('T')[1]?.slice(0,5) : '',
      idActive: account?.idActive || '',
      counter: account?.counter || '',
      code: account?.code || '',
      device: account?.device || '',
      emailJsonData: account?.emailJsonData || '',
      lsposedJson: account?.lsposedJson || '',
      accessToken: account?.accessToken || '',
      clientId: account?.clientId || '',
      refreshToken: account?.refreshToken || '',
      source: account?.source || 'manual',
      importDate: account?.importDate ? account.importDate.split('T')[0] + 'T' + account.importDate.split('T')[1]?.slice(0,5) : '',
    }
  })

  const onSubmit = async (data) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '' && value !== null)
      )

      if (isEdit) {
        await updateMutation.mutateAsync({ id: account.id, data: cleanData })
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
    setActiveTab('basic')
    onClose()
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      inactive: 'secondary',
      banned: 'danger',
      working: 'warning',
      free: 'info',
      busy: 'primary'
    }
    return colors[status] || 'secondary'
  }

  return (
    <CModal 
      visible={visible} 
      onClose={handleClose} 
      size="xl"
      className="account-modal"
      backdrop="static"
    >
      <CModalHeader className="border-bottom-0 pb-2">
        <div className="d-flex align-items-center">
          <div className="me-3">
            <div className="avatar avatar-lg bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center">
              <CIcon icon={cilUser} size="lg" />
            </div>
          </div>
          <div>
            <CModalTitle className="mb-1">
              {isEdit ? `Редактировать аккаунт` : 'Создать новый аккаунт'}
            </CModalTitle>
            {isEdit && (
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">{account?.login}</span>
                <CBadge color={getStatusColor(account?.status)} shape="rounded-pill">
                  {account?.status}
                </CBadge>
              </div>
            )}
          </div>
        </div>
      </CModalHeader>
      
      <CForm onSubmit={handleSubmit(onSubmit)} className="h-100">
        <CModalBody className="pt-2">
          <CTabs activeItemKey={activeTab} onActiveItemChange={setActiveTab}>
            <CTabList variant="pills" className="mb-4">
              <CTab 
                itemKey="basic" 
                className="d-flex align-items-center gap-2"
                onClick={() => setActiveTab('basic')}
              >
                <CIcon icon={cilUser} size="sm" />
                Основные данные
              </CTab>
              <CTab 
                itemKey="email" 
                className="d-flex align-items-center gap-2"
                onClick={() => setActiveTab('email')}
              >
                <CIcon icon={cilEnvelopeOpen} size="sm" />
                Email и пароли
              </CTab>
              <CTab 
                itemKey="security" 
                className="d-flex align-items-center gap-2"
                onClick={() => setActiveTab('security')}
              >
                <CIcon icon={cilShieldAlt} size="sm" />
                Безопасность
              </CTab>
              <CTab 
                itemKey="technical" 
                className="d-flex align-items-center gap-2"
                onClick={() => setActiveTab('technical')}
              >
                <CIcon icon={cilSettings} size="sm" />
                Технические данные
              </CTab>
              <CTab 
                itemKey="additional" 
                className="d-flex align-items-center gap-2"
                onClick={() => setActiveTab('additional')}
              >
                <CIcon icon={cilBell} size="sm" />
                Дополнительно
              </CTab>
            </CTabList>

            <CTabContent>
              {/* Основные данные */}
              <CTabPanel itemKey="basic">
                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="login" className="fw-semibold">
                        Логин <span className="text-danger">*</span>
                      </CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilUser} />
                        </CInputGroupText>
                        <CFormInput
                          id="login"
                          placeholder="Введите логин"
                          invalid={!!errors.login}
                          {...register('login', { 
                            required: 'Логин обязателен',
                            minLength: { value: 3, message: 'Минимум 3 символа' }
                          })}
                        />
                      </CInputGroup>
                      {errors.login && (
                        <div className="text-danger small mt-1">
                          {errors.login.message}
                        </div>
                      )}
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="password" className="fw-semibold">
                        Пароль <span className="text-danger">*</span>
                      </CFormLabel>
                      <CInputGroup>
                        <CFormInput
                          id="password"
                          type={showPasswords ? 'text' : 'password'}
                          placeholder="Введите пароль"
                          invalid={!!errors.password}
                          {...register('password', { 
                            required: 'Пароль обязателен',
                            minLength: { value: 6, message: 'Минимум 6 символов' }
                          })}
                        />
                        <CButton
                          type="button"
                          color="outline-secondary"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          <CIcon icon={showPasswords ? cilLockLocked : cilUser} />
                        </CButton>
                      </CInputGroup>
                      {errors.password && (
                        <div className="text-danger small mt-1">
                          {errors.password.message}
                        </div>
                      )}
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
                        <option value="active">🟢 Активный</option>
                        <option value="inactive">⚪ Неактивный</option>
                        <option value="banned">🔴 Заблокирован</option>
                        <option value="working">🟡 В работе</option>
                        <option value="free">🔵 Свободен</option>
                        <option value="busy">🟠 Занят</option>
                      </CFormSelect>
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="source" className="fw-semibold">Источник</CFormLabel>
                      <CFormSelect id="source" {...register('source')}>
                        <option value="manual">Ручное создание</option>
                        <option value="import">Импорт</option>
                        <option value="registration">Регистрация</option>
                        <option value="api">API</option>
                      </CFormSelect>
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="nameProfiles" className="fw-semibold">Имя профиля</CFormLabel>
                      <CFormInput
                        id="nameProfiles"
                        placeholder="Имя профиля"
                        {...register('nameProfiles')}
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="userId" className="fw-semibold">User ID</CFormLabel>
                      <CFormInput
                        id="userId"
                        placeholder="ID пользователя"
                        {...register('userId')}
                      />
                    </div>
                  </CCol>

                  <CCol xs={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="note" className="fw-semibold">Заметки</CFormLabel>
                      <CFormTextarea
                        id="note"
                        rows={3}
                        placeholder="Дополнительная информация об аккаунте..."
                        {...register('note')}
                      />
                    </div>
                  </CCol>
                </CRow>
              </CTabPanel>

              {/* Email и пароли */}
              <CTabPanel itemKey="email">
                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="email" className="fw-semibold">Email</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilEnvelopeOpen} />
                        </CInputGroupText>
                        <CFormInput
                          id="email"
                          type="email"
                          placeholder="user@example.com"
                          invalid={!!errors.email}
                          {...register('email', {
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Некорректный email'
                            }
                          })}
                        />
                      </CInputGroup>
                      {errors.email && (
                        <div className="text-danger small mt-1">
                          {errors.email.message}
                        </div>
                      )}
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="emailPassword" className="fw-semibold">Пароль от Email</CFormLabel>
                      <CFormInput
                        id="emailPassword"
                        type={showPasswords ? 'text' : 'password'}
                        placeholder="Пароль от почты"
                        {...register('emailPassword')}
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="emailRecovery" className="fw-semibold">Резервный Email</CFormLabel>
                      <CFormInput
                        id="emailRecovery"
                        type="email"
                        placeholder="backup@example.com"
                        invalid={!!errors.emailRecovery}
                        {...register('emailRecovery', {
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Некорректный email'
                          }
                        })}
                      />
                      {errors.emailRecovery && (
                        <div className="text-danger small mt-1">
                          {errors.emailRecovery.message}
                        </div>
                      )}
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="emailPasswordRecovery" className="fw-semibold">Пароль резервного Email</CFormLabel>
                      <CFormInput
                        id="emailPasswordRecovery"
                        type={showPasswords ? 'text' : 'password'}
                        placeholder="Пароль от резервной почты"
                        {...register('emailPasswordRecovery')}
                      />
                    </div>
                  </CCol>
                </CRow>
              </CTabPanel>

              {/* Безопасность */}
              <CTabPanel itemKey="security">
                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="twoFA" className="fw-semibold">2FA Secret</CFormLabel>
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilShieldAlt} />
                        </CInputGroupText>
                        <CFormInput
                          id="twoFA"
                          placeholder="Base32 секретный ключ"
                          {...register('twoFA')}
                        />
                      </CInputGroup>
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="dob" className="fw-semibold">Дата рождения</CFormLabel>
                      <CFormInput
                        id="dob"
                        type="date"
                        {...register('dob')}
                      />
                    </div>
                  </CCol>

                  <CCol xs={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="cookies" className="fw-semibold">Cookies</CFormLabel>
                      <CFormTextarea
                        id="cookies"
                        rows={4}
                        placeholder="Вставьте cookies в формате JSON..."
                        {...register('cookies')}
                      />
                    </div>
                  </CCol>
                </CRow>
              </CTabPanel>

              {/* Технические данные */}
              <CTabPanel itemKey="technical">
                <CRow>
                  <CCol xs={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="userAgent" className="fw-semibold">User Agent</CFormLabel>
                      <CFormTextarea
                        id="userAgent"
                        rows={2}
                        placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
                        {...register('userAgent')}
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="device" className="fw-semibold">Устройство</CFormLabel>
                      <CFormInput
                        id="device"
                        placeholder="Информация об устройстве"
                        {...register('device')}
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="friendsCounts" className="fw-semibold">Количество друзей</CFormLabel>
                      <CFormInput
                        id="friendsCounts"
                        type="number"
                        placeholder="0"
                        {...register('friendsCounts')}
                      />
                    </div>
                  </CCol>

                  <CCol xs={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="accessToken" className="fw-semibold">Access Token</CFormLabel>
                      <CFormTextarea
                        id="accessToken"
                        rows={3}
                        placeholder="Токен доступа..."
                        {...register('accessToken')}
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="clientId" className="fw-semibold">Client ID</CFormLabel>
                      <CFormInput
                        id="clientId"
                        placeholder="ID клиента"
                        {...register('clientId')}
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="refreshToken" className="fw-semibold">Refresh Token</CFormLabel>
                      <CFormInput
                        id="refreshToken"
                        placeholder="Токен обновления"
                        {...register('refreshToken')}
                      />
                    </div>
                  </CCol>
                </CRow>
              </CTabPanel>

              {/* Дополнительные данные */}
              <CTabPanel itemKey="additional">
                <CRow>
                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="dataRegistration" className="fw-semibold">Дата регистрации</CFormLabel>
                      <CFormInput
                        id="dataRegistration"
                        type="datetime-local"
                        {...register('dataRegistration')}
                      />
                    </div>
                  </CCol>

                  <CCol md={6}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="importDate" className="fw-semibold">Дата импорта</CFormLabel>
                      <CFormInput
                        id="importDate"
                        type="datetime-local"
                        {...register('importDate')}
                      />
                    </div>
                  </CCol>

                  <CCol xs={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="emailJsonData" className="fw-semibold">Email JSON данные</CFormLabel>
                      <CFormTextarea
                        id="emailJsonData"
                        rows={4}
                        placeholder='{"key": "value"}'
                        {...register('emailJsonData')}
                      />
                    </div>
                  </CCol>

                  <CCol xs={12}>
                    <div className="mb-3">
                      <CFormLabel htmlFor="lsposedJson" className="fw-semibold">LSPosed JSON</CFormLabel>
                      <CFormTextarea
                        id="lsposedJson"
                        rows={4}
                        placeholder='{"module": "config"}'
                        {...register('lsposedJson')}
                      />
                    </div>
                  </CCol>
                </CRow>
              </CTabPanel>
            </CTabContent>
          </CTabs>
        </CModalBody>

        <CModalFooter className="border-top-0 pt-2">
          <div className="d-flex justify-content-between w-100">
            <div className="d-flex align-items-center text-muted small">
              {isEdit && (
                <span>Последнее изменение: {new Date().toLocaleDateString('ru-RU')}</span>
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
                    {isEdit ? 'Сохранение...' : 'Создание...'}
                  </>
                ) : (
                  <>
                    <CIcon icon={cilTask} className="me-2" />
                    {isEdit ? 'Сохранить' : 'Создать'}
                  </>
                )}
              </CButton>
            </div>
          </div>
        </CModalFooter>
      </CForm>

      <style jsx>{`
        .account-modal .modal-content {
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
        
        .nav-pills .nav-link {
          border-radius: 0.5rem;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .tab-content {
          min-height: 400px;
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
        
        @media (prefers-color-scheme: dark) {
          .account-modal .modal-content {
            background-color: var(--cui-dark);
            color: var(--cui-light);
          }
        }
      `}</style>
    </CModal>
  )
}

export default AccountFormModal