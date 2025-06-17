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
  cilUserPlus,
  cilTrash,
  cilPencil,
  cilReload,
  cilCloudDownload,
  cilCloudUpload,
} from '@coreui/icons'
import { useAccounts, useAccountsStats, useDeleteAccount } from '../../hooks/useAccounts'

const Accounts = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 20 })
  const [selectedIds, setSelectedIds] = useState([])

  // Загрузка данных
  const { data, isLoading, error, refetch } = useAccounts(filters)
  const { data: stats } = useAccountsStats()
  const deleteMutation = useDeleteAccount()

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Сбрасываем на первую страницу при изменении фильтров
    }))
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleDelete = async (id) => {
    if (window.confirm('Удалить аккаунт?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'success',
      inactive: 'secondary',
      banned: 'danger',
      working: 'warning',
      free: 'success',
      busy: 'warning',
    }
    return <CBadge color={statusColors[status] || 'secondary'}>{status}</CBadge>
  }

  const accounts = data?.accounts || []
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
                  <h4 className="mb-0">Аккаунты</h4>
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
                    <CButton color="outline-primary">
                      <CIcon icon={cilCloudUpload} /> Импорт
                    </CButton>
                    <CButton color="outline-success">
                      <CIcon icon={cilCloudDownload} /> Экспорт
                    </CButton>
                    <CButton color="primary">
                      <CIcon icon={cilUserPlus} /> Создать аккаунт
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
                      placeholder="Поиск по логину, email или user ID..."
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
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="banned">banned</option>
                    <option value="working">working</option>
                    <option value="free">free</option>
                    <option value="busy">busy</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={filters.source || ''}
                    onChange={(e) => handleFilterChange('source', e.target.value)}
                  >
                    <option value="">Все источники</option>
                    <option value="manual">manual</option>
                    <option value="import">import</option>
                    <option value="registration">registration</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* Таблица */}
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Логин</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Статус</CTableHeaderCell>
                    <CTableHeaderCell>Источник</CTableHeaderCell>
                    <CTableHeaderCell>Создан</CTableHeaderCell>
                    <CTableHeaderCell>Действия</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {isLoading ? (
                    <CTableRow>
                      <CTableDataCell colSpan="6" className="text-center">
                        <CSpinner /> Загрузка...
                      </CTableDataCell>
                    </CTableRow>
                  ) : accounts.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="6" className="text-center">
                        Данные не найдены
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    accounts.map((account) => (
                      <CTableRow key={account.id}>
                        <CTableDataCell>
                          <strong>{account.login}</strong>
                          {account.userId && (
                            <div className="small text-muted">ID: {account.userId}</div>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>{account.email || '-'}</CTableDataCell>
                        <CTableDataCell>{getStatusBadge(account.status)}</CTableDataCell>
                        <CTableDataCell>{account.source || 'manual'}</CTableDataCell>
                        <CTableDataCell>
                          {account.createdAt ? new Date(account.createdAt).toLocaleDateString('ru-RU') : '-'}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButtonGroup size="sm">
                            <CButton color="outline-primary" variant="ghost">
                              <CIcon icon={cilPencil} />
                            </CButton>
                            <CButton 
                              color="outline-danger" 
                              variant="ghost"
                              onClick={() => handleDelete(account.id)}
                              disabled={deleteMutation.isLoading}
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
    </>
  )
}

export default Accounts