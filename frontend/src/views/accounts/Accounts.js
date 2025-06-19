// frontend/src/views/accounts/Accounts.js
import React, { useState } from 'react'
import './Accounts.scss'
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
  CDropdownDivider,
  CContainer,
  COffcanvas,
  COffcanvasHeader,
  COffcanvasTitle,
  COffcanvasBody,
  CFormCheck,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButtonGroup,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilUserPlus,
  cilTrash,
  cilPencil,
  cilReload,
  cilSettings,
  cilCloudDownload,
  cilCloudUpload,
  cilMenu,
  cilUser,
  cilEnvelopeClosed,
  cilFilter,
  cilX,
  cilCheck,
  cilBan,
  cilClock,
  cilSwapHorizontal,
  cilLayers,
  cilEyedropper,
  cilInfo,
} from '@coreui/icons'
import { 
  useAccounts, 
  useDeleteAccount, 
  useAccountsStats, 
  useUpdateAccount, 
  useBulkDeleteAccounts 
} from '../../hooks/useAccounts'
import { useEntityStatuses, useStatusConfig } from '../../hooks/useStatuses'
import { useModals } from '../../hooks/useModals'
import { 
  DeleteModal, 
  StatusChangeModal, 
  BulkActionModal 
} from '../../components/common/modals'
import { AccountFormModal } from '../../components/forms'
import ImportExportModal from '../../components/modals/ImportExportModal'
import { useImportExportModal } from '../../hooks/useImportExportModal'
import { accountsService } from '../../services/accountsService'
import toast from 'react-hot-toast'

