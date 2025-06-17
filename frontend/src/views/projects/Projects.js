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
  CPagination,
  CPaginationItem,
  CSpinner,
  CAlert,
  CProgress,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilPlus,
  cilTrash,
  cilPencil,
  cilReload,
  cilChart,
} from '@coreui/icons'
import { useProjects, useDeleteProject } from '../../hooks/useProjects'

const Projects = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 20 })

  // Загрузка данных
  const { data, isLoading, error, refetch } = useProjects(filters)
  const deleteMutation = useDeleteProject()

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
    if (window.confirm('Удалить проект? Все связанные ресурсы будут отвязаны.')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const projects = data?.projects || []
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
                  <h4 className="mb-0">Проекты</h4>
                  <small className="text-muted">
                    Всего: {pagination.total || 0}
                  </small>
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
                    <CButton color="primary">
                      <CIcon icon={cilPlus} /> Создать проект
                    </CButton>
                  </CButtonGroup>
                </div>
              </div>
            </CCardHeader>
            <CCardBody>
              {/* Фильтры */}
              <CRow className="mb-3">
                <CCol md={6}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Поиск по названию или описанию..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </CInputGroup>
                </CCol>
              </CRow>

              {/* Таблица */}
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Название</CTableHeaderCell>
                    <CTableHeaderCell>Описание</CTableHeaderCell>
                    <CTableHeaderCell>Прокси</CTableHeaderCell>
                    <CTableHeaderCell>Телефоны</CTableHeaderCell>
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
                  ) : projects.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="6" className="text-center">
                        Данные не найдены
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    projects.map((project) => (
                      <CTableRow key={project.id}>
                        <CTableDataCell>
                          <div>
                            <strong>{project.name}</strong>
                            {project.transliterateName && (
                              <div className="small text-muted">
                                ID: {project.transliterateName}
                              </div>
                            )}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          {project.description ? (
                            <span>{project.description}</span>
                          ) : (
                            <span className="text-muted">Без описания</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {project.stats?.proxies ? (
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <small>Всего: {project.stats.proxies.total}</small>
                                <small>
                                  <span className="text-success">{project.stats.proxies.free}</span>
                                  {' / '}
                                  <span className="text-warning">{project.stats.proxies.busy}</span>
                                </small>
                              </div>
                              {project.stats.proxies.total > 0 && (
                                <CProgress 
                                  height={4}
                                  value={(project.stats.proxies.free / project.stats.proxies.total) * 100}
                                  color="success"
                                />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">0</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {project.stats?.phones ? (
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <small>Всего: {project.stats.phones.total}</small>
                                <small>
                                  <span className="text-success">{project.stats.phones.free}</span>
                                  {' / '}
                                  <span className="text-warning">{project.stats.phones.busy}</span>
                                </small>
                              </div>
                              {project.stats.phones.total > 0 && (
                                <CProgress 
                                  height={4}
                                  value={(project.stats.phones.free / project.stats.phones.total) * 100}
                                  color="success"
                                />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">0</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {project.createdAt ? 
                            new Date(project.createdAt).toLocaleDateString('ru-RU') : 
                            '-'
                          }
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButtonGroup size="sm">
                            <CButton color="outline-info" variant="ghost" title="Статистика">
                              <CIcon icon={cilChart} />
                            </CButton>
                            <CButton color="outline-primary" variant="ghost" title="Редактировать">
                              <CIcon icon={cilPencil} />
                            </CButton>
                            <CButton 
                              color="outline-danger" 
                              variant="ghost"
                              onClick={() => handleDelete(project.id)}
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
    </>
  )
}

export default Projects