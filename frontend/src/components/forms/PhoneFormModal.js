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
  cilDevices,
  cilSettings,
  cilTask,
  cilPeople,
  cilBell,
  cilUser,
} from '@coreui/icons'
import { useForm } from 'react-hook-form'
import { useCreatePhone, useUpdatePhone } from '../../hooks/usePhones'
import { useProjects } from '../../hooks/useProjects'

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
  } = useForm({
    defaultValues: {
      model: phone?.model || '',
      device: phone?.device || '',
      androidVersion: phone?.androidVersion || '',
      ipAddress: phone?.ipAddress || '',
      macAddress: phone?.macAddress || '',
      status: phone?.status || 'free',
      projectId: phone?.projectId || '',
      notes: phone?.notes || '',
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

  const getStatusDescription = (status) => {
    const descriptions = {
      free: 'Устройство готово к использованию',
      busy: 'Устройство в работе',
      disabled: 'Устройство отключено'
    }
    return descriptions[status] || ''
  }

  return (
    <CModal 
      visible={visible} 
      onClose={handleClose} 
      size="lg"
      className="phone-modal"
      backdrop="static"
    >
      <CModalHeader className="border-bottom-0 pb-2">
        <div className="d-flex align-items-center">
          <div className="me-3">
            <div className="avatar avatar-lg bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center">
              <CIcon icon={cilDevices} size="lg" />
            </div>
          </div>
          <div>
            <CModalTitle className="mb-1">
              {isEdit ? `Редактировать устройство` : 'Добавить новое устройство'}
            </CModalTitle>
            {isEdit && (
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">{phone?.model} • {phone?.device}</span>
                <CBadge color={getStatusColor(phone?.status)} shape="rounded-pill">
                  {phone?.status}
                </CBadge>
              </div>
            )}
          </div>
        </div>
      </CModalHeader>
      
      <CForm onSubmit={handleSubmit(onSubmit)} className="h-100">
        <CModalBody className="pt-2">
          <CRow>
            {/* Основная информация */}
            <CCol xs={12}>
              <CCard className="mb-4 border-0 bg-light">
                <CCardHeader className="bg-transparent border-0 pb-0">
                  <h6 className="mb-0 text-primary">
                    <CIcon icon={cilDevices} className="me-2" />
                    Основная информация
                  </h6>
                </CCardHeader>
                <CCardBody>
                  <CRow>
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
                              minLength: { value: 2, message: 'Минимум 2 символа' }
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
                            required: 'Кодовое имя обязательно'
                          })}
                        />
                        {errors.device && (
                          <div className="text-danger small mt-1">
                            {errors.device.message}
                          </div>
                        )}
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="androidVersion" className="fw-semibold">Версия Android</CFormLabel>
                        <CFormSelect
                          id="androidVersion"
                          {...register('androidVersion')}
                        >
                          <option value="">Выберите версию</option>
                          <option value="14">Android 14</option>
                          <option value="13">Android 13</option>
                          <option value="12">Android 12</option>
                          <option value="11">Android 11</option>
                          <option value="10">Android 10</option>
                          <option value="9">Android 9</option>
                          <option value="8.1">Android 8.1</option>
                          <option value="8.0">Android 8.0</option>
                        </CFormSelect>
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="status" className="fw-semibold">Статус устройства</CFormLabel>
                        <CFormSelect 
                          id="status" 
                          {...register('status')}
                          className="form-select-custom"
                        >
                          <option value="free">🟢 Свободен</option>
                          <option value="busy">🟡 Занят</option>
                          <option value="disabled">🔴 Отключен</option>
                        </CFormSelect>
                        <div className="form-text">
                          <CIcon icon={cilBell} className="me-1" />
                          {getStatusDescription(watchedStatus)}
                        </div>
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Сетевые настройки */}
            <CCol xs={12}>
              <CCard className="mb-4 border-0 bg-light">
                <CCardHeader className="bg-transparent border-0 pb-0">
                  <h6 className="mb-0 text-success">
                    <CIcon icon={cilSettings} className="me-2" />
                    Сетевые настройки
                  </h6>
                </CCardHeader>
                <CCardBody>
                  <CRow>
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="ipAddress" className="fw-semibold">IP адрес</CFormLabel>
                        <CInputGroup>
                          <CInputGroupText>
                            <CIcon icon={cilSettings} />
                          </CInputGroupText>
                          <CFormInput
                            id="ipAddress"
                            placeholder="192.168.1.100"
                            invalid={!!errors.ipAddress}
                            {...register('ipAddress', {
                              pattern: {
                                value: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                                message: 'Некорректный IP адрес'
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

                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="macAddress" className="fw-semibold">MAC адрес</CFormLabel>
                        <CFormInput
                          id="macAddress"
                          placeholder="00:1B:44:11:3A:B7"
                          invalid={!!errors.macAddress}
                          {...register('macAddress', {
                            pattern: {
                              value: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
                              message: 'Формат должен быть XX:XX:XX:XX:XX:XX'
                            }
                          })}
                        />
                        {errors.macAddress && (
                          <div className="text-danger small mt-1">
                            {errors.macAddress.message}
                          </div>
                        )}
                        <div className="form-text">Используйте формат XX:XX:XX:XX:XX:XX</div>
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Управление проектами */}
            <CCol xs={12}>
              <CCard className="mb-4 border-0 bg-light">
                <CCardHeader className="bg-transparent border-0 pb-0">
                  <h6 className="mb-0 text-warning">
                    <CIcon icon={cilPeople} className="me-2" />
                    Привязка к проекту
                  </h6>
                </CCardHeader>
                <CCardBody>
                  <CRow>
                    <CCol md={6}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="projectId" className="fw-semibold">Проект</CFormLabel>
                        <CFormSelect id="projectId" {...register('projectId')}>
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
                      </div>
                    </CCol>

                    <CCol xs={12}>
                      <div className="mb-3">
                        <CFormLabel htmlFor="notes" className="fw-semibold">Заметки</CFormLabel>
                        <CFormTextarea
                          id="notes"
                          rows={3}
                          placeholder="Дополнительная информация об устройстве..."
                          {...register('notes')}
                        />
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Информация о статусах (только при редактировании) */}
            {isEdit && (
              <CCol xs={12}>
                <CAlert color="info" className="border-0">
                  <h6 className="alert-heading mb-2">История статусов</h6>
                  <CRow className="small">
                    {phone?.dateSetStatusFree && (
                      <CCol md={4}>
                        <strong>Свободен с:</strong><br />
                        {new Date(phone.dateSetStatusFree).toLocaleString('ru-RU')}
                      </CCol>
                    )}
                    {phone?.dateSetStatusBusy && (
                      <CCol md={4}>
                        <strong>Занят с:</strong><br />
                        {new Date(phone.dateSetStatusBusy).toLocaleString('ru-RU')}
                      </CCol>
                    )}
                    {phone?.dateLastReboot && (
                      <CCol md={4}>
                        <strong>Последняя перезагрузка:</strong><br />
                        {new Date(phone.dateLastReboot).toLocaleString('ru-RU')}
                      </CCol>
                    )}
                  </CRow>
                </CAlert>
              </CCol>
            )}
          </CRow>
        </CModalBody>

        <CModalFooter className="border-top-0 pt-2">
          <div className="d-flex justify-content-between w-100">
            <div className="d-flex align-items-center text-muted small">
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
                    {isEdit ? 'Сохранение...' : 'Добавление...'}
                  </>
                ) : (
                  <>
                    <CIcon icon={cilTask} className="me-2" />
                    {isEdit ? 'Сохранить' : 'Добавить'}
                  </>
                )}
              </CButton>
            </div>
          </div>
        </CModalFooter>
      </CForm>

      <style jsx>{`
        .phone-modal .modal-content {
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
          .phone-modal .modal-content {
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

export default PhoneFormModal