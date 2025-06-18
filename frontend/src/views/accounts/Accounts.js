// frontend/src/views/accounts/Accounts.js
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
  ConfirmModal, 
  StatusChangeModal, 
  BulkActionModal 
} from '../../components/common/modals'
import { AccountFormModal } from '../../components/forms'
import { accountsService } from '../../services/accountsService'
import toast from 'react-hot-toast'

const Accounts = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 12 })
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  // Загрузка данных
  const { data, isLoading, error, refetch } = useAccounts(filters)
  const { data: stats } = useAccountsStats()
  const deleteAccountMutation = useDeleteAccount()
  const updateAccountMutation = useUpdateAccount()
  const bulkDeleteMutation = useBulkDeleteAccounts()
  
  // Загрузка статусов динамически
  const { data: accountStatuses, isLoading: statusesLoading } = useEntityStatuses('account')
  const { data: statusConfig } = useStatusConfig()

  // Модальные окна
  const {
    modals,
    closeModal,
    confirmDelete,
    changeStatus,
    bulkAction
  } = useModals()

  const accounts = data?.accounts || []
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

  // === ОБРАБОТЧИКИ ВЫБОРА АККАУНТОВ ===
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

  // === МАССОВЫЕ ДЕЙСТВИЯ ===
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
          
          // Используем сервис для массового изменения статуса
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
        '#10b981': 'success',
        '#ef4444': 'danger', 
        '#f59e0b': 'warning',
        '#3b82f6': 'primary',
        '#6b7280': 'secondary',
        '#059669': 'success',
        '#f97316': 'warning',
        '#8b5cf6': 'info'
      }
      return colorMap[hexColor] || 'secondary'
    }

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
      return icons[status] || cilX
    }
    
    return (
      <CBadge 
        color={getBootstrapColor(color)}
        shape="rounded-pill"
        className="d-inline-flex align-items-center gap-1 px-3 py-1"
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
    if (!accountStatuses) return []
    
    return Object.values(accountStatuses).map(status => {
      const description = statusConfig?.descriptions?.[status] || status
      return { value: status, label: description }
    })
  }

  // === РЕНДЕР ===
  if (error) {
    return (
      <CAlert color="danger" className="m-4">
        Ошибка загрузки аккаунтов: {error.message}
      </CAlert>
    )
  }

  return (
    <CContainer fluid className="px-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="h2 mb-2">Аккаунты</h1>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <span className="text-body-secondary">
              Всего: <strong className="text-body">{pagination.total}</strong>
            </span>
            {selectedAccounts.length > 0 && (
              <span className="text-primary">
                Выбрано: <strong>{selectedAccounts.length}</strong>
              </span>
            )}
            {stats && (
              <>
                <div className="d-flex align-items-center gap-1">
                  <div className="w-2 h-2 bg-success rounded-circle"></div>
                  <span className="small">Активных: {stats.byStatus?.active || 0}</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <div className="w-2 h-2 bg-warning rounded-circle"></div>
                  <span className="small">В работе: {stats.byStatus?.working || 0}</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <div className="w-2 h-2 bg-danger rounded-circle"></div>
                  <span className="small">Заблокированных: {stats.byStatus?.banned || 0}</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="d-flex gap-2">
          {selectedAccounts.length > 0 && (
            <CDropdown placement="bottom-end">
              <CDropdownToggle color="warning" size="sm">
                <CIcon icon={cilLayers} className="me-1" />
                Действия ({selectedAccounts.length})
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
                  <CIcon icon={cilSwapHorizontal} className="me-2 text-info" />
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
            <CIcon icon={cilUserPlus} size="sm" />
            Создать
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
            placeholder="Поиск аккаунтов..."
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
          <div className="mt-3 text-body-secondary">Загрузка аккаунтов...</div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-5">
          <div 
            className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center text-body-secondary"
            style={{ width: '80px', height: '80px', background: 'var(--cui-tertiary-bg)' }}
          >
            <CIcon icon={cilUser} size="2xl" />
          </div>
          <h4 className="text-body-secondary mb-2">Аккаунты не найдены</h4>
          <p className="text-body-secondary mb-4">
            Попробуйте изменить параметры поиска или создайте новый аккаунт
          </p>
          <CButton color="primary" onClick={() => setShowModal(true)}>
            <CIcon icon={cilUserPlus} className="me-2" />
            Создать первый аккаунт
          </CButton>
        </div>
      ) : (
        <>
          {/* Bulk Actions Bar */}
          {accounts.length > 0 && (
            <div className="d-flex align-items-center justify-content-between mb-3 p-3 bg-body-tertiary rounded">
              <CFormCheck
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                label={`Выбрать все (${accounts.length})`}
              />
              
              {selectedAccounts.length > 0 && (
                <div className="d-flex gap-2">
                  <CButton 
                    color="outline-primary" 
                    size="sm"
                    onClick={handleBulkStatusChange}
                  >
                    <CIcon icon={cilSwapHorizontal} className="me-1" />
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
            {accounts.map((account) => (
              <CCol key={account.id} xs={12} sm={6} lg={4} xl={3}>
                <CCard className="h-100 shadow-sm border-0 hover-lift position-relative overflow-hidden">
                  {/* Выделение при выборе */}
                  {selectedAccounts.includes(account.id) && (
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
                        checked={selectedAccounts.includes(account.id)}
                        onChange={(e) => handleSelectAccount(account.id, e.target.checked)}
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
                            minWidth: '180px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                          }}
                        >
                          <CDropdownItem 
                            onClick={() => handleEdit(account)}
                            className="py-3 px-4 d-flex align-items-center border-0"
                            style={{ transition: 'background-color 0.2s' }}
                          >
                            <CIcon icon={cilPencil} className="me-3 text-primary" />
                            <span className="fw-medium">Редактировать</span>
                          </CDropdownItem>
                          <CDropdownItem 
                            onClick={() => handleStatusChange(account)}
                            className="py-3 px-4 d-flex align-items-center border-0"
                          >
                            <CIcon icon={cilSwapHorizontal} className="me-3 text-info" />
                            <span className="fw-medium">Изменить статус</span>
                          </CDropdownItem>
                          <hr className="my-1 mx-3" style={{ opacity: 0.1 }} />
                          <CDropdownItem 
                            className="py-3 px-4 d-flex align-items-center text-danger border-0"
                            onClick={() => handleDelete(account)}
                          >
                            <CIcon icon={cilTrash} className="me-3" />
                            <span className="fw-medium">Удалить</span>
                          </CDropdownItem>
                        </CDropdownMenu>
                      </CDropdown>
                    </div>

                    {/* Account Info */}
                    <div className="mb-3">
                      <h5 className="mb-2 fw-bold text-truncate" title={account.login}>
                        {account.login}
                      </h5>
                      {account.email && (
                        <div className="d-flex align-items-center text-body-secondary mb-2">
                          <CIcon icon={cilEnvelopeClosed} size="sm" className="me-2 opacity-75" />
                          <span className="text-truncate small" title={account.email}>
                            {account.email}
                          </span>
                        </div>
                      )}
                      {account.userId && (
                        <div className="text-body-secondary small mb-2">
                          <strong>ID:</strong> {account.userId}
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="mb-3">
                      {getStatusBadge(account.status)}
                    </div>

                    {/* Meta Info */}
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="badge text-bg-secondary">
                        {account.source || 'manual'}
                      </span>
                      <span className="text-body-secondary small">
                        {formatDate(account.createdAt)}
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
            <label className="form-label fw-semibold">Источник</label>
            <CFormSelect
              value={filters.source || ''}
              onChange={(e) => handleFilterChange('source', e.target.value)}
            >
              <option value="">Все источники</option>
              <option value="manual">Ручное создание</option>
              <option value="import">Импорт</option>
              <option value="registration">Регистрация</option>
              <option value="api">API</option>
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
        isLoading={deleteAccountMutation.isLoading}
        title={modals.delete.data?.title}
        message={modals.delete.data?.message}
        itemName={modals.delete.data?.itemName}
        description={modals.delete.data?.description}
      />

      <StatusChangeModal
        visible={modals.statusChange.visible}
        onClose={() => closeModal('statusChange')}
        onConfirm={modals.statusChange.data?.onConfirm}
        isLoading={updateAccountMutation.isLoading}
        entityType={modals.statusChange.data?.entityType}
        currentStatus={modals.statusChange.data?.currentStatus}
        itemName={modals.statusChange.data?.itemName}
        title={modals.statusChange.data?.title}
      />

      <BulkActionModal
        visible={modals.bulkAction.visible}
        onClose={() => closeModal('bulkAction')}
        onConfirm={modals.bulkAction.data?.onConfirm}
        isLoading={bulkDeleteMutation.isLoading}
        selectedItems={modals.bulkAction.data?.selectedItems || []}
        action={modals.bulkAction.data?.action}
        entityType={modals.bulkAction.data?.entityType}
      />

      {/* Account Form Modal */}
      <AccountFormModal
        visible={showModal}
        onClose={handleCloseModal}
        account={editingAccount}
        isEdit={!!editingAccount}
      />

      <style jsx>{`
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
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
        
        /* Используем CSS переменные CoreUI для совместимости с темами */
        .card {
          border: 1px solid var(--cui-border-color-translucent) !important;
        }
        
        .dropdown-menu {
          border: 1px solid var(--cui-border-color-translucent);
          backdrop-filter: blur(10px);
        }
        
        /* Улучшенные тени в зависимости от темы */
        [data-coreui-theme="dark"] .hover-lift:hover {
          box-shadow: 0 12px 40px rgba(0,0,0,0.4) !important;
        }
        
        [data-coreui-theme="light"] .hover-lift:hover {
          box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important;
        }
      `}</style>
    </CContainer>
  )
}

export default Accounts