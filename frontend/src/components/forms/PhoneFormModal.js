// frontend/src/components/forms/PhoneFormModal.js

import React, { useEffect } from 'react'
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
  cilDevices,
  cilSettings,
  cilTask,
  cilGlobeAlt,
  cilShieldAlt,
  cilSave,
  cilX
} from '@coreui/icons'
import { useForm } from 'react-hook-form'
import { useCreatePhone, useUpdatePhone } from '../../hooks/usePhones'
import { useProjects } from '../../hooks/useProjects'
import PropTypes from 'prop-types'

const PhoneFormModal = ({ visible, onClose, phone = null, isEdit = false }) => {
  const createMutation = useCreatePhone()
  const updateMutation = useUpdatePhone()
  const { data: projectsData } = useProjects()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      model: '',
      device: '',
      androidVersion: '',
      ipAddress: '',
      macAddress: '',
      status: 'free',
      projectId: '',
      notes: '',
    }
  })

  // Заполняем форму при изменении phone
  useEffect(() => {
    if (phone && isEdit) {
      setValue('model', phone.model || '')
      setValue('device', phone.device || '')
      setValue('androidVersion', phone.androidVersion || '')
      setValue('ipAddress', phone.ipAddress || '')
      setValue('macAddress', phone.macAddress || '')
      setValue('status', phone.status || 'free')
      setValue('projectId', phone.projectId ? String(phone.projectId) : '')
      setValue('notes', phone.notes || '')
    } else {
      reset({
        model: '',
        device: '',
        androidVersion: '',
        ipAddress: '',
        macAddress: '',
        status: 'free',
        projectId: '',
        notes: '',
      })
    }
  }, [phone, isEdit, setValue, reset])

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
        await updateMutation.mutateAsync({ id: phone.id, data: cleanData })
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

  const isLoading = createMutation.isPending || updateMutation.isPending
  const projects = projectsData?.data?.projects || projectsData?.projects || []

  const getStatusColor = (status) => {
    const colors = {
      free: 'success',
      busy: 'warning', 
      disabled: 'danger',
      error: 'danger',
      maintenance: 'info'
    }
    return colors[status] || 'secondary'
  }

  const getStatusLabel = (status) => {
    const labels = {
      free: 'Свободен',
      busy: 'Занят',
      disabled: 'Отключен',
      error: 'Ошибка',
      maintenance: 'Обслуживание'
    }
    return labels[status] || status
  }

  const androidVersions = [
    { value: '14', label: 'Android 14' },
    { value: '13', label: 'Android 13' },
    { value: '12', label: 'Android 12' },
    { value: '11', label: 'Android 11' },
    { value: '10', label: 'Android 10' },
    { value: '9', label: 'Android 9' },
    { value: '8', label: 'Android 8' },
    { value: '7', label: 'Android 7' }
  ]

  const availableStatuses = [
    { value: 'free', label: 'Свободен' },
    { value: 'busy', label: 'Занят' },
    { value: 'disabled', label: 'Отключен' },
    { value: 'error', label: 'Ошибка' },
    { value: 'maintenance', label: 'Обслуживание' }
  ]

  return (
    <CModal 
      visible={visible} 
      onClose={handleClose} 
      size="lg"
      backdrop="static"
      className="phone-form-modal"
    >
      <CModalHeader className="border-bottom">
        <div className="d-flex align-items-center">
          <div className="me-3">
            <div className="avatar avatar-lg bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center">
              <CIcon icon={cilDevices} size="lg" />
            </div>
          </div>
          <div>
            <CModalTitle className="mb-1">
              {isEdit ? `Редактировать устройство` : 'Добавить новое устройство'}
            </CModalTitle>
            {isEdit && phone && (
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">{phone.model || phone.device}</span>
                <CBadge color={getStatusColor(phone.status)} shape="rounded-pill">
                  {getStatusLabel(phone.status)}
                </CBadge>
              </div>
            )}
          </div>
        </div>
      </CModalHeader>
      
      <CModalBody>
        <CForm onSubmit={handleSubmit(onSubmit)} id="phone-form">
          <CRow>
            {/* Основная информация об устройстве */}
            <CCol xs={12}>
              <CCard className="mb-4 border-0 shadow-sm">
                <CCardHeader className="bg-light border-0">
                  <h6 className="mb-0 text-primary d-flex align-items-center">
                    <CIcon icon={cilDevices} className="me-2" />
                    Основная информация
                  </h6>
                </CCardHeader>
                <CCardBody>
                  <CRow>
                    {/* Модель устройства */}
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="model" className="fw-semibold">
                          Модель устройства <span className="text-danger">*</span>
                        </CFormLabel>
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon={cilDevices} />
                          </CInputGroupText>
                          <CFormInput
                            id="model"
                            placeholder="Samsung Galaxy S21, iPhone 13..."
                            invalid={!!errors.model}
                            {...register('model', { 
                              required: 'Модель устройства обязательна',
                              minLength: { 
                                value: 2, 
                                message: 'Минимум 2 символа' 
                              },
                              maxLength: {
                                value: 100,
                                message: 'Максимум 100 символов'
                              }
                            })}
                          />
                        </CInputGroup>
                        {errors.model && (
                          <div className="text-danger small mt-1">
                            {errors.model.message}
                          </div>
                        )}
                      </div>
                    </CCol>

                    {/* Кодовое имя устройства */}
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="device" className="fw-semibold">
                          Кодовое имя устройства <span className="text-danger">*</span>
                        </CFormLabel>
                        <CFormInput
                          id="device"
                          placeholder="SM-G991B, iPhone14,5..."
                          invalid={!!errors.device}
                          {...register('device', { 
                            required: 'Кодовое имя обязательно',
                            maxLength: {
                              value: 50,
                              message: 'Максимум 50 символов'
                            }
                          })}
                        />
                        {errors.device && (
                          <div className="text-danger small mt-1">
                            {errors.device.message}
                          </div>
                        )}
                        <div className="form-text">
                          Техническое название устройства
                        </div>
                      </div>
                    </CCol>

                    {/* Версия Android */}
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="androidVersion" className="fw-semibold">
                          Версия Android
                        </CFormLabel>
                        <CFormSelect
                          id="androidVersion"
                          {...register('androidVersion')}
                        >
                          <option value="">Выберите версию</option>
                          {androidVersions.map(version => (
                            <option key={version.value} value={version.value}>
                              {version.label}
                            </option>
                          ))}
                        </CFormSelect>
                      </div>
                    </CCol>

                    {/* Статус устройства */}
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="status" className="fw-semibold">
                          Статус устройства
                        </CFormLabel>
                        <CFormSelect
                          id="status"
                          {...register('status')}
                        >
                          {availableStatuses.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </CFormSelect>
                        {watchedStatus && (
                          <div className="mt-2">
                            <CBadge 
                              color={getStatusColor(watchedStatus)} 
                              shape="rounded-pill"
                            >
                              {getStatusLabel(watchedStatus)}
                            </CBadge>
                          </div>
                        )}
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Сетевые настройки */}
            <CCol xs={12}>
              <CCard className="mb-4 border-0 shadow-sm">
                <CCardHeader className="bg-light border-0">
                  <h6 className="mb-0 text-primary d-flex align-items-center">
                    <CIcon icon={cilGlobeAlt} className="me-2" />
                    Сетевые настройки
                  </h6>
                </CCardHeader>
                <CCardBody>
                  <CRow>
                    {/* IP адрес */}
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="ipAddress" className="fw-semibold">
                          IP адрес
                        </CFormLabel>
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon={cilGlobeAlt} />
                          </CInputGroupText>
                          <CFormInput
                            id="ipAddress"
                            placeholder="192.168.1.100"
                            invalid={!!errors.ipAddress}
                            {...register('ipAddress', {
                              pattern: {
                                value: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                                message: 'Неверный формат IP адреса'
                              }
                            })}
                          />
                        </CInputGroup>
                        {errors.ipAddress && (
                          <div className="text-danger small mt-1">
                            {errors.ipAddress.message}
                          </div>
                        )}
                      </div>
                    </CCol>

                    {/* MAC адрес */}
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="macAddress" className="fw-semibold">
                          MAC адрес
                        </CFormLabel>
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon={cilShieldAlt} />
                          </CInputGroupText>
                          <CFormInput
                            id="macAddress"
                            placeholder="AA:BB:CC:DD:EE:FF"
                            invalid={!!errors.macAddress}
                            {...register('macAddress', {
                              pattern: {
                                value: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
                                message: 'Неверный формат MAC адреса'
                              }
                            })}
                          />
                        </CInputGroup>
                        {errors.macAddress && (
                          <div className="text-danger small mt-1">
                            {errors.macAddress.message}
                          </div>
                        )}
                        <div className="form-text">
                          Формат: AA:BB:CC:DD:EE:FF
                        </div>
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Привязка к проекту и заметки */}
            <CCol xs={12}>
              <CCard className="mb-4 border-0 shadow-sm">
                <CCardHeader className="bg-light border-0">
                  <h6 className="mb-0 text-primary d-flex align-items-center">
                    <CIcon icon={cilTask} className="me-2" />
                    Дополнительная информация
                  </h6>
                </CCardHeader>
                <CCardBody>
                  <CRow>
                    {/* Проект */}
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="projectId" className="fw-semibold">
                          Проект
                        </CFormLabel>
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
                        <div className="form-text">
                          Выберите проект для привязки устройства
                        </div>
                        {projects.length === 0 && (
                          <div className="text-warning small mt-1">
                            Нет доступных проектов
                          </div>
                        )}
                      </div>
                    </CCol>

                    {/* Заметки */}
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="notes" className="fw-semibold">
                          Заметки
                        </CFormLabel>
                        <CFormTextarea
                          id="notes"
                          rows={3}
                          placeholder="Дополнительная информация об устройстве..."
                          {...register('notes', {
                            maxLength: {
                              value: 1000,
                              message: 'Максимум 1000 символов'
                            }
                          })}
                        />
                        {errors.notes && (
                          <div className="text-danger small mt-1">
                            {errors.notes.message}
                          </div>
                        )}
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>

            {/* История статусов (только при редактировании) */}
            {isEdit && phone && (
              <CCol xs={12}>
                <CAlert color="info" className="border-0">
                  <h6 className="alert-heading mb-3 d-flex align-items-center">
                    <CIcon icon={cilSettings} className="me-2" />
                    История статусов устройства
                  </h6>
                  <CRow className="small">
                    {phone.dateSetStatusFree && (
                      <CCol md={4} className="mb-2">
                        <div className="d-flex flex-column">
                          <strong className="text-success">Свободен с:</strong>
                          <span className="text-muted">
                            {new Date(phone.dateSetStatusFree).toLocaleString('ru-RU')}
                          </span>
                        </div>
                      </CCol>
                    )}
                    {phone.dateSetStatusBusy && (
                      <CCol md={4} className="mb-2">
                        <div className="d-flex flex-column">
                          <strong className="text-warning">Занят с:</strong>
                          <span className="text-muted">
                            {new Date(phone.dateSetStatusBusy).toLocaleString('ru-RU')}
                          </span>
                        </div>
                      </CCol>
                    )}
                    {phone.dateLastReboot && (
                      <CCol md={4} className="mb-2">
                        <div className="d-flex flex-column">
                          <strong className="text-info">Последняя перезагрузка:</strong>
                          <span className="text-muted">
                            {new Date(phone.dateLastReboot).toLocaleString('ru-RU')}
                          </span>
                        </div>
                      </CCol>
                    )}
                  </CRow>
                  {!phone.dateSetStatusFree && !phone.dateSetStatusBusy && !phone.dateLastReboot && (
                    <div className="text-muted">
                      <em>История статусов пока отсутствует</em>
                    </div>
                  )}
                </CAlert>
              </CCol>
            )}
          </CRow>
        </CForm>
      </CModalBody>

      <CModalFooter className="border-top">
        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="text-muted small">
            {isEdit ? (
              <span>ID устройства: #{phone?.id}</span>
            ) : (
              <span>Новое устройство будет добавлено в систему</span>
            )}
          </div>
          <div className="d-flex gap-2">
            <CButton 
              color="light" 
              onClick={handleClose}
              disabled={isLoading}
              className="px-4"
            >
              <CIcon icon={cilX} className="me-2" />
              Отмена
            </CButton>
            <CButton 
              color="primary" 
              type="submit"
              form="phone-form"
              disabled={isLoading}
              className="px-4"
            >
              {isLoading ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  {isEdit ? 'Сохранение...' : 'Добавление...'}
                </>
              ) : (
                <>
                  <CIcon icon={cilSave} className="me-2" />
                  {isEdit ? 'Сохранить изменения' : 'Добавить устройство'}
                </>
              )}
            </CButton>
          </div>
        </div>
      </CModalFooter>
    </CModal>
  )
}

PhoneFormModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  phone: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    model: PropTypes.string,
    device: PropTypes.string,
    androidVersion: PropTypes.string,
    ipAddress: PropTypes.string,
    macAddress: PropTypes.string,
    status: PropTypes.string,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    notes: PropTypes.string,
    dateSetStatusFree: PropTypes.string,
    dateSetStatusBusy: PropTypes.string,
    dateLastReboot: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string
  }),
  isEdit: PropTypes.bool
}

PhoneFormModal.defaultProps = {
  phone: null,
  isEdit: false
}

export default PhoneFormModal