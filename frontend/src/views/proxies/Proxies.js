// frontend/src/views/proxies/Proxies.js
import React, { useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CDropdown,
  CDropdownDivider,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  COffcanvas,
  COffcanvasBody,
  COffcanvasHeader,
  COffcanvasTitle,
  CPagination,
  CPaginationItem,
  CRow,
  CSpinner,
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CButtonGroup,
  CTooltip
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilPlus,
  cilTrash,
  cilPencil,
  cilReload,
  cilGlobeAlt,
  cilFilter,
  cilLayers,
  cilToggleOn,
  cilWarning
} from '@coreui/icons'
import { useProxies, useDeleteProxy, useBulkDeleteProxies } from '../../hooks/useProxies'
import { useProjects } from '../../hooks/useProjects'
import { ProxyFormModal } from '../../components/forms'

const Proxies = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 12 })
  const [showModal, setShowModal] = useState(false)
  const [editingProxy, setEditingProxy] = useState(null)
  const [selectedProxies, setSelectedProxies] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  
  // Модалки удаления
  const [deleteModal, setDeleteModal] = useState({ visible: false, proxy: null })
  const [bulkDeleteModal, setBulkDeleteModal] = useState({ visible: false })

  // Загрузка данных
  const { data, isLoading, error, refetch } = useProxies(filters)
  const { data: projectsData } = useProjects()
  const deleteMutation = useDeleteProxy()
  const bulkDeleteMutation = useBulkDeleteProxies()

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

  // Удаление одного прокси
  const handleDeleteClick = (proxy) => {
    setDeleteModal({ visible: true, proxy })
  }

  const handleDeleteConfirm = async () => {
    if (deleteModal.proxy) {
      try {
        await deleteMutation.mutateAsync(deleteModal.proxy.id)
        setDeleteModal({ visible: false, proxy: null })
        setSelectedProxies(prev => prev.filter(id => id !== deleteModal.proxy.id))
      } catch (error) {
        console.error('Delete error:', error)
      }
    }
  }

  // Массовое удаление
  const handleBulkDeleteClick = () => {
    setBulkDeleteModal({ visible: true })
  }

  const handleBulkDeleteConfirm = async () => {
    try {
      await bulkDeleteMutation.mutateAsync(selectedProxies)
      setBulkDeleteModal({ visible: false })
      setSelectedProxies([])
    } catch (error) {
      console.error('Bulk delete error:', error)
    }
  }

  const handleEdit = (proxy) => {
    setEditingProxy(proxy)
    setShowModal(true)
  }

  const handleCreate = () => {
    setEditingProxy(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProxy(null)
  }

  // Выбор прокси
  const handleSelectProxy = (proxyId) => {
    setSelectedProxies(prev => 
      prev.includes(proxyId) 
        ? prev.filter(id => id !== proxyId)
        : [...prev, proxyId]
    )
  }

  const handleSelectAll = () => {
    setSelectedProxies(prev => 
      prev.length === proxies.length ? [] : proxies.map(p => p.id)
    )
  }

  const proxies = data?.proxies || []
  const pagination = data?.pagination || {}
  const projects = projectsData?.projects || []

  const isAllSelected = proxies.length > 0 && selectedProxies.length === proxies.length
  const isPartiallySelected = selectedProxies.length > 0 && selectedProxies.length < proxies.length

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
      {/* Header */}
      <CRow className="mb-4">
        <CCol>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">Прокси</h4>
              <p className="text-body-secondary mb-0">
                Управление прокси-серверами
              </p>
            </div>
            
            <div className="d-flex gap-2">
              {selectedProxies.length > 0 && (
                <>
                  <CButton
                    color="danger"
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDeleteClick}
                    disabled={bulkDeleteMutation.isLoading}
                  >
                    <CIcon icon={cilTrash} className="me-1" />
                    Удалить ({selectedProxies.length})
                  </CButton>
                  <CDropdown placement="bottom-end">
                    <CDropdownToggle color="warning" size="sm">
                      <CIcon icon={cilLayers} className="me-1" />
                      Действия
                    </CDropdownToggle>
                    <CDropdownMenu>
                      <CDropdownItem onClick={() => console.log('Bulk actions')}>
                        <CIcon icon={cilToggleOn} className="me-2" />
                        Изменить статус
                      </CDropdownItem>
                      <CDropdownDivider />
                      <CDropdownItem onClick={handleBulkDeleteClick} className="text-danger">
                        <CIcon icon={cilTrash} className="me-2" />
                        Удалить выбранные
                      </CDropdownItem>
                    </CDropdownMenu>
                  </CDropdown>
                </>
              )}
              
              <CButton color="secondary" variant="outline" size="sm" onClick={() => setShowFilters(true)}>
                <CIcon icon={cilFilter} className="me-1" />
                Фильтры
              </CButton>
              
              <CButton color="primary" onClick={handleCreate}>
                <CIcon icon={cilPlus} className="me-2" />
                Добавить прокси
              </CButton>
            </div>
          </div>
        </CCol>
      </CRow>

      {/* Search */}
      <CRow className="mb-4">
        <CCol md={6}>
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              placeholder="Поиск по IP, логину, стране..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </CInputGroup>
        </CCol>
        <CCol md={6} className="d-flex justify-content-end">
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <CIcon icon={cilReload} className="me-1" />
            Обновить
          </CButton>
        </CCol>
      </CRow>

      {/* Table */}
      <CCard>
        <CCardBody>
          {isLoading ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
              <div className="mt-2">Загрузка прокси...</div>
            </div>
          ) : proxies.length === 0 ? (
            <div className="text-center py-4">
              <CIcon icon={cilGlobeAlt} size="xxl" className="text-body-tertiary mb-3" />
              <h5>Прокси не найдены</h5>
              <p className="text-body-secondary">
                {filters.search ? 'Попробуйте изменить параметры поиска' : 'Добавьте первый прокси'}
              </p>
            </div>
          ) : (
            <>
              <CTable responsive hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: '40px' }}>
                      <CFormCheck
                        checked={isAllSelected}
                        indeterminate={isPartiallySelected}
                        onChange={handleSelectAll}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>IP:PORT</CTableHeaderCell>
                    <CTableHeaderCell>Протокол</CTableHeaderCell>
                    <CTableHeaderCell>Статус</CTableHeaderCell>
                    <CTableHeaderCell>Страна</CTableHeaderCell>
                    <CTableHeaderCell>Проект</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '100px' }}>Действия</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {proxies.map((proxy) => (
                    <CTableRow key={proxy.id}>
                      <CTableDataCell>
                        <CFormCheck
                          checked={selectedProxies.includes(proxy.id)}
                          onChange={() => handleSelectProxy(proxy.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>
                        <strong>{proxy.ipPort}</strong>
                        {proxy.login && (
                          <div className="text-body-secondary small">
                            {proxy.login}
                          </div>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="info">
                          {proxy.protocol?.toUpperCase() || 'HTTP'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge 
                          color={
                            proxy.status === 'free' ? 'success' :
                            proxy.status === 'busy' ? 'warning' :
                            proxy.status === 'blocked' ? 'danger' : 'secondary'
                          }
                        >
                          {proxy.status || 'unknown'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {proxy.country && (
                          <CBadge color="light">
                            {proxy.country.toUpperCase()}
                          </CBadge>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>
                        {proxy.project ? (
                          <CBadge color="primary">
                            {proxy.project.name}
                          </CBadge>
                        ) : (
                          <span className="text-body-tertiary">Не назначен</span>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButtonGroup size="sm">
                          <CTooltip content="Редактировать">
                            <CButton
                              color="primary"
                              variant="ghost"
                              onClick={() => handleEdit(proxy)}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                          </CTooltip>
                          <CTooltip content="Удалить">
                            <CButton
                              color="danger"
                              variant="ghost"
                              onClick={() => handleDeleteClick(proxy)}
                              disabled={deleteMutation.isLoading}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CTooltip>
                        </CButtonGroup>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <CPagination className="mt-3">
                  <CPaginationItem
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Предыдущая
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
                    disabled={pagination.page === pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Следующая
                  </CPaginationItem>
                </CPagination>
              )}
            </>
          )}
        </CCardBody>
      </CCard>

      {/* Filters Offcanvas */}
      <COffcanvas 
        visible={showFilters} 
        onHide={() => setShowFilters(false)}
        placement="end"
      >
        <COffcanvasHeader>
          <COffcanvasTitle>Фильтры</COffcanvasTitle>
        </COffcanvasHeader>
        <COffcanvasBody>
          <div className="mb-4">
            <label className="form-label fw-semibold">Статус</label>
            <CFormSelect
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Все статусы</option>
              <option value="free">Свободные</option>
              <option value="busy">Занятые</option>
              <option value="blocked">Заблокированные</option>
              <option value="error">С ошибкой</option>
            </CFormSelect>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Проект</label>
            <CFormSelect
              value={filters.projectId || ''}
              onChange={(e) => handleFilterChange('projectId', e.target.value)}
            >
              <option value="">Все проекты</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </CFormSelect>
          </div>

          <div className="d-grid gap-2">
            <CButton 
              color="primary" 
              onClick={() => setShowFilters(false)}
            >
              Применить
            </CButton>
            <CButton 
              color="light" 
              onClick={() => {
                setFilters({ page: 1, limit: 12 })
                setShowFilters(false)
              }}
            >
              Сбросить
            </CButton>
          </div>
        </COffcanvasBody>
      </COffcanvas>

      {/* Form Modal */}
      <ProxyFormModal
        visible={showModal}
        onClose={handleCloseModal}
        proxy={editingProxy}
        isEdit={!!editingProxy}
      />

      {/* Delete Modal */}
      <CModal
        visible={deleteModal.visible}
        onClose={() => setDeleteModal({ visible: false, proxy: null })}
        size="sm"
      >
        <CModalHeader>
          <CModalTitle>Подтверждение удаления</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="text-center">
            <CIcon icon={cilWarning} size="xxl" className="text-warning mb-3" />
            <p>
              Вы уверены, что хотите удалить прокси{' '}
              <strong>{deleteModal.proxy?.ipPort}</strong>?
            </p>
            <p className="text-body-secondary small">
              Это действие нельзя отменить.
            </p>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setDeleteModal({ visible: false, proxy: null })}
            disabled={deleteMutation.isLoading}
          >
            Отмена
          </CButton>
          <CButton
            color="danger"
            onClick={handleDeleteConfirm}
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? <CSpinner size="sm" /> : 'Удалить'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Bulk Delete Modal */}
      <CModal
        visible={bulkDeleteModal.visible}
        onClose={() => setBulkDeleteModal({ visible: false })}
        size="sm"
      >
        <CModalHeader>
          <CModalTitle>Массовое удаление</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="text-center">
            <CIcon icon={cilWarning} size="xxl" className="text-warning mb-3" />
            <p>
              Вы уверены, что хотите удалить {selectedProxies.length} прокси?
            </p>
            <p className="text-body-secondary small">
              Это действие нельзя отменить.
            </p>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setBulkDeleteModal({ visible: false })}
            disabled={bulkDeleteMutation.isLoading}
          >
            Отмена
          </CButton>
          <CButton
            color="danger"
            onClick={handleBulkDeleteConfirm}
            disabled={bulkDeleteMutation.isLoading}
          >
            {bulkDeleteMutation.isLoading ? <CSpinner size="sm" /> : 'Удалить все'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Proxies