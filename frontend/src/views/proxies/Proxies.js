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
  CDropdownDivider,  // ДОБАВЛЕНО
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
} from '@coreui/icons'
import { useProxies, useDeleteProxy } from '../../hooks/useProxies'
import { useProjects } from '../../hooks/useProjects'
import { ProxyFormModal } from '../../components/forms'

const Proxies = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 12 })
  const [showModal, setShowModal] = useState(false)
  const [editingProxy, setEditingProxy] = useState(null)
  const [selectedProxies, setSelectedProxies] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  // Загрузка данных
  const { data, isLoading, error, refetch } = useProxies(filters)
  const { data: projectsData } = useProjects()
  const deleteMutation = useDeleteProxy()

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

  const proxies = data?.proxies || []
  const pagination = data?.pagination || {}
  const projects = projectsData?.projects || []

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Прокси</h4>
          <p className="text-body-secondary mb-0">
            Управление прокси-серверами
          </p>
        </div>
        
        <div className="d-flex gap-2">
          {selectedProxies.length > 0 && (
            <CDropdown placement="bottom-end">
              <CDropdownToggle color="warning" size="sm">
                <CIcon icon={cilLayers} className="me-1" />
                Действия ({selectedProxies.length})
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
                  className="py-2 px-3 d-flex align-items-center"
                >
                  <CIcon icon={cilToggleOn} className="me-2 text-info" />
                  <span>Изменить статус</span>
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem 
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
            onClick={handleCreate}
            className="d-flex align-items-center gap-2"
          >
            <CIcon icon={cilPlus} size="sm" />
            Создать
          </CButton>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <CInputGroup className="shadow-sm">
          <CInputGroupText>
            <CIcon icon={cilSearch} />
          </CInputGroupText>
          <CFormInput
            placeholder="Поиск по IP, логину, стране..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          {filters.search && (
            <CButton
              color="light"
              variant="outline"
              onClick={() => handleFilterChange('search', '')}
            >
              Очистить
            </CButton>
          )}
        </CInputGroup>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
          <div className="mt-2 text-body-secondary">Загрузка...</div>
        </div>
      ) : proxies.length === 0 ? (
        <div className="text-center py-5">
          <CIcon icon={cilGlobeAlt} size="3xl" className="text-body-secondary mb-3" />
          <h5 className="text-body-secondary">Прокси не найдены</h5>
          <p className="text-body-secondary">
            {filters.search ? 'Попробуйте изменить параметры поиска' : 'Создайте первый прокси'}
          </p>
          {!filters.search && (
            <CButton color="primary" onClick={handleCreate}>
              <CIcon icon={cilPlus} className="me-1" />
              Создать прокси
            </CButton>
          )}
        </div>
      ) : (
        <>
          {/* Proxy Cards */}
          <CRow>
            {proxies.map((proxy) => (
              <CCol key={proxy.id} sm={6} lg={4} xl={3} className="mb-4">
                <CCard className="h-100 shadow-sm">
                  <CCardHeader className="bg-transparent border-bottom-0 pb-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <CBadge 
                        color={proxy.status === 'free' ? 'success' : 'danger'}
                        className="text-uppercase small"
                      >
                        {proxy.status}
                      </CBadge>
                      <CDropdown>
                        <CDropdownToggle 
                          color="transparent" 
                          caret={false}
                          className="p-0 border-0"
                        >
                          <CIcon icon={cilFilter} />
                        </CDropdownToggle>
                        <CDropdownMenu>
                          <CDropdownItem onClick={() => handleEdit(proxy)}>
                            <CIcon icon={cilPencil} className="me-2" />
                            Редактировать
                          </CDropdownItem>
                          <CDropdownDivider />
                          <CDropdownItem 
                            onClick={() => handleDelete(proxy.id)}
                            className="text-danger"
                          >
                            <CIcon icon={cilTrash} className="me-2" />
                            Удалить
                          </CDropdownItem>
                        </CDropdownMenu>
                      </CDropdown>
                    </div>
                  </CCardHeader>
                  
                  <CCardBody className="pt-2">
                    <h6 className="mb-1">{proxy.ipPort}</h6>
                    <div className="small text-body-secondary mb-2">
                      <div>Тип: {proxy.protocol}</div>
                      <div>Страна: {proxy.country || 'Не указана'}</div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-end">
                      <span className="small">
                        {proxy.project?.name || 'Без проекта'}
                      </span>
                      <span className="text-body-secondary small">
                        #{proxy.id}
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
            >
              <option value="">Все статусы</option>
              <option value="free">Свободные</option>
              <option value="busy">Занятые</option>
              <option value="offline">Оффлайн</option>
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

      {/* Modal */}
      <ProxyFormModal
        visible={showModal}
        onClose={handleCloseModal}
        proxy={editingProxy}
        isEdit={!!editingProxy}
      />
    </>
  )
}

export default Proxies