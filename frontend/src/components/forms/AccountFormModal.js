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
import { useCreateAccount, useUpdateAccount } from '../../hooks/useAccounts'

const AccountFormModal = ({ visible, onClose, account = null, isEdit = false }) => {
  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
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
      // Очищаем пустые значения
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
    onClose()
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading

  return (
    <CModal visible={visible} onClose={handleClose} size="lg">
      <CModalHeader>
        <CModalTitle>{isEdit ? 'Редактировать аккаунт' : 'Создать аккаунт'}</CModalTitle>
      </CModalHeader>
      
      <CForm onSubmit={handleSubmit(onSubmit)}>
        <CModalBody>
          <CRow>
            {/* Основная информация */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="login">Логин *</CFormLabel>
                <CFormInput
                  id="login"
                  invalid={!!errors.login}
                  {...register('login', { 
                    required: 'Логин обязателен',
                    minLength: { value: 1, message: 'Минимум 1 символ' }
                  })}
                />
                {errors.login && (
                  <div className="invalid-feedback">{errors.login.message}</div>
                )}
              </div>
            </CCol>
            
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="password">Пароль *</CFormLabel>
                <CFormInput
                  id="password"
                  type="password"
                  invalid={!!errors.password}
                  {...register('password', { 
                    required: 'Пароль обязателен',
                    minLength: { value: 1, message: 'Минимум 1 символ' }
                  })}
                />
                {errors.password && (
                  <div className="invalid-feedback">{errors.password.message}</div>
                )}
              </div>
            </CCol>

            {/* Email */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="email">Email</CFormLabel>
                <CFormInput
                  id="email"
                  type="email"
                  invalid={!!errors.email}
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Некорректный email'
                    }
                  })}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email.message}</div>
                )}
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="emailPassword">Пароль от Email</CFormLabel>
                <CFormInput
                  id="emailPassword"
                  type="password"
                  {...register('emailPassword')}
                />
              </div>
            </CCol>

            {/* Статус и источник */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="status">Статус</CFormLabel>
                <CFormSelect id="status" {...register('status')}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="banned">banned</option>
                  <option value="working">working</option>
                  <option value="free">free</option>
                  <option value="busy">busy</option>
                </CFormSelect>
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="source">Источник</CFormLabel>
                <CFormSelect id="source" {...register('source')}>
                  <option value="manual">manual</option>
                  <option value="import">import</option>
                  <option value="registration">registration</option>
                  <option value="api">api</option>
                </CFormSelect>
              </div>
            </CCol>

            {/* Дополнительные поля */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="userId">User ID</CFormLabel>
                <CFormInput
                  id="userId"
                  {...register('userId')}
                />
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="nameProfiles">Имя профиля</CFormLabel>
                <CFormInput
                  id="nameProfiles"
                  {...register('nameProfiles')}
                />
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="friendsCounts">Количество друзей</CFormLabel>
                <CFormInput
                  id="friendsCounts"
                  type="number"
                  {...register('friendsCounts')}
                />
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="dob">Дата рождения</CFormLabel>
                <CFormInput
                  id="dob"
                  type="date"
                  {...register('dob')}
                />
              </div>
            </CCol>

            {/* Заметки */}
            <CCol xs={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="note">Заметки</CFormLabel>
                <CFormTextarea
                  id="note"
                  rows={3}
                  {...register('note')}
                />
              </div>
            </CCol>

            {/* Технические поля */}
            <CCol xs={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="userAgent">User Agent</CFormLabel>
                <CFormTextarea
                  id="userAgent"
                  rows={2}
                  {...register('userAgent')}
                />
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="twoFA">2FA Secret</CFormLabel>
                <CFormInput
                  id="twoFA"
                  {...register('twoFA')}
                />
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="device">Устройство</CFormLabel>
                <CFormInput
                  id="device"
                  {...register('device')}
                />
              </div>
            </CCol>

            {/* JSON поля */}
            <CCol xs={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="emailJsonData">Email JSON данные</CFormLabel>
                <CFormTextarea
                  id="emailJsonData"
                  rows={3}
                  {...register('emailJsonData')}
                />
              </div>
            </CCol>

            <CCol xs={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="lsposedJson">LSPosed JSON</CFormLabel>
                <CFormTextarea
                  id="lsposedJson"
                  rows={3}
                  {...register('lsposedJson')}
                />
              </div>
            </CCol>

            {/* Токены */}
            <CCol xs={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="accessToken">Access Token</CFormLabel>
                <CFormTextarea
                  id="accessToken"
                  rows={2}
                  {...register('accessToken')}
                />
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="clientId">Client ID</CFormLabel>
                <CFormInput
                  id="clientId"
                  {...register('clientId')}
                />
              </div>
            </CCol>

            <CCol xs={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="refreshToken">Refresh Token</CFormLabel>
                <CFormTextarea
                  id="refreshToken"
                  rows={2}
                  {...register('refreshToken')}
                />
              </div>
            </CCol>

            {/* Дополнительные поля */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="statusCheck">Статус проверки</CFormLabel>
                <CFormInput
                  id="statusCheck"
                  {...register('statusCheck')}
                />
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="namePage">Название страницы</CFormLabel>
                <CFormInput
                  id="namePage"
                  {...register('namePage')}
                />
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="idActive">ID активности</CFormLabel>
                <CFormInput
                  id="idActive"
                  {...register('idActive')}
                />
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="counter">Счетчик</CFormLabel>
                <CFormInput
                  id="counter"
                  type="number"
                  {...register('counter')}
                />
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="code">Код</CFormLabel>
                <CFormInput
                  id="code"
                  {...register('code')}
                />
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="dataRegistration">Дата регистрации аккаунта</CFormLabel>
                <CFormInput
                  id="dataRegistration"
                  type="datetime-local"
                  {...register('dataRegistration')}
                />
              </div>
            </CCol>

            {/* EAAB и данные */}
            <CCol xs={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="eaab">EAAB токен</CFormLabel>
                <CFormTextarea
                  id="eaab"
                  rows={3}
                  {...register('eaab')}
                />
              </div>
            </CCol>

            <CCol xs={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="data">Дополнительные данные</CFormLabel>
                <CFormTextarea
                  id="data"
                  rows={3}
                  {...register('data')}
                />
              </div>
            </CCol>

            {/* Cookies */}
            <CCol xs={12}>
              <div className="mb-3">
                <CFormLabel htmlFor="cookies">Cookies</CFormLabel>
                <CFormTextarea
                  id="cookies"
                  rows={4}
                  {...register('cookies')}
                />
              </div>
            </CCol>

            {/* Email Recovery */}
            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="emailRecovery">Резервный Email</CFormLabel>
                <CFormInput
                  id="emailRecovery"
                  type="email"
                  invalid={!!errors.emailRecovery}
                  {...register('emailRecovery', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Некорректный email'
                    }
                  })}
                />
                {errors.emailRecovery && (
                  <div className="invalid-feedback">{errors.emailRecovery.message}</div>
                )}
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="emailPasswordRecovery">Пароль от резервного Email</CFormLabel>
                <CFormInput
                  id="emailPasswordRecovery"
                  type="password"
                  {...register('emailPasswordRecovery')}
                />
              </div>
            </CCol>

            <CCol md={6}>
              <div className="mb-3">
                <CFormLabel htmlFor="importDate">Дата импорта</CFormLabel>
                <CFormInput
                  id="importDate"
                  type="datetime-local"
                  {...register('importDate')}
                />
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

export default AccountFormModal