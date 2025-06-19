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
  console.log('Initial filters:', filters);
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  // Загрузка данных
  const { data, isLoading, error, refetch } = useAccounts(filters)
  console.log('Accounts data:', data);
  console.log('Accounts isLoading:', isLoading);
  console.log('Accounts error:', error);
  const { data: stats } = useAccountsStats()
  console.log('Accounts stats:', stats);
  const deleteAccountMutation = useDeleteAccount()
  const updateAccountMutation = useUpdateAccount()
  const bulkDeleteMutation = useBulkDeleteAccounts()
  
  // Загрузка статусов динамически
  const { data: accountStatuses, isLoading: statusesLoading } = useEntityStatuses('account')
  console.log('Account statuses:', accountStatuses);
  console.log('Statuses loading:', statusesLoading);
  const { data: statusConfig } = useStatusConfig()
  console.log('Status config:', statusConfig);

  // Модальные окна
  const {
    modals,
    closeModal,
    confirmDelete,
    changeStatus,
    bulkAction
  } = useModals()
  console.log('Modals state:', modals);

  const accounts = data?.accounts || []
  console.log('Processed accounts array:', accounts);
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 }
  console.log('Pagination data:', pagination);

  // === ОБРАБОТЧИКИ ===
  const handleFilterChange = (key, value) => {
    console.log(`Filter change - key: ${key}, value: ${value}, current filters:`, filters);
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }))
  }

  const handlePageChange = (page) => {
    console.log(`Page change to: ${page}, current filters:`, filters);
    setFilters(prev => ({ ...prev, page }))
  }

  const handleEdit = (account) => {
    console.log('Edit account:', account);
    setEditingAccount(account)
    setShowModal(true)
  }

  const handleDelete = (account) => {
    console.log('Delete account:', account);
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
          console.error('Delete error:', error);
          toast.error('Ошибка при удалении аккаунта')
        }
      }
    })
  }

  const handleStatusChange = (account) => {
    console.log('Status change for account:', account);
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
          console.error('Status change error:', error);
          toast.error('Ошибка при изменении статуса')
        }
      }
    })
  }

  const handleCloseModal = () => {
    console.log('Closing modal, editingAccount:', editingAccount);
    setShowModal(false)
    setEditingAccount(null)
  }

  const handleSelectAccount = (accountId, checked) => {
    console.log(`Select account - id: ${accountId}, checked: ${checked}, selectedAccounts:`, selectedAccounts);
    if (checked) {
      setSelectedAccounts(prev => [...prev, accountId])
    } else {
      setSelectedAccounts(prev => prev.filter(id => id !== accountId))
      setSelectAll(false)
    }
  }

  const handleSelectAll = (checked) => {
    console.log(`Select all - checked: ${checked}, accounts length: ${accounts.length}`);
    setSelectAll(checked)
    if (checked) {
      setSelectedAccounts(accounts.map(account => account.id))
    } else {
      setSelectedAccounts([])
    }
  }

  const handleBulkDelete = () => {
    console.log('Bulk delete, selectedAccounts:', selectedAccounts);
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
          console.error('Bulk delete error:', error);
          toast.error('Ошибка при массовом удалении')
        }
      }
    })
  }

  const handleBulkStatusChange = () => {
    console.log('Bulk status change, selectedAccounts:', selectedAccounts);
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
          console.error('Bulk status change error:', error);
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
    console.log('Render error state:', error);
    return (
      <CAlert color="danger" className="m-4">
        Ошибка загрузки аккаунтов: {error.message}
      </CAlert>
    )
  }

  return (
    <CContainer fluid className="px-2 py-2"> {/* Уменьшено с px-4 py-3 */}
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
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
              <CDropdownToggle color="warning" size="sm" className="epic-btn epic-btn--primary">
                <CIcon icon={cilLayers} className="me-1" />
                Действия ({selectedAccounts.length})
              </CDropdownToggle>
              <CDropdownMenu className="shadow-lg border-0">
                <CDropdownItem onClick={handleBulkStatusChange} className="py-2 px-3 d-flex align-items-center">
                  <CIcon icon={cilSwapHorizontal} className="me-2 text-info" />
                  <span>Изменить статус</span>
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem onClick={handleBulkDelete} className="py-2 px-3 d-flex align-items-center text-danger">
                  <CIcon icon={cilTrash} className="me-2" />
                  <span>Удалить все</span>
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          )}
          
          <CButton 
            color="light" 
            variant="outline"
            onClick={() => setShowFilters(true)}
            className="epic-btn epic-btn--secondary"
          >
            <CIcon icon={cilFilter} size="sm" className="me-2" />
            Фильтры
          </CButton>
          
          <CButton 
            color="primary" 
            onClick={() => setShowModal(true)}
            className="epic-btn epic-btn--primary"
          >
            <CIcon icon={cilUserPlus} size="sm" className="me-2" />
            Создать
          </CButton>
          
          <CDropdown placement="bottom-end">
            <CDropdownToggle color="light" variant="outline" className="epic-btn epic-btn--secondary">
              <CIcon icon={cilMenu} />
            </CDropdownToggle>
            <CDropdownMenu className="shadow-lg border-0">
              <CDropdownItem className="py-2 px-3 d-flex align-items-center">
                <CIcon icon={cilCloudUpload} className="me-2 text-success" />
                <span>Импорт</span>
              </CDropdownItem>
              <CDropdownItem className="py-2 px-3 d-flex align-items-center">
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

      {/* Quick Search */}
      <div className="mb-4">
        <CInputGroup className="compact-form__group shadow-sm" style={{ maxWidth: '400px' }}>
          <CInputGroupText className="bg-body border-end-0">
            <CIcon icon={cilSearch} className="text-body-secondary" />
          </CInputGroupText>
          <CFormInput
            placeholder="Поиск аккаунтов..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="compact-form__input border-start-0"
          />
        </CInputGroup>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="epic-loading">
          <div className="epic-loading__content">
            <CSpinner color="primary" className="epic-loading__spinner" style={{ width: '3rem', height: '3rem' }} />
            <div className="epic-loading__text">Загрузка аккаунтов...</div>
            <div className="epic-loading__subtext">Это может занять несколько секунд</div>
          </div>
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
          <CButton color="primary" onClick={() => setShowModal(true)} className="epic-btn epic-btn--primary">
            <CIcon icon={cilUserPlus} className="me-2" />
            Создать первый аккаунт
          </CButton>
        </div>
      ) : (
        <>
          {/* Bulk Actions Bar */}
          {accounts.length > 0 && (
            <div className="d-flex align-items-center justify-content-between mb-4 p-3 bg-body-tertiary rounded">
              <CFormCheck
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                label={`Выбрать все (${accounts.length})`}
                className="form-check-lg"
              />
              
              {selectedAccounts.length > 0 && (
                <div className="d-flex gap-2">
                  <CButton 
                    color="outline-primary" 
                    size="sm"
                    onClick={handleBulkStatusChange}
                    className="epic-btn epic-btn--secondary"
                  >
                    <CIcon icon={cilSwapHorizontal} className="me-1" />
                    Изменить статус
                  </CButton>
                  <CButton 
                    color="outline-danger" 
                    size="sm"
                    onClick={handleBulkDelete}
                    className="epic-btn epic-btn--danger"
                  >
                    <CIcon icon={cilTrash} className="me-1" />
                    Удалить
                  </CButton>
                </div>
              )}
            </div>
          )}

          {/* Table */}
          <CCard className="modern-table">
            <CCardBody>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col" style={{ width: '50px' }}>
                      <CFormCheck
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" style={{ width: '150px' }}>Логин</CTableHeaderCell>
                    <CTableHeaderCell scope="col" style={{ width: '200px', whiteSpace: 'nowrap' }}>Email</CTableHeaderCell>
                    <CTableHeaderCell scope="col" style={{ width: '120px' }}>ID</CTableHeaderCell>
                    <CTableHeaderCell scope="col" style={{ width: '150px' }}>Статус</CTableHeaderCell>
                    <CTableHeaderCell scope="col" style={{ width: '150px' }}>Источник</CTableHeaderCell>
                    <CTableHeaderCell scope="col" style={{ width: '120px' }}>Создан</CTableHeaderCell>
                    <CTableHeaderCell scope="col" style={{ width: '120px' }}>Действия</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {accounts.map((account) => (
                    <CTableRow key={account.id} className="animate-slide-in-up">
                      <CTableDataCell>
                        <CFormCheck
                          checked={selectedAccounts.includes(account.id)}
                          onChange={(e) => handleSelectAccount(account.id, e.target.checked)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{account.login}</CTableDataCell>
                      <CTableDataCell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {account.email || '-'}
                      </CTableDataCell>
                      <CTableDataCell>{account.userId || '-'}</CTableDataCell>
                      <CTableDataCell>{getStatusBadge(account.status)}</CTableDataCell>
                      <CTableDataCell>{account.source || 'manual'}</CTableDataCell>
                      <CTableDataCell>{formatDate(account.createdAt)}</CTableDataCell>
                      <CTableDataCell>
                        <CDropdown placement="bottom-end">
                          <CDropdownToggle
                            color="light"
                            variant="ghost"
                            size="sm"
                            className="epic-btn epic-btn--secondary"
                          >
                            <CIcon icon={cilMenu} size="sm" />
                          </CDropdownToggle>
                          <CDropdownMenu className="shadow-lg border-0">
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
            </CCardBody>
          </CCard>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="d-flex justify-content-center mt-5">
              <CPagination className="shadow-sm">
                <CPaginationItem
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="epic-btn epic-btn--secondary"
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
                      className="epic-btn epic-btn--secondary"
                    >
                      {page}
                    </CPaginationItem>
                  )
                })}
                
                <CPaginationItem
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="epic-btn epic-btn--secondary"
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
          <div className="compact-form">
            <div className="compact-form__row">
              <div className="compact-form__group">
                <label className="compact-form__label">Статус</label>
                <CFormSelect
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  disabled={statusesLoading}
                  className="compact-form__select"
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
            </div>
            
            <div className="compact-form__row">
              <div className="compact-form__group">
                <label className="compact-form__label">Источник</label>
                <CFormSelect
                  value={filters.source || ''}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                  className="compact-form__select"
                >
                  <option value="">Все источники</option>
                  <option value="manual">Ручное создание</option>
                  <option value="import">Импорт</option>
                  <option value="registration">Регистрация</option>
                  <option value="api">API</option>
                </CFormSelect>
              </div>
            </div>

            <div className="d-flex gap-2">
              <CButton 
                color="outline-secondary" 
                onClick={() => refetch()}
                disabled={isLoading}
                className="epic-btn epic-btn--secondary flex-fill"
              >
                <CIcon icon={cilReload} className="me-2" />
                Обновить
              </CButton>
            </div>
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
        className="simple-modal"
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
        className="simple-modal"
      />

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

      <AccountFormModal
        visible={showModal}
        onClose={handleCloseModal}
        account={editingAccount}
        isEdit={!!editingAccount}
        className="simple-modal"
      />
    </CContainer>
  )
}

export default Accounts