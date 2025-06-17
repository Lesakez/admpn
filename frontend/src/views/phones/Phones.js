import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CInputGroup,
  CFormInput,
  CInputGroupText,
  CBadge,
  CButtonGroup,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CSpinner,
  CAlert,
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
} from '@coreui/icons'
import { 
  usePhones, 
  usePhonesStats, 
  useDeletePhone, 
  useTogglePhoneStatus,
  useRebootPhone 
} from '../../hooks/usePhones'
import { PhoneFormModal } from '../../components/forms'

const Phones = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 20 })
  const [showModal, setShowModal] = useState(false)
  const [editingPhone, setEditingPhone] = useState(null)

  // Загрузка данных
  const { data, isLoading, error, refetch } = usePhones(filters)
  const { data: stats } = usePhonesStats()
  const deleteMutation = useDeletePhone()
  const toggleStatusMutation = useTogglePhoneStatus()
  const rebootMutation = useRebootPhone()

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

  const handleDelete = async (id) => {
    if (window.confirm('Удалить устройство?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleToggleStatus = async (id) => {
    await toggleStatusMutation.mutateAsync(id)
  }

  const handleReboot = async (id) => {
    if (window.confirm('Перезагрузить устройство? Это может занять несколько минут.')) {
      await rebootMutation.mutateAsync(id)
    }
  }

  const handleCreate = () => {
    setEditingPhone(null)
    setShowModal(true)
  }

  const handleEdit = (phone) => {
    setEditingPhone(phone)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPhone(null)
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      free: 'success',
      busy: 'warning',
      inactive: 'secondary',
      maintenance: 'dark',
      offline: 'danger',
      rebooting: 'info',
      error: 'danger',
    }
    return <CBadge color={statusColors[status] || 'secondary'}>{status}</CBadge>
  }

  const phones = data?.phones || []
  const pagination = data?.pagination || {}

  if (error) {
    return (
      <CAlert color="danger">
        Ошибка загрузки данных: {error.message}
        <CButton color="link" onClick={() => refetch()}>
          Попробовать снова
        </CButton>
      </CAlert>
    )
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">Устройства</h4>
                  {stats && (
                    <small className="text-muted">
                      Всего: {stats.total || 0}
                      {stats.byStatus && Object.entries(stats.byStatus).map(([status, count]) => (
                        <span key={status} className="ms-3">
                          {status}: {count}
                        </span>
                      ))}
                    </small>
                  )}
                </div>
                <div>
                  <CButtonGroup>
                    <CButton
                      color="outline-secondary"
                      onClick={() => refetch()}
                      disabled={isLoading}
                    >
                      <CIcon icon={cilReload} className={isLoading ? 'spin' : ''} />
                    </CButton>
                    <CButton color="primary" onClick={handleCreate}>
                      <CIcon icon={cilPlus} /> Добавить устройство
                    </CButton>
                  </CButtonGroup>
                </div>
              </div>
            </CCardHeader>
            <CCardBody>
              {/* Фильтры */}
              <CRow className="mb-3">
                <CCol md={4}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Поиск по модели, устройству или IP..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Все статусы</option>
                    <option value="free">free</option>
                    <option value="busy">busy</option>
                    <option value="inactive">inactive</option>
                    <option value="maintenance">maintenance</option>
                    <option value="offline">offline</option>
                    <option value="rebooting">rebooting</option>
                    <option value="error">error</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={filters.projectId || ''}
                    onChange={(e) => handleFilterChange('projectId', e.target.value)}
                  >
                    <option value="">Все проекты</option>
                    {/* Здесь можно добавить список проектов */}
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* Таблица */}
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Модель/Устройство</CTableHeaderCell>
                    <CTableHeaderCell>Android</CTableHeaderCell>
                    <CTableHeaderCell>IP/MAC</CTableHeaderCell>
                    <CTableHeaderCell>Статус</CTableHeaderCell>
                    <CTableHeaderCell>Проект</CTableHeaderCell>
                    <CTableHeaderCell>Последняя перезагрузка</CTableHeaderCell>
                    <CTableHeaderCell>Действия</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {isLoading ? (
                    <CTableRow>
                      <CTableDataCell colSpan="7" className="text-center">
                        <CSpinner /> Загрузка...
                      </CTableDataCell>
                    </CTableRow>
                  ) : phones.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="7" className="text-center">
                        Данные не найдены
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    phones.map((phone) => (
                      <CTableRow key={phone.id}>
                        <CTableDataCell>
                          <div>
                            <strong>{phone.model || phone.device || 'Неизвестно'}</strong>
                            {phone.device && phone.model && phone.device !== phone.model && (
                              <div className="small text-muted">{phone.device}</div>
                            )}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          {phone.androidVersion ? (
                            <CBadge color="info">Android {phone.androidVersion}</CBadge>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div>
                            {phone.ipAddress && (
                              <div><strong>IP:</strong> {phone.ipAddress}</div>
                            )}
                            {phone.macAddress && (
                              <div className="small text-muted">MAC: {phone.macAddress}</div>
                            )}
                            {!phone.ipAddress && !phone.macAddress && (
                              <span className="text-muted">-</span>
                            )}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>{getStatusBadge(phone.status)}</CTableDataCell>
                        <CTableDataCell>
                          {phone.project ? phone.project.name : <span className="text-muted">Без проекта</span>}
                        </CTableDataCell>
                        <CTableDataCell>
                          {phone.dateLastReboot ? (
                            <div>
                              <div>{new Date(phone.dateLastReboot).toLocaleDateString('ru-RU')}</div>
                              <div className="small text-muted">
                                {new Date(phone.dateLastReboot).toLocaleTimeString('ru-RU')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButtonGroup size="sm">
                            <CButton 
                              color={phone.status === 'free' ? 'outline-warning' : 'outline-success'} 
                              variant="ghost"
                              onClick={() => handleToggleStatus(phone.id)}
                              disabled={toggleStatusMutation.isLoading || phone.status === 'rebooting'}
                              title={phone.status === 'free' ? 'Занять' : 'Освободить'}
                            >
                              <CIcon icon={phone.status === 'free' ? cilToggleOff : cilToggleOn} />
                            </CButton>
                            <CButton 
                              color="outline-info" 
                              variant="ghost"
                              onClick={() => handleReboot(phone.id)}
                              disabled={rebootMutation.isLoading || phone.status === 'rebooting'}
                              title="Перезагрузить"
                            >
                              <CIcon icon={phone.status === 'rebooting' ? cilSync : cilPowerStandby} 
                                     className={phone.status === 'rebooting' ? 'spin' : ''} />
                            </CButton>
                            <CButton 
                              color="outline-primary" 
                              variant="ghost" 
                              title="Редактировать"
                              onClick={() => handleEdit(phone)}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                            <CButton 
                              color="outline-danger" 
                              variant="ghost"
                              onClick={() => handleDelete(phone.id)}
                              disabled={deleteMutation.isLoading}
                              title="Удалить"
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CButtonGroup>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              {/* Пагинация */}
              {pagination.pages > 1 && (
                <CPagination className="justify-content-center">
                  <CPaginationItem
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Назад
                  </CPaginationItem>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <CPaginationItem
                      key={page}
                      active={page === pagination.page}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </CPaginationItem>
                  ))}
                  <CPaginationItem
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Далее
                  </CPaginationItem>
                </CPagination>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Модальное окно формы */}
      <PhoneFormModal
        visible={showModal}
        onClose={handleCloseModal}
        phone={editingPhone}
        isEdit={!!editingPhone}
      />
    </>
  )
}

export default Phones