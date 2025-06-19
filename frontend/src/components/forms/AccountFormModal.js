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
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilUser,
  cilPeople,
  cilShieldAlt,
  cilSettings,
  cilBell,
  cilLockLocked,
  cilEnvelopeClosed,
  cilSave,
  cilX,
} from '@coreui/icons'
import { useForm } from 'react-hook-form'
import { useCreateAccount, useUpdateAccount, useAccountWithPassword } from '../../hooks/useAccounts'
import { useEntityStatuses } from '../../hooks/useStatuses'

const AccountFormModal = ({ visible, onClose, account = null, isEdit = false }) => {
  const [activeTab, setActiveTab] = useState('basic')

  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()

  // ВАЖНО: Используем новый хук для получения полных данных с паролем
  const { data: accountWithPassword, isLoading: accountLoading } = useAccountWithPassword(
    isEdit && account?.id ? account.id : null
  )

  const { data: statusesResponse, isLoading: statusesLoading } = useEntityStatuses('account')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      login: '',
      password: '',
      email: '',
      emailPassword: '',
      emailRecovery: '',
      emailPasswordRecovery: '',
      userAgent: '',
      twoFA: '',
      dob: '',
      nameProfiles: '',
      userId: '',
      cookies: '',
      status: 'active',
      friendsCounts: '',
      note: '',
      statusCheck: '',
      eaab: '',
      namePage: '',
      data: '',
      dataRegistration: '',
      idActive: '',
      counter: '',
      code: '',
      device: '',
      emailJsonData: '',
      lsposedJson: '',
      accessToken: '',
      clientId: '',
      refreshToken: '',
      source: 'manual',
      importDate: '',
    }
  })

  // Обработка статусов
  const getStatusOptions = () => {
    console.log('Status response data:', statusesResponse)
    
    if (!statusesResponse?.data) return []
    
    const statuses = statusesResponse.data.statuses || statusesResponse.data
    console.log('Extracted statuses:', statuses)
    
    if (Array.isArray(statuses)) {
      return statuses
    }
    
    if (typeof statuses === 'object') {
      return Object.values(statuses)
    }
    
    // Fallback статусы если ничего не получили
    return ['active', 'inactive', 'blocked', 'suspended']
  }

  useEffect(() => {
    if (visible && isEdit && accountWithPassword) {
      const formData = {
        login: accountWithPassword.login ?? '',
        password: accountWithPassword.password ?? '', // Теперь пароль будет загружен
        email: accountWithPassword.email ?? '',
        emailPassword: accountWithPassword.emailPassword ?? '',
        emailRecovery: accountWithPassword.emailRecovery ?? '',
        emailPasswordRecovery: accountWithPassword.emailPasswordRecovery ?? '',
        userAgent: accountWithPassword.userAgent ?? '',
        twoFA: accountWithPassword.twoFA ?? '',
        dob: accountWithPassword.dob ? accountWithPassword.dob.split('T')[0] : '',
        nameProfiles: accountWithPassword.nameProfiles ?? '',
        userId: accountWithPassword.userId ?? '',
        cookies: accountWithPassword.cookies ?? '',
        status: accountWithPassword.status ?? 'active',
        friendsCounts: accountWithPassword.friendsCounts ? String(accountWithPassword.friendsCounts) : '',
        note: accountWithPassword.note ?? '',
        statusCheck: accountWithPassword.statusCheck ?? '',
        eaab: accountWithPassword.eaab ?? '',
        namePage: accountWithPassword.namePage ?? '',
        data: accountWithPassword.data ?? '',
        dataRegistration: accountWithPassword.dataRegistration ? accountWithPassword.dataRegistration.split('T')[0] : '',
        idActive: accountWithPassword.idActive ?? '',
        counter: accountWithPassword.counter ? String(accountWithPassword.counter) : '',
        code: accountWithPassword.code ?? '',
        device: accountWithPassword.device ?? '',
        emailJsonData: accountWithPassword.emailJsonData ?? '',
        lsposedJson: accountWithPassword.lsposedJson ?? '',
        accessToken: accountWithPassword.accessToken ?? '',
        clientId: accountWithPassword.clientId ?? '',
        refreshToken: accountWithPassword.refreshToken ?? '',
        source: accountWithPassword.source ?? 'manual',
        importDate: accountWithPassword.importDate ? accountWithPassword.importDate.split('T')[0] : '',
      }

      console.log('Form data for edit with password:', formData)
      reset(formData)
    } else if (visible && !isEdit) {
      reset({
        login: '',
        password: '',
        email: '',
        emailPassword: '',
        emailRecovery: '',
        emailPasswordRecovery: '',
        userAgent: '',
        twoFA: '',
        dob: '',
        nameProfiles: '',
        userId: '',
        cookies: '',
        status: 'active',
        friendsCounts: '',
        note: '',
        statusCheck: '',
        eaab: '',
        namePage: '',
        data: '',
        dataRegistration: '',
        idActive: '',
        counter: '',
        code: '',
        device: '',
        emailJsonData: '',
        lsposedJson: '',
        accessToken: '',
        clientId: '',
        refreshToken: '',
        source: 'manual',
        importDate: '',
      })
    }
  }, [visible, accountWithPassword, isEdit, reset])

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

      handleClose()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleClose = () => {
    reset()
    setActiveTab('basic')
    onClose()
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading || accountLoading

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
          {isEdit ? 'Редактировать аккаунт' : 'Добавить аккаунт'}
        </CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit(onSubmit)}>
        <CModalBody className="pb-2">
          <CNav variant="tabs" role="tablist">
            <CNavItem>
              <CNavLink
                active={activeTab === 'basic'}
                onClick={() => setActiveTab('basic')}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={cilUser} className="me-2" />
                Основное
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 'email'}
                onClick={() => setActiveTab('email')}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={cilEnvelopeClosed} className="me-2" />
                Email
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 'advanced'}
                onClick={() => setActiveTab('advanced')}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={cilSettings} className="me-2" />
                Дополнительно
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 'tokens'}
                onClick={() => setActiveTab('tokens')}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={cilShieldAlt} className="me-2" />
                Токены
              </CNavLink>
            </CNavItem>
          </CNav>

          <CTabContent className="mt-3">
            {/* Основная информация */}
            <CTabPane visible={activeTab === 'basic'}>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="login" className="fw-semibold">
                      Логин *
                    </CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        id="login"
                        placeholder="Логин аккаунта"
                        invalid={!!errors.login}
                        {...register('login', {
                          required: 'Логин обязателен',
                          minLength: { value: 1, message: 'Минимум 1 символ' }
                        })}
                      />
                    </CInputGroup>
                    {errors.login && (
                      <div className="invalid-feedback d-block">{errors.login.message}</div>
                    )}
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="password" className="fw-semibold">
                      Пароль *
                    </CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        id="password"
                        type="text"
                        placeholder="Пароль аккаунта"
                        invalid={!!errors.password}
                        {...register('password', {
                          required: 'Пароль обязателен',
                          minLength: { value: 1, message: 'Минимум 1 символ' }
                        })}
                      />
                    </CInputGroup>
                    {errors.password && (
                      <div className="invalid-feedback d-block">{errors.password.message}</div>
                    )}
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="status" className="fw-semibold">Статус</CFormLabel>
                    {statusesLoading ? (
                      <CFormSelect disabled>
                        <option>Загрузка статусов...</option>
                      </CFormSelect>
                    ) : (
                      <CFormSelect id="status" {...register('status')}>
                        {getStatusOptions().map((status) => (
                          <option key={status} value={status}>
                            {status === 'active' && '🟢 Активный'}
                            {status === 'inactive' && '⚫ Неактивный'}
                            {status === 'blocked' && '🔴 Заблокирован'}
                            {status === 'suspended' && '🟡 Приостановлен'}
                            {status === 'banned' && '🔴 Забанен'}
                            {status === 'free' && '🟢 Свободный'}
                            {status === 'busy' && '🟡 Занят'}
                            {status === 'working' && '🔵 Работает'}
                            {status === 'pending' && '🟡 Ожидает'}
                            {status === 'verified' && '✅ Проверен'}
                            {status === 'unverified' && '❌ Не проверен'}
                            {!['active', 'inactive', 'blocked', 'suspended', 'banned', 'free', 'busy', 'working', 'pending', 'verified', 'unverified'].includes(status) && `⚪ ${status}`}
                          </option>
                        ))}
                      </CFormSelect>
                    )}
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
                    <CFormLabel htmlFor="userId" className="fw-semibold">User ID</CFormLabel>
                    <CFormInput
                      id="userId"
                      placeholder="ID пользователя"
                      {...register('userId')}
                    />
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
            </CTabPane>

            {/* Email данные */}
            <CTabPane visible={activeTab === 'email'}>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="email" className="fw-semibold">Email</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>
                        <CIcon icon={cilEnvelopeClosed} />
                      </CInputGroupText>
                      <CFormInput
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        invalid={!!errors.email}
                        {...register('email')}
                      />
                    </CInputGroup>
                    {errors.email && (
                      <div className="invalid-feedback d-block">{errors.email.message}</div>
                    )}
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="emailPassword" className="fw-semibold">Пароль email</CFormLabel>
                    <CInputGroup>
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        id="emailPassword"
                        type="text"
                        placeholder="Пароль от email"
                        {...register('emailPassword')}
                      />
                    </CInputGroup>
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="emailRecovery" className="fw-semibold">Резервный email</CFormLabel>
                    <CFormInput
                      id="emailRecovery"
                      type="email"
                      placeholder="recovery@example.com"
                      {...register('emailRecovery')}
                    />
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="emailPasswordRecovery" className="fw-semibold">Пароль резервного email</CFormLabel>
                    <CFormInput
                      id="emailPasswordRecovery"
                      type="text"
                      placeholder="Пароль от резервного email"
                      {...register('emailPasswordRecovery')}
                    />
                  </div>
                </CCol>

                <CCol xs={12}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="emailJsonData" className="fw-semibold">JSON данные email</CFormLabel>
                    <CFormTextarea
                      id="emailJsonData"
                      rows={4}
                      placeholder="JSON данные email..."
                      {...register('emailJsonData')}
                    />
                  </div>
                </CCol>
              </CRow>
            </CTabPane>

            {/* Дополнительные данные */}
            <CTabPane visible={activeTab === 'advanced'}>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="twoFA" className="fw-semibold">2FA секрет</CFormLabel>
                    <CFormInput
                      id="twoFA"
                      placeholder="2FA секретный ключ"
                      {...register('twoFA')}
                    />
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

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="device" className="fw-semibold">Устройство</CFormLabel>
                    <CFormInput
                      id="device"
                      placeholder="Название устройства"
                      {...register('device')}
                    />
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="dataRegistration" className="fw-semibold">Дата регистрации</CFormLabel>
                    <CFormInput
                      id="dataRegistration"
                      type="date"
                      {...register('dataRegistration')}
                    />
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="importDate" className="fw-semibold">Дата импорта</CFormLabel>
                    <CFormInput
                      id="importDate"
                      type="date"
                      {...register('importDate')}
                    />
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="statusCheck" className="fw-semibold">Проверка статуса</CFormLabel>
                    <CFormInput
                      id="statusCheck"
                      placeholder="Статус проверки"
                      {...register('statusCheck')}
                    />
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="idActive" className="fw-semibold">ID активности</CFormLabel>
                    <CFormInput
                      id="idActive"
                      placeholder="ID активности"
                      {...register('idActive')}
                    />
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="counter" className="fw-semibold">Счетчик</CFormLabel>
                    <CFormInput
                      id="counter"
                      type="number"
                      placeholder="0"
                      {...register('counter')}
                    />
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="namePage" className="fw-semibold">Имя страницы</CFormLabel>
                    <CFormInput
                      id="namePage"
                      placeholder="Имя страницы"
                      {...register('namePage')}
                    />
                  </div>
                </CCol>

                <CCol xs={12}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="userAgent" className="fw-semibold">User Agent</CFormLabel>
                    <CFormTextarea
                      id="userAgent"
                      rows={3}
                      placeholder="Mozilla/5.0..."
                      {...register('userAgent')}
                    />
                  </div>
                </CCol>

                <CCol xs={12}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="cookies" className="fw-semibold">Cookies</CFormLabel>
                    <CFormTextarea
                      id="cookies"
                      rows={4}
                      placeholder="Cookies в формате JSON или строки..."
                      {...register('cookies')}
                    />
                  </div>
                </CCol>

                <CCol xs={12}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="data" className="fw-semibold">Дополнительные данные</CFormLabel>
                    <CFormTextarea
                      id="data"
                      rows={4}
                      placeholder="Дополнительные данные..."
                      {...register('data')}
                    />
                  </div>
                </CCol>

                <CCol xs={12}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="eaab" className="fw-semibold">EAAB</CFormLabel>
                    <CFormTextarea
                      id="eaab"
                      rows={3}
                      placeholder="EAAB данные..."
                      {...register('eaab')}
                    />
                  </div>
                </CCol>
              </CRow>
            </CTabPane>

            {/* Токены */}
            <CTabPane visible={activeTab === 'tokens'}>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="accessToken" className="fw-semibold">Access Token</CFormLabel>
                    <CFormTextarea
                      id="accessToken"
                      rows={3}
                      placeholder="Access token..."
                      {...register('accessToken')}
                    />
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="refreshToken" className="fw-semibold">Refresh Token</CFormLabel>
                    <CFormTextarea
                      id="refreshToken"
                      rows={3}
                      placeholder="Refresh token..."
                      {...register('refreshToken')}
                    />
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="clientId" className="fw-semibold">Client ID</CFormLabel>
                    <CFormInput
                      id="clientId"
                      placeholder="Client ID"
                      {...register('clientId')}
                    />
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="code" className="fw-semibold">Код</CFormLabel>
                    <CFormInput
                      id="code"
                      placeholder="Код"
                      {...register('code')}
                    />
                  </div>
                </CCol>

                <CCol xs={12}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="lsposedJson" className="fw-semibold">LSPosed JSON</CFormLabel>
                    <CFormTextarea
                      id="lsposedJson"
                      rows={4}
                      placeholder="LSPosed JSON данные..."
                      {...register('lsposedJson')}
                    />
                  </div>
                </CCol>
              </CRow>
            </CTabPane>
          </CTabContent>
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

export default AccountFormModal