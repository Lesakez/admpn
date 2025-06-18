// frontend/src/views/phones/Phones.js
import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCol,
  CRow,
  CButton,
  CInputGroup,
  CFormInput,
  CInputGroupText,
  CBadge,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CSpinner,
  CAlert,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CContainer,
  COffcanvas,
  COffcanvasHeader,
  COffcanvasTitle,
  COffcanvasBody,
  CFormCheck,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilPlus,
  cilTrash,
  cilPencil,
  cilReload,
  cilPowerStandby,
  cilSync,
  cilToggleOn,
  cilToggleOff,
  cilDevices,
  cilMenu,
  cilFilter,
  cilLayers,
  cilSettings,
  cilCloudDownload,
  cilCloudUpload,
} from '@coreui/icons'
import { 
  usePhones, 
  usePhonesStats, 
  useDeletePhone, 
  useTogglePhoneStatus,
  useRebootPhone 
} from '../../hooks/usePhones'
import { useEntityStatuses, useStatusConfig } from '../../hooks/useStatuses'
import { useModals } from '../../hooks/useModals'
import { 
  DeleteModal, 
  ConfirmModal, 
  StatusChangeModal, 
  BulkActionModal 
} from '../../components/common/modals'
import { PhoneFormModal } from '../../components/forms'
import { phonesService } from '../../services/phonesService'
import toast from 'react-hot-toast'

const Phones = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 12 })
  const [showModal, setShowModal] = useState(false)
  const [editingPhone, setEditingPhone] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPhones, setSelectedPhones] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  // Загрузка данных
  const { data, isLoading, error, refetch } = usePhones(filters)
  const { data: stats } = usePhonesStats()
  const deletePhoneMutation = useDeletePhone()
  const toggleStatusMutation = useTogglePhoneStatus()
  const rebootMutation = useRebootPhone()
  
  // Загрузка статусов динамически
  const { data: phoneStatuses, isLoading: statusesLoading } = useEntityStatuses('phone')
  const { data: statusConfig } = useStatusConfig()

  // Модальные окна
  const {
    modals,
    closeModal,
    confirmDelete,
    confirmAction,
    changeStatus,
    bulkAction
  } = useModals()

  const phones = data?.phones || []
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 }

  // === ОБРАБОТЧИКИ ФИЛЬТРОВ И НАВИГАЦИИ ===
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }))
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  // === ОБРАБОТЧИКИ ИНДИВИДУАЛЬНЫХ ДЕЙСТВИЙ ===
  const handleEdit = (phone) => {
    setEditingPhone(phone)
    setShowModal(true)
  }

  const handleDelete = (phone) => {
    confirmDelete(phone, {
      title: "Удалить устройство",
      message: "Это действие нельзя отменить. Устройство будет удалено навсегда.",
      onConfirm: async () => {
        try {
          await deletePhoneMutation.mutateAsync(phone.id)
          toast.success('Устройство успешно удалено')
          closeModal('delete')
          refetch()
        } catch (error) {
          toast.error('Ошибка при удалении устройства')
        }
      }
    })
  }

  const handleStatusChange = (phone) => {
    changeStatus(phone, 'phone', {
      onConfirm: async (newStatus, reason) => {
        try {
          await phonesService.update(phone.id, { status: newStatus })
          
          const statusDescription = statusConfig?.descriptions?.[newStatus] || newStatus
          toast.success(`Статус изменён на "${statusDescription}"`)
          closeModal('statusChange')
          refetch()
        } catch (error) {
          toast.error('Ошибка при изменении статуса')
        }
      }
    })
  }

  const handleToggleStatus = (phone) => {
    confirmAction({
      variant: 'info',
      title: 'Переключить статус',
      message: `Переключить статус устройства ${phone.device}?`,
      description: 'Статус будет изменен на противоположный',
      confirmText: 'Переключить',
      confirmColor: 'info',
      onConfirm: async () => {
        try {
          await toggleStatusMutation.mutateAsync(phone.id)
          closeModal('confirm')
          refetch()
        } catch (error) {
          toast.error('Ошибка при переключении статуса')
        }
      }
    })
  }

  const handleReboot = (phone) => {
    confirmAction({
      variant: 'warning',
      title: 'Перезагрузить устройство',
      message: `Перезагрузить устройство ${phone.device}?`,
      description: 'Это может занять несколько минут. Устройство временно станет недоступным.',
      confirmText: 'Перезагрузить',
      confirmColor: 'warning',
      onConfirm: async () => {
        try {
          await rebootMutation.mutateAsync(phone.id)
          toast.success('Команда перезагрузки отправлена')
          closeModal('confirm')
          refetch()
        } catch (error) {
          toast.error('Ошибка при перезагрузке устройства')
        }
      }
    })
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPhone(null)
  }

  // === ОБРАБОТЧИКИ ВЫБОРА ТЕЛЕФОНОВ ===
  const handleSelectPhone = (phoneId, checked) => {
    if (checked) {
      setSelectedPhones(prev => [...prev, phoneId])
    } else {
      setSelectedPhones(prev => prev.filter(id => id !== phoneId))
      setSelectAll(false)
    }
  }

  const handleSelectAll = (checked) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedPhones(phones.map(phone => phone.id))
    } else {
      setSelectedPhones([])
    }
  }

  // === МАССОВЫЕ ДЕЙСТВИЯ ===
  const handleBulkDelete = () => {
    const selectedPhonesData = phones.filter(phone => 
      selectedPhones.includes(phone.id)
    )
    
    bulkAction(selectedPhonesData, 'delete', {
      entityType: 'phone',
      onConfirm: async () => {
        try {
          await phonesService.bulkDelete(selectedPhones)
          toast.success(`Удалено ${selectedPhones.length} устройств`)
          closeModal('bulkAction')
          setSelectedPhones([])
          setSelectAll(false)
          refetch()
        } catch (error) {
          toast.error('Ошибка при массовом удалении')
        }
      }
    })
  }

  const handleBulkStatusChange = () => {
    const selectedPhonesData = phones.filter(phone => 
      selectedPhones.includes(phone.id)
    )
    
    bulkAction(selectedPhonesData, 'status_change', {
      entityType: 'phone',
      onConfirm: async (action, params) => {
        try {
          const { newStatus } = params
          
          await phonesService.bulkUpdateStatus(selectedPhones, newStatus)
          
          const statusDescription = statusConfig?.descriptions?.[newStatus] || newStatus
          toast.success(`Статус изменён для ${selectedPhones.length} устройств на "${statusDescription}"`)
          closeModal('bulkAction')
          setSelectedPhones([])
          setSelectAll(false)
          refetch()
        } catch (error) {
          toast.error('Ошибка при массовом изменении статуса')
        }
      }
    })
  }

  // === УТИЛИТАРНЫЕ ФУНКЦИИ ===
  const getStatusBadge = (status) => {
    if (!statusConfig) {
      return (
        <CBadge color="secondary" shape="rounded-pill" className="px-3 py-1">
          {status}
        </CBadge>
      )
    }

    const description = statusConfig.descriptions?.[status] || status
    const color = statusConfig.colors?.[status] || '#6b7280'
    
    const getBootstrapColor = (hexColor) => {
      const colorMap = {
        '#10b981': 'success',  // free
        '#ef4444': 'danger',   // offline/error
        '#f59e0b': 'warning',  // busy/maintenance
        '#3b82f6': 'primary',
        '#6b7280': 'secondary', // inactive
        '#059669': 'success',
        '#f97316': 'warning',
        '#8b5cf6': 'info'
      }
      return colorMap[hexColor] || 'secondary'
    }
    
    return (
      <CBadge 
        color={getBootstrapColor(color)}
        shape="rounded-pill"
        className="px-3 py-1"
      >
        {description}
      </CBadge>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusOptions = () => {
    if (!phoneStatuses) return []
    
    return Object.values(phoneStatuses).map(status => {
      const description = statusConfig?.descriptions?.[status] || status
      return { value: status, label: description }
    })
  }

  const getDeviceIcon = (model) => {
    if (!model) return '📱'
    
    const modelLower = model.toLowerCase()
    if (modelLower.includes('samsung')) return '📱'
    if (modelLower.includes('iphone') || modelLower.includes('apple')) return '📱'
    if (modelLower.includes('xiaomi') || modelLower.includes('redmi')) return '📱'
    if (modelLower.includes('huawei')) return '📱'
    if (modelLower.includes('pixel') || modelLower.includes('google')) return '📱'
    return '📱'
  }

  // === РЕНДЕР ===
  if (error) {
    return (
      <CAlert color="danger" className="m-4">
        Ошибка загрузки устройств: {error.message}
      </CAlert>
    )
  }

  return (
    <CContainer fluid className="px-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="h2 mb-2">Устройства</h1>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <span className="text-body-secondary">
              Всего: <strong className="text-body">{pagination.total}</strong>
            </span>
            {selectedPhones.length > 0 && (
              <span className="text-primary">
                Выбрано: <strong>{selectedPhones.length}</strong>
              </span>
            )}
            {stats && (
              <>
                <div className="d-flex align-items-center gap-1">
                  <div className="w-2 h-2 bg-success rounded-circle"></div>
                  <span className="small">Свободных: {stats.byStatus?.free || 0}</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <div className="w-2 h-2 bg-warning rounded-circle"></div>
                  <span className="small">Занятых: {stats.byStatus?.busy || 0}</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <div className="w-2 h-2 bg-danger rounded-circle"></div>
                  <span className="small">Оффлайн: {stats.byStatus?.offline || 0}</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="d-flex gap-2">
          {selectedPhones.length > 0 && (
            <CDropdown placement="bottom-end">
              <CDropdownToggle color="warning" size="sm">
                <CIcon icon={cilLayers} className="me-1" />
                Действия ({selectedPhones.length})
              </CDropdownToggle>
              <CDropdownMenu 
                className="shadow-lg border-0"
                style={{ 
                  minWidth: '200px',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                <CDropdownItem 
                  onClick={handleBulkStatusChange}
                  className="py-2 px-3 d-flex align-items-center"
                >
                  <CIcon icon={cilToggleOn} className="me-2 text-info" />
                  <span>Изменить статус</span>
                </CDropdownItem>
                <CDropdownItem divider />
                <CDropdownItem 
                  onClick={handleBulkDelete} 
                  className="py-2 px-3 d-flex align-items-center text-danger"
                >
                  <CIcon icon={cilTrash} className="me-2" />
                  <span>Удалить все</span>
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          )}
          
          <CButton 
            color="light" 
            variant="ghost"
            onClick={() => setShowFilters(true)}
            className="d-flex align-items-center gap-2"
          >
            <CIcon icon={cilFilter} size="sm" />
            Фильтры
          </CButton>
          
          <CButton 
            color="primary" 
            onClick={() => setShowModal(true)}
            className="d-flex align-items-center gap-2"
          >
            <CIcon icon={cilPlus} size="sm" />
            Добавить
          </CButton>
          
          <CDropdown placement="bottom-end">
            <CDropdownToggle color="light" variant="ghost">
              <CIcon icon={cilMenu} />
            </CDropdownToggle>
            <CDropdownMenu 
              className="shadow-lg border-0"
              style={{ 
                minWidth: '160px',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <CDropdownItem className="py-2 px-3 d-flex align-items-center">
                <CIcon icon={cilCloudUpload} className="me-2 text-success" />
                <span>Импорт</span>
              </CDropdownItem>
              <CDropdownItem className="py-2 px-3 d-flex align-items-center">
                <CIcon icon={cilCloudDownload} className="me-2 text-primary" />
                <span>Экспорт</span>
              </CDropdownItem>
              <CDropdownItem divider />
              <CDropdownItem className="py-2 px-3 d-flex align-items-center">
                <CIcon icon={cilSettings} className="me-2 text-secondary" />
                <span>Настройки</span>
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </div>
      </div>

      {/* Quick Search */}
      <div className="mb-4">
        <CInputGroup className="shadow-sm" style={{ maxWidth: '400px' }}>
          <CInputGroupText className="bg-body border-end-0">
            <CIcon icon={cilSearch} className="text-body-secondary" />
          </CInputGroupText>
          <CFormInput
            placeholder="Поиск устройств..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="border-start-0 bg-body"
          />
        </CInputGroup>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" style={{ width: '3rem', height: '3rem' }} />
          <div className="mt-3 text-body-secondary">Загрузка устройств...</div>
        </div>
      ) : phones.length === 0 ? (
        <div className="text-center py-5">
          <div 
            className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center text-body-secondary"
            style={{ width: '80px', height: '80px', background: 'var(--cui-tertiary-bg)' }}
          >
            <CIcon icon={cilDevices} size="2xl" />
          </div>
          <h4 className="text-body-secondary mb-2">Устройства не найдены</h4>
          <p className="text-body-secondary mb-4">
            Попробуйте изменить параметры поиска или добавьте новое устройство
          </p>
          <CButton color="primary" onClick={() => setShowModal(true)}>
            <CIcon icon={cilPlus} className="me-2" />
            Добавить первое устройство
          </CButton>
        </div>
      ) : (
        <>
          {/* Bulk Actions Bar */}
          {phones.length > 0 && (
            <div className="d-flex align-items-center justify-content-between mb-3 p-3 bg-body-tertiary rounded">
              <CFormCheck
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                label={`Выбрать все (${phones.length})`}
              />
              
              {selectedPhones.length > 0 && (
                <div className="d-flex gap-2">
                  <CButton 
                    color="outline-primary" 
                    size="sm"
                    onClick={handleBulkStatusChange}
                  >
                    <CIcon icon={cilToggleOn} className="me-1" />
                    Изменить статус
                  </CButton>
                  <CButton 
                    color="outline-danger" 
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <CIcon icon={cilTrash} className="me-1" />
                    Удалить
                  </CButton>
                </div>
              )}
            </div>
          )}

          {/* Cards Grid */}
          <CRow className="g-4">
            {phones.map((phone) => (
              <CCol key={phone.id} xs={12} sm={6} lg={4} xl={3}>
                <CCard className="h-100 shadow-sm border-0 hover-lift position-relative overflow-hidden">
                  {/* Выделение при выборе */}
                  {selectedPhones.includes(phone.id) && (
                    <div 
                      className="position-absolute top-0 start-0 w-100 h-100"
                      style={{ 
                        background: 'var(--cui-primary-bg-subtle)',
                        pointerEvents: 'none',
                        zIndex: 1,
                        opacity: 0.3
                      }}
                    />
                  )}
                  
                  <CCardBody className="p-4 position-relative" style={{ zIndex: 2 }}>
                    {/* Checkbox & Menu */}
                    <div className="d-flex align-items-start justify-content-between mb-3">
                      <CFormCheck
                        checked={selectedPhones.includes(phone.id)}
                        onChange={(e) => handleSelectPhone(phone.id, e.target.checked)}
                        className="form-check-lg"
                      />
                      
                      <CDropdown placement="bottom-end">
                        <CDropdownToggle 
                          color="light" 
                          variant="ghost"
                          size="sm"
                          className="border-0 shadow-none p-2 rounded-circle"
                          style={{ width: '32px', height: '32px' }}
                        >
                          <CIcon icon={cilMenu} size="sm" />
                        </CDropdownToggle>
                        <CDropdownMenu 
                          className="shadow-lg border-0"
                          style={{ 
                            minWidth: '200px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                          }}
                        >
                          <CDropdownItem 
                            onClick={() => handleEdit(phone)}
                            className="py-3 px-4 d-flex align-items-center border-0"
                          >
                            <CIcon icon={cilPencil} className="me-3 text-primary" />
                            <span className="fw-medium">Редактировать</span>
                          </CDropdownItem>
                          <CDropdownItem 
                            onClick={() => handleStatusChange(phone)}
                            className="py-3 px-4 d-flex align-items-center border-0"
                          >
                            <CIcon icon={cilToggleOn} className="me-3 text-info" />
                            <span className="fw-medium">Изменить статус</span>
                          </CDropdownItem>
                          <CDropdownItem 
                            onClick={() => handleToggleStatus(phone)}
                            className="py-3 px-4 d-flex align-items-center border-0"
                          >
                            <CIcon icon={cilToggleOff} className="me-3 text-warning" />
                            <span className="fw-medium">Переключить статус</span>
                          </CDropdownItem>
                          <CDropdownItem 
                            onClick={() => handleReboot(phone)}
                            className="py-3 px-4 d-flex align-items-center border-0"
                          >
                            <CIcon icon={cilPowerStandby} className="me-3 text-success" />
                            <span className="fw-medium">Перезагрузить</span>
                          </CDropdownItem>
                          <hr className="my-1 mx-3" style={{ opacity: 0.1 }} />
                          <CDropdownItem 
                            className="py-3 px-4 d-flex align-items-center text-danger border-0"
                            onClick={() => handleDelete(phone)}
                          >
                            <CIcon icon={cilTrash} className="me-3" />
                            <span className="fw-medium">Удалить</span>
                          </CDropdownItem>
                        </CDropdownMenu>
                      </CDropdown>
                    </div>

                    {/* Phone Info */}
                    <div className="mb-3">
                      <h5 className="mb-2 fw-bold text-truncate d-flex align-items-center" title={phone.device}>
                        <span className="me-2">{getDeviceIcon(phone.model)}</span>
                        {phone.device || phone.model}
                      </h5>
                      {phone.model && phone.device !== phone.model && (
                        <div className="text-body-secondary small mb-2">
                          <strong>Модель:</strong> {phone.model}
                        </div>
                      )}
                      {phone.ipAddress && (
                        <div className="text-body-secondary small">
                          <strong>IP:</strong> {phone.ipAddress}
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="mb-3">
                      {getStatusBadge(phone.status)}
                    </div>

                    {/* Meta Info */}
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="badge text-bg-secondary">
                        {phone.projectId ? `Проект #${phone.projectId}` : 'Не назначен'}
                      </span>
                      <span className="text-body-secondary small">
                        {formatDate(phone.createdAt)}
                      </span>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            ))}
          </CRow>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="d-flex justify-content-center mt-5">
              <CPagination className="shadow-sm">
                <CPaginationItem
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Назад
                </CPaginationItem>
                
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                  let page
                  if (pagination.pages <= 5) {
                    page = i + 1
                  } else {
                    const start = Math.max(1, pagination.page - 2)
                    page = Math.min(start + i, pagination.pages)
                  }
                  
                  return (
                    <CPaginationItem
                      key={page}
                      active={page === pagination.page}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </CPaginationItem>
                  )
                })}
                
                <CPaginationItem
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Далее
                </CPaginationItem>
              </CPagination>
            </div>
          )}
        </>
      )}

      {/* Filters Offcanvas */}
      <COffcanvas placement="end" visible={showFilters} onHide={() => setShowFilters(false)}>
        <COffcanvasHeader>
          <COffcanvasTitle>Фильтры</COffcanvasTitle>
        </COffcanvasHeader>
        <COffcanvasBody>
          <div className="mb-4">
            <label className="form-label fw-semibold">Статус</label>
            <CFormSelect
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              disabled={statusesLoading}
            >
              <option value="">
                {statusesLoading ? 'Загрузка...' : 'Все статусы'}
              </option>
              {getStatusOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </CFormSelect>
          </div>
          
          <div className="mb-4">
            <label className="form-label fw-semibold">Модель</label>
            <CFormSelect
              value={filters.model || ''}
              onChange={(e) => handleFilterChange('model', e.target.value)}
            >
              <option value="">Все модели</option>
              <option value="Samsung">Samsung</option>
              <option value="iPhone">iPhone</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="Huawei">Huawei</option>
              <option value="Google Pixel">Google Pixel</option>
            </CFormSelect>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Версия Android</label>
            <CFormSelect
              value={filters.androidVersion || ''}
              onChange={(e) => handleFilterChange('androidVersion', e.target.value)}
            >
              <option value="">Все версии</option>
              <option value="14">Android 14</option>
              <option value="13">Android 13</option>
              <option value="12">Android 12</option>
              <option value="11">Android 11</option>
              <option value="10">Android 10</option>
            </CFormSelect>
          </div>

          <div className="d-flex gap-2">
            <CButton 
              color="outline-secondary" 
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex-fill"
            >
              <CIcon icon={cilReload} className="me-2" />
              Обновить
            </CButton>
          </div>
        </COffcanvasBody>
      </COffcanvas>

      {/* Modals */}
      <DeleteModal
        visible={modals.delete.visible}
        onClose={() => closeModal('delete')}
        onConfirm={modals.delete.data?.onConfirm}
        isLoading={deletePhoneMutation.isLoading}
        title={modals.delete.data?.title}
        message={modals.delete.data?.message}
        itemName={modals.delete.data?.itemName}
        description={modals.delete.data?.description}
      />

      <ConfirmModal
        visible={modals.confirm.visible}
        onClose={() => closeModal('confirm')}
        onConfirm={modals.confirm.data?.onConfirm}
        isLoading={toggleStatusMutation.isLoading || rebootMutation.isLoading}
        variant={modals.confirm.data?.variant}
        title={modals.confirm.data?.title}
        message={modals.confirm.data?.message}
        description={modals.confirm.data?.description}
        confirmText={modals.confirm.data?.confirmText}
        confirmColor={modals.confirm.data?.confirmColor}
      />

      <StatusChangeModal
        visible={modals.statusChange.visible}
        onClose={() => closeModal('statusChange')}
        onConfirm={modals.statusChange.data?.onConfirm}
        isLoading={false}
        entityType={modals.statusChange.data?.entityType}
        currentStatus={modals.statusChange.data?.currentStatus}
        itemName={modals.statusChange.data?.itemName}
        title={modals.statusChange.data?.title}
      />

      <BulkActionModal
        visible={modals.bulkAction.visible}
        onClose={() => closeModal('bulkAction')}
        onConfirm={modals.bulkAction.data?.onConfirm}
        isLoading={false}
        selectedItems={modals.bulkAction.data?.selectedItems || []}
        action={modals.bulkAction.data?.action}
        entityType={modals.bulkAction.data?.entityType}
      />

      {/* Phone Form Modal */}
      <PhoneFormModal
        visible={showModal}
        onClose={handleCloseModal}
        phone={editingPhone}
        isEdit={!!editingPhone}
      />

      <style jsx>{`
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
        }
        .w-2 { width: 8px; }
        .h-2 { height: 8px; }
        
        .form-check-lg .form-check-input {
          width: 1.2em;
          height: 1.2em;
        }
        
        .dropdown-item:hover {
          transform: translateX(2px);
          transition: all 0.2s ease;
        }
        
        .card {
          border: 1px solid var(--cui-border-color-translucent) !important;
        }
        
        .dropdown-menu {
          border: 1px solid var(--cui-border-color-translucent);
          backdrop-filter: blur(10px);
        }
        
        /* Улучшенные тени для обеих тем */
        .hover-lift:hover {
          box-shadow: 0 8px 25px var(--cui-box-shadow-color, rgba(0,0,0,0.15)) !important;
        }
        
        /* Улучшенная видимость для светлой темы */
        [data-coreui-theme="light"] .text-body-secondary {
          color: var(--cui-secondary-color) !important;
        }
        
        [data-coreui-theme="light"] .dropdown-toggle {
          background: var(--cui-tertiary-bg) !important;
        }
      `}</style>
    </CContainer>
  )
}

export default Phones