const Accounts = () => {
  // Состояние компонента
  const [filters, setFilters] = useState({ page: 1, limit: 12 })
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  // Хуки для данных
  const { data, isLoading, error, refetch } = useAccounts(filters)
  const { data: stats } = useAccountsStats()
  const deleteAccountMutation = useDeleteAccount()
  const updateAccountMutation = useUpdateAccount()
  const bulkDeleteMutation = useBulkDeleteAccounts()
  
  // Хуки для статусов
  const { data: statusesResponse, isLoading: statusesLoading } = useEntityStatuses('account')
  const { data: statusConfig } = useStatusConfig()

  // Хуки для модальных окон
  const { modals, closeModal, confirmDelete, changeStatus, bulkAction } = useModals()
  const { modalState, openImport, openExport, close: closeImportExport } = useImportExportModal()

  // Обработанные данные
  const accounts = data?.accounts || []
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 }

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

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

  const handleEdit = (account) => {
    setEditingAccount(account)
    setShowModal(true)
  }

  const handleDelete = (account) => {
    confirmDelete(account, {
      title: "Удалить аккаунт",
      message: "Это действие нельзя отменить. Все данные аккаунта будут потеряны.",
      onConfirm: async () => {
        try {
          await deleteAccountMutation.mutateAsync(account.id)
          toast.success('Аккаунт успешно удалён')
          closeModal('delete')
          refetch()
        } catch (error) {
          toast.error('Ошибка при удалении аккаунта')
        }
      }
    })
  }

  const handleStatusChange = (account) => {
    changeStatus(account, 'account', {
      onConfirm: async (newStatus, reason) => {
        try {
          await updateAccountMutation.mutateAsync({
            id: account.id,
            data: { status: newStatus }
          })
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

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAccount(null)
  }

  const handleSelectAccount = (accountId, checked) => {
    if (checked) {
      setSelectedAccounts(prev => [...prev, accountId])
    } else {
      setSelectedAccounts(prev => prev.filter(id => id !== accountId))
      setSelectAll(false)
    }
  }

  const handleSelectAll = (checked) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedAccounts(accounts.map(account => account.id))
    } else {
      setSelectedAccounts([])
    }
  }

  const handleBulkDelete = () => {
    const selectedAccountsData = accounts.filter(account => 
      selectedAccounts.includes(account.id)
    )
    bulkAction(selectedAccountsData, 'delete', {
      entityType: 'account',
      onConfirm: async () => {
        try {
          await bulkDeleteMutation.mutateAsync(selectedAccounts)
          toast.success(`Удалено ${selectedAccounts.length} аккаунтов`)
          closeModal('bulkAction')
          setSelectedAccounts([])
          setSelectAll(false)
          refetch()
        } catch (error) {
          toast.error('Ошибка при массовом удалении')
        }
      }
    })
  }

  const handleBulkStatusChange = () => {
    const selectedAccountsData = accounts.filter(account => 
      selectedAccounts.includes(account.id)
    )
    bulkAction(selectedAccountsData, 'status_change', {
      entityType: 'account',
      onConfirm: async (action, params) => {
        try {
          const { newStatus } = params
          await accountsService.bulkUpdateStatus(selectedAccounts, newStatus)
          const statusDescription = statusConfig?.descriptions?.[newStatus] || newStatus
          toast.success(`Статус изменён для ${selectedAccounts.length} аккаунтов на "${statusDescription}"`)
          closeModal('bulkAction')
          setSelectedAccounts([])
          setSelectAll(false)
          refetch()
        } catch (error) {
          toast.error('Ошибка при массовом изменении статуса')
        }
      }
    })
  }

  const handleImportExportSuccess = (result, mode, type) => {
    if (mode === 'import') {
      refetch() // Обновляем данные после импорта
    }
  }

  // ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

  const getStatusBadge = (status) => {
    const description = statusConfig?.descriptions?.[status] || status
    
    const getStatusIcon = (status) => {
      const icons = {
        'active': cilCheck,
        'inactive': cilX,
        'banned': cilBan,
        'working': cilClock,
        'free': cilCheck,
        'busy': cilClock,
        'pending': cilClock,
        'suspended': cilBan,
        'verified': cilCheck,
        'unverified': cilX
      }
      return icons[status] || cilEyedropper
    }
    
    const getStatusColor = (status) => {
      const colors = {
        'active': 'success',
        'inactive': 'secondary',
        'banned': 'danger',
        'working': 'primary',
        'free': 'success',
        'busy': 'warning',
        'pending': 'warning',
        'suspended': 'danger',
        'verified': 'success',
        'unverified': 'secondary'
      }
      return colors[status] || 'secondary'
    }
    
    return (
      <CBadge 
        color={getStatusColor(status)}
        shape="rounded-pill"
        className="d-inline-flex align-items-center gap-1 px-2 py-1 small fw-medium"
      >
        <CIcon icon={getStatusIcon(status)} size="sm" />
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
    if (!statusesResponse?.data) return []
    
    const statuses = statusesResponse.data.statuses || statusesResponse.data
    
    if (Array.isArray(statuses)) {
      return statuses
    }
    
    if (typeof statuses === 'object') {
      return Object.values(statuses)
    }
    
    return ['active', 'inactive', 'blocked', 'suspended']
  }

  // ===== РЕНДЕР =====

  if (error) {
    return (
      <CContainer fluid className="px-4 py-3">
        <CAlert color="danger" className="d-flex align-items-center">
          <CIcon icon={cilInfo} className="me-2" />
          <div>
            <h6 className="alert-heading mb-1">Ошибка загрузки</h6>
            <div className="small">{error.message}</div>
          </div>
        </CAlert>
      </CContainer>
    )
  }

  return (
    <CContainer fluid className="px-4 py-3">
      {/* ===== ЗАГОЛОВОК И СТАТИСТИКА ===== */}
      <CRow className="mb-4">
        <CCol>
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <h1 className="h3 mb-0 fw-bold text-body-emphasis">Аккаунты</h1>
                <CBadge color="primary" shape="rounded-pill" className="px-2 py-1">
                  {pagination.total}
                </CBadge>
              </div>
              
              <div className="d-flex align-items-center gap-4 flex-wrap">
                {selectedAccounts.length > 0 && (
                  <div className="d-flex align-items-center gap-1 text-primary">
                    <CIcon icon={cilCheck} size="sm" />
                    <span className="fw-medium">Выбрано: {selectedAccounts.length}</span>
                  </div>
                )}
                
                {stats && (
                  <div className="d-flex align-items-center gap-4">
                    <div className="d-flex align-items-center gap-1">
                      <div className="rounded-circle bg-success" style={{ width: '8px', height: '8px' }}></div>
                      <span className="text-muted small">Активных: <span className="fw-medium">{stats.byStatus?.active || 0}</span></span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <div className="rounded-circle bg-warning" style={{ width: '8px', height: '8px' }}></div>
                      <span className="text-muted small">В работе: <span className="fw-medium">{stats.byStatus?.working || 0}</span></span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <div className="rounded-circle bg-danger" style={{ width: '8px', height: '8px' }}></div>
                      <span className="text-muted small">Заблокированных: <span className="fw-medium">{stats.byStatus?.banned || 0}</span></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* ===== КНОПКИ ДЕЙСТВИЙ ===== */}
            <div className="d-flex gap-2 flex-wrap">
              {selectedAccounts.length > 0 && (
                <CDropdown placement="bottom-end">
                  <CDropdownToggle 
                    color="warning" 
                    variant="outline"
                    className="d-flex align-items-center gap-2 border-2 fw-medium"
                  >
                    <CIcon icon={cilLayers} size="sm" />
                    Действия ({selectedAccounts.length})
                  </CDropdownToggle>
                  <CDropdownMenu className="shadow border-0" style={{ minWidth: '200px' }}>
                    <CDropdownItem 
                      onClick={handleBulkStatusChange} 
                      className="py-2 px-3 d-flex align-items-center"
                    >
                      <CIcon icon={cilSwapHorizontal} className="me-2 text-info" />
                      <span>Изменить статус</span>
                    </CDropdownItem>
                    <CDropdownDivider />
                    <CDropdownItem 
                      onClick={handleBulkDelete} 
                      className="py-2 px-3 d-flex align-items-center text-danger"
                    >
                      <CIcon icon={cilTrash} className="me-2" />
                      <span>Удалить выбранные</span>
                    </CDropdownItem>
                  </CDropdownMenu>
                </CDropdown>
              )}
              
              <CButton 
                color="light" 
                variant="outline"
                onClick={() => setShowFilters(true)}
                className="d-flex align-items-center gap-2 border-2"
              >
                <CIcon icon={cilFilter} size="sm" />
                Фильтры
              </CButton>
              
              <CButton 
                color="primary" 
                onClick={() => setShowModal(true)}
                className="d-flex align-items-center gap-2 fw-medium px-3"
              >
                <CIcon icon={cilUserPlus} size="sm" />
                Создать
              </CButton>
              
              <CDropdown placement="bottom-end">
                <CDropdownToggle 
                  color="light" 
                  variant="outline" 
                  className="border-2 px-3"
                >
                  <CIcon icon={cilMenu} />
                </CDropdownToggle>
                <CDropdownMenu className="shadow border-0" style={{ minWidth: '180px' }}>
                  <CDropdownItem 
                    onClick={() => openImport('accounts')}
                    className="py-2 px-3 d-flex align-items-center"
                  >
                    <CIcon icon={cilCloudUpload} className="me-2 text-success" />
                    <span>Импорт</span>
                  </CDropdownItem>
                  <CDropdownItem 
                    onClick={() => openExport('accounts')}
                    className="py-2 px-3 d-flex align-items-center"
                  >
                    <CIcon icon={cilCloudDownload} className="me-2 text-primary" />
                    <span>Экспорт</span>
                  </CDropdownItem>
                  <CDropdownDivider />
                  <CDropdownItem className="py-2 px-3 d-flex align-items-center">
                    <CIcon icon={cilSettings} className="me-2 text-secondary" />
                    <span>Настройки</span>
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </div>
          </div>
        </CCol>
      </CRow>

      {/* ===== ПОИСК ===== */}
      <CRow className="mb-4">
        <CCol lg={6}>
          <CInputGroup className="shadow-sm">
            <CInputGroupText className="bg-white border-end-0">
              <CIcon icon={cilSearch} className="text-muted" />
            </CInputGroupText>
            <CFormInput
              placeholder="Поиск по логину, email или ID..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="border-start-0 bg-white"
            />
          </CInputGroup>
        </CCol>
      </CRow>

      {/* ===== КОНТЕНТ ===== */}
      {isLoading ? (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5">
            <CSpinner color="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
            <h5 className="text-muted mb-2">Загрузка аккаунтов...</h5>
            <p className="text-muted small mb-0">Это может занять несколько секунд</p>
          </CCardBody>
        </CCard>
      ) : accounts.length === 0 ? (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center py-5">
            <div 
              className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center text-muted"
              style={{ width: '80px', height: '80px', backgroundColor: 'var(--cui-gray-100)' }}
            >
              <CIcon icon={cilUser} size="2xl" />
            </div>
            <h4 className="text-muted mb-2">Аккаунты не найдены</h4>
            <p className="text-muted mb-4">
              {filters.search ? 'Попробуйте изменить параметры поиска' : 'Создайте первый аккаунт для начала работы'}
            </p>
            <CButton 
              color="primary" 
              onClick={() => setShowModal(true)}
              className="d-flex align-items-center gap-2 mx-auto fw-medium"
            >
              <CIcon icon={cilUserPlus} />
              Создать аккаунт
            </CButton>
          </CCardBody>
        </CCard>
      ) : (
        <>
          {/* ===== ПАНЕЛЬ МАССОВОГО ВЫБОРА ===== */}
          {accounts.length > 0 && (
            <CCard className="border-0 shadow-sm mb-4">
              <CCardBody className="py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <CFormCheck
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    label={`Выбрать все аккаунты (${accounts.length})`}
                    className="fw-medium"
                  />
                  
                  {selectedAccounts.length > 0 && (
                    <CButtonGroup size="sm">
                      <CButton 
                        color="outline-primary" 
                        onClick={handleBulkStatusChange}
                        className="d-flex align-items-center gap-1"
                      >
                        <CIcon icon={cilSwapHorizontal} size="sm" />
                        Статус
                      </CButton>
                      <CButton 
                        color="outline-danger" 
                        onClick={handleBulkDelete}
                        className="d-flex align-items-center gap-1"
                      >
                        <CIcon icon={cilTrash} size="sm" />
                        Удалить
                      </CButton>
                    </CButtonGroup>
                  )}
                </div>
              </CCardBody>
            </CCard>
          )}

          {/* ===== ОСНОВНАЯ ТАБЛИЦА ===== */}
          <CCard className="border-0 shadow-sm">
            <CCardBody className="p-0">
              <div className="table-responsive">
                <CTable hover className="mb-0">
                  <CTableHead className="bg-light">
                    <CTableRow>
                      <CTableHeaderCell scope="col" className="border-bottom-0 ps-4" style={{ width: '50px' }}>
                        <CFormCheck
                          checked={selectAll}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </CTableHeaderCell>
                      <CTableHeaderCell scope="col" className="border-bottom-0 fw-semibold">Аккаунт</CTableHeaderCell>
                      <CTableHeaderCell scope="col" className="border-bottom-0 fw-semibold">Email</CTableHeaderCell>
                      <CTableHeaderCell scope="col" className="border-bottom-0 fw-semibold">ID</CTableHeaderCell>
                      <CTableHeaderCell scope="col" className="border-bottom-0 fw-semibold">Статус</CTableHeaderCell>
                      <CTableHeaderCell scope="col" className="border-bottom-0 fw-semibold">Источник</CTableHeaderCell>
                      <CTableHeaderCell scope="col" className="border-bottom-0 fw-semibold">Создан</CTableHeaderCell>
                      <CTableHeaderCell scope="col" className="border-bottom-0 pe-4" style={{ width: '100px' }}>
                        <span className="fw-semibold">Действия</span>
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {accounts.map((account, index) => (
                      <CTableRow 
                        key={account.id} 
                        className="border-bottom"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <CTableDataCell className="ps-4">
                          <CFormCheck
                            checked={selectedAccounts.includes(account.id)}
                            onChange={(e) => handleSelectAccount(account.id, e.target.checked)}
                          />
                        </CTableDataCell>
                        
                        <CTableDataCell>
                          <div className="text-truncate">
                            <div className="fw-medium text-body-emphasis">{account.login}</div>
                            {account.nameProfiles && (
                              <div className="small text-muted">{account.nameProfiles}</div>
                            )}
                          </div>
                        </CTableDataCell>
                        
                        <CTableDataCell>
                          <div className="text-truncate" style={{ maxWidth: '200px' }}>
                            {account.email ? (
                              <div className="d-flex align-items-center gap-1">
                                <CIcon icon={cilEnvelopeClosed} size="sm" className="text-muted" />
                                <span className="small">{account.email}</span>
                              </div>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </div>
                        </CTableDataCell>
                        
                        <CTableDataCell>
                          {account.userId ? (
                            <code className="small px-2 py-1 rounded">
                              {account.userId}
                            </code>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </CTableDataCell>
                        
                        <CTableDataCell>
                          {getStatusBadge(account.status)}
                        </CTableDataCell>
                        
                        <CTableDataCell>
                          <CBadge color="secondary" className="small">
                            {account.source === 'manual' && 'Ручное'}
                            {account.source === 'import' && 'Импорт'}
                            {account.source === 'registration' && 'Регистрация'}
                            {account.source === 'api' && 'API'}
                            {!account.source && 'Ручное'}
                          </CBadge>
                        </CTableDataCell>
                        
                        <CTableDataCell>
                          <span className="small text-muted">
                            {formatDate(account.createdAt)}
                          </span>
                        </CTableDataCell>
                        
                        <CTableDataCell className="pe-4">
                          <CDropdown placement="bottom-end">
                            <CDropdownToggle
                              color="light"
                              variant="ghost"
                              size="sm"
                              className="border-0"
                            >
                              <CIcon icon={cilMenu} size="sm" />
                            </CDropdownToggle>
                            <CDropdownMenu className="shadow border-0">
                              <CDropdownItem
                                onClick={() => handleEdit(account)}
                                className="py-2 px-3 d-flex align-items-center"
                              >
                                <CIcon icon={cilPencil} className="me-2 text-primary" />
                                <span>Редактировать</span>
                              </CDropdownItem>
                              <CDropdownItem
                                onClick={() => handleStatusChange(account)}
                                className="py-2 px-3 d-flex align-items-center"
                              >
                                <CIcon icon={cilSwapHorizontal} className="me-2 text-info" />
                                <span>Изменить статус</span>
                              </CDropdownItem>
                              <CDropdownDivider />
                              <CDropdownItem
                                onClick={() => handleDelete(account)}
                                className="py-2 px-3 d-flex align-items-center text-danger"
                              >
                                <CIcon icon={cilTrash} className="me-2" />
                                <span>Удалить</span>
                              </CDropdownItem>
                            </CDropdownMenu>
                          </CDropdown>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>
            </CCardBody>
          </CCard>

          {/* ===== ПАГИНАЦИЯ ===== */}
          {pagination.pages > 1 && (
            <div className="d-flex justify-content-center mt-4">
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

      {/* ===== ОФФКАНВАС ФИЛЬТРОВ ===== */}
      <COffcanvas placement="end" visible={showFilters} onHide={() => setShowFilters(false)}>
        <COffcanvasHeader className="border-bottom">
          <COffcanvasTitle className="fw-semibold">Фильтры аккаунтов</COffcanvasTitle>
        </COffcanvasHeader>
        <COffcanvasBody>
          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label fw-medium mb-2">Статус</label>
              <CFormSelect
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                disabled={statusesLoading}
              >
                <option value="">
                  {statusesLoading ? 'Загрузка...' : 'Все статусы'}
                </option>
                {getStatusOptions().map(status => {
                  const description = statusConfig?.descriptions?.[status] || status
                  return (
                    <option key={status} value={status}>
                      {description}
                    </option>
                  )
                })}
              </CFormSelect>
            </div>
            
            <div>
              <label className="form-label fw-medium mb-2">Источник</label>
              <CFormSelect
                value={filters.source || ''}
                onChange={(e) => handleFilterChange('source', e.target.value)}
              >
                <option value="">Все источники</option>
                <option value="manual">Ручное создание</option>
                <option value="import">Импорт</option>
                <option value="registration">Регистрация</option>
              </CFormSelect>
            </div>

            <hr />

            <CButton 
              color="outline-secondary" 
              onClick={() => refetch()}
              disabled={isLoading}
              className="d-flex align-items-center justify-content-center gap-2"
            >
              <CIcon icon={cilReload} size="sm" />
              Обновить данные
            </CButton>
          </div>
        </COffcanvasBody>
      </COffcanvas>

      {/* ===== МОДАЛЬНЫЕ ОКНА ===== */}
      
      {/* Модалка удаления */}
      <DeleteModal
        visible={modals.delete.visible}
        onClose={() => closeModal('delete')}
        onConfirm={modals.delete.data?.onConfirm}
        isLoading={deleteAccountMutation.isLoading}
        title={modals.delete.data?.title}
        message={modals.delete.data?.message}
        itemName={modals.delete.data?.itemName}
        description={modals.delete.data?.description}
        className="simple-modal"
      />

      {/* Модалка изменения статуса */}
      <StatusChangeModal
        visible={modals.statusChange.visible}
        onClose={() => closeModal('statusChange')}
        onConfirm={modals.statusChange.data?.onConfirm}
        isLoading={updateAccountMutation.isLoading}
        entityType={modals.statusChange.data?.entityType}
        currentStatus={modals.statusChange.data?.currentStatus}
        itemName={modals.statusChange.data?.itemName}
        title={modals.statusChange.data?.title}
        className="simple-modal"
      />

      {/* Модалка массовых действий */}
      <BulkActionModal
        visible={modals.bulkAction.visible}
        onClose={() => closeModal('bulkAction')}
        onConfirm={modals.bulkAction.data?.onConfirm}
        isLoading={bulkDeleteMutation.isLoading}
        selectedItems={modals.bulkAction.data?.selectedItems || []}
        action={modals.bulkAction.data?.action}
        entityType={modals.bulkAction.data?.entityType}
        className="simple-modal"
      />

      {/* Модалка создания/редактирования аккаунта */}
      <AccountFormModal
        visible={showModal}
        onClose={handleCloseModal}
        account={editingAccount}
        isEdit={!!editingAccount}
        className="simple-modal"
      />

      {/* Модалка импорта/экспорта - используем уже созданную универсальную систему */}
      <ImportExportModal
        visible={modalState.visible}
        type={modalState.type}
        mode={modalState.mode}
        onClose={closeImportExport}
        onSuccess={handleImportExportSuccess}
      />
    </CContainer>
  )
}

export default Accounts