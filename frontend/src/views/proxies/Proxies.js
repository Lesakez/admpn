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
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilPlus,
  cilTrash,
  cilPencil,
  cilReload,
  cilCloudDownload,
  cilCloudUpload,
  cilOptions,
  cilMediaPlay,
  cilSync, // Используем cilSync вместо cilRefresh
} from '@coreui/icons'
import { 
  useProxies, 
  useProxiesStats, 
  useDeleteProxy, 
  useToggleProxyStatus,
  useChangeProxyIP 
} from '../../hooks/useProxies'

const Proxies = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 20 })

  // Загрузка данных
  const { data, isLoading, error, refetch } = useProxies(filters)
  const { data: stats } = useProxiesStats()
  const deleteMutation = useDeleteProxy()
  const toggleStatusMutation = useToggleProxyStatus()
  const changeIPMutation = useChangeProxyIP()

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
    if (window.confirm('Удалить прокси?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleToggleStatus = async (id) => {
    await toggleStatusMutation.mutateAsync(id)
  }

  const handleChangeIP = async (id) => {
    if (window.confirm('Сменить IP для этого прокси?')) {
      await changeIPMutation.mutateAsync(id)
    }
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      free: 'success',
      busy: 'warning',
      inactive: 'secondary',
      banned: 'danger',
      checking: 'info',
      error: 'danger',
      maintenance: 'warning',
    }
    return <CBadge color={statusColors[status] || 'secondary'}>{status}</CBadge>
  }

  const getTypeBadge = (type) => {
    const typeColors = {
      http: 'info',
      https: 'success',
      socks4: 'warning',
      socks5: 'primary',
    }
    return <CBadge color={typeColors[type] || 'secondary'}>{type || 'http'}</CBadge>
  }

  const proxies = data?.proxies || []
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
                  <h4 className="mb-0">Прокси</h4>
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
                      <CIcon icon={cilPlus} /> Создать прокси
                    </CButton>
                  </CButtonGroup>
                </div>
              </div>
            </CCardHeader>
            <CCardBody>
              {/* Фильтры */}
              <CRow className="mb-3">
                <CCol md={3}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Поиск по IP, логину или стране..."
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
                    <option value="banned">banned</option>
                    <option value="checking">checking</option>
                    <option value="error">error</option>
                    <option value="maintenance">maintenance</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={filters.type || ''}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option value="">Все типы</option>
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                    <option value="socks4">SOCKS4</option>
                    <option value="socks5">SOCKS5</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormInput
                    placeholder="Страна"
                    value={filters.country || ''}
                    onChange={(e) => handleFilterChange('country', e.target.value)}
                  />
                </CCol>
              </CRow>

              {/* Таблица */}
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>IP:Port</CTableHeaderCell>
                    <CTableHeaderCell>Тип</CTableHeaderCell>
                    <CTableHeaderCell>Логин</CTableHeaderCell>
                    <CTableHeaderCell>Страна</CTableHeaderCell>
                    <CTableHeaderCell>Статус</CTableHeaderCell>
                    <CTableHeaderCell>Проект</CTableHeaderCell>
                    <CTableHeaderCell>Последняя смена IP</CTableHeaderCell>
                    <CTableHeaderCell>Действия</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {isLoading ? (
                    <CTableRow>
                      <CTableDataCell colSpan="8" className="text-center">
                        <CSpinner /> Загрузка...
                      </CTableDataCell>
                    </CTableRow>
                  ) : proxies.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="8" className="text-center">
                        Данные не найдены
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    proxies.map((proxy) => (
                      <CTableRow key={proxy.id}>
                        <CTableDataCell>
                          <code className="text-dark">{proxy.ipPort}</code>
                        </CTableDataCell>
                        <CTableDataCell>
                          {getTypeBadge(proxy.type)}
                        </CTableDataCell>
                        <CTableDataCell>{proxy.login || '-'}</CTableDataCell>
                        <CTableDataCell>
                          {proxy.country ? (
                            <span className="badge bg-light text-dark">{proxy.country}</span>
                          ) : '-'}
                        </CTableDataCell>
                        <CTableDataCell>{getStatusBadge(proxy.status)}</CTableDataCell>
                        <CTableDataCell>{proxy.project?.name || '-'}</CTableDataCell>
                        <CTableDataCell>
                          {proxy.dateLastChangeIp ? 
                            new Date(proxy.dateLastChangeIp).toLocaleString('ru-RU') : '-'}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButtonGroup size="sm">
                            <CButton color="outline-primary" variant="ghost">
                              <CIcon icon={cilPencil} />
                            </CButton>
                            <CButton 
                              color="outline-success" 
                              variant="ghost"
                              onClick={() => handleToggleStatus(proxy.id)}
                              disabled={toggleStatusMutation.isLoading}
                              title="Переключить статус"
                            >
                              <CIcon icon={cilMediaPlay} />
                            </CButton>
                            <CDropdown>
                              <CDropdownToggle color="outline-secondary" variant="ghost" size="sm">
                                <CIcon icon={cilOptions} />
                              </CDropdownToggle>
                              <CDropdownMenu>
                                <CDropdownItem 
                                  onClick={() => handleChangeIP(proxy.id)}
                                  disabled={changeIPMutation.isLoading}
                                >
                                  <CIcon icon={cilSync} className="me-2" />
                                  Сменить IP
                                </CDropdownItem>
                                <CDropdownItem divider />
                                <CDropdownItem 
                                  onClick={() => handleDelete(proxy.id)}
                                  disabled={deleteMutation.isLoading}
                                  className="text-danger"
                                >
                                  <CIcon icon={cilTrash} className="me-2" />
                                  Удалить
                                </CDropdownItem>
                              </CDropdownMenu>
                            </CDropdown>
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

export default Proxies