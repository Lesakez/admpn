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
  cilFolderOpen,
} from '@coreui/icons'
import { useProfiles, useDeleteProfile, useFolders } from '../../hooks/useProfiles'
import { ProfileFormModal } from '../../components/forms'

const Profiles = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 20 })
  const [showModal, setShowModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)

  // Загрузка данных
  const { data, isLoading, error, refetch } = useProfiles(filters)
  const { data: folders } = useFolders()
  const deleteMutation = useDeleteProfile()

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
    if (window.confirm('Удалить профиль?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleCreate = () => {
    setEditingProfile(null)
    setShowModal(true)
  }

  const handleEdit = (profile) => {
    setEditingProfile(profile)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProfile(null)
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      created: 'secondary',
      active: 'success',
      inactive: 'secondary',
      working: 'warning',
      banned: 'danger',
    }
    return <CBadge color={statusColors[status] || 'secondary'}>{status}</CBadge>
  }

  const profiles = data?.profiles || []
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
                  <h4 className="mb-0">Профили</h4>
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
                    <CButton color="outline-primary">
                      <CIcon icon={cilFolderOpen} /> Создать папку
                    </CButton>
                    <CButton color="primary" onClick={handleCreate}>
                      <CIcon icon={cilUserPlus} /> Создать профиль
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
                      placeholder="Поиск по названию, profile ID или user ID..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={filters.folderName || ''}
                    onChange={(e) => handleFilterChange('folderName', e.target.value)}
                  >
                    <option value="">Все папки</option>
                    <option value="[Пусто]">Без папки</option>
                    {folders?.map((folder) => (
                      <option key={folder.name} value={folder.name}>
                        {folder.name} ({folder.count})
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormSelect
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Все статусы</option>
                    <option value="created">created</option>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="working">working</option>
                    <option value="banned">banned</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* Таблица */}
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Название</CTableHeaderCell>
                    <CTableHeaderCell>Profile ID</CTableHeaderCell>
                    <CTableHeaderCell>Папка</CTableHeaderCell>
                    <CTableHeaderCell>Workspace</CTableHeaderCell>
                    <CTableHeaderCell>Статус</CTableHeaderCell>
                    <CTableHeaderCell>Создан</CTableHeaderCell>
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
                  ) : profiles.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="7" className="text-center">
                        Данные не найдены
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    profiles.map((profile) => (
                      <CTableRow key={profile.id}>
                        <CTableDataCell>
                          <strong>{profile.name}</strong>
                          {profile.userId && (
                            <div className="small text-muted">User ID: {profile.userId}</div>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <code className="small">{profile.profileId}</code>
                        </CTableDataCell>
                        <CTableDataCell>
                          {profile.folderName || <span className="text-muted">Без папки</span>}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div>{profile.workspaceName}</div>
                          <div className="small text-muted">ID: {profile.workspaceId}</div>
                        </CTableDataCell>
                        <CTableDataCell>{getStatusBadge(profile.status)}</CTableDataCell>
                        <CTableDataCell>
                          {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ru-RU') : '-'}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButtonGroup size="sm">
                            <CButton 
                              color="outline-primary" 
                              variant="ghost"
                              onClick={() => handleEdit(profile)}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                            <CButton 
                              color="outline-danger" 
                              variant="ghost"
                              onClick={() => handleDelete(profile.id)}
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

      {/* Модальное окно формы */}
      <ProfileFormModal
        visible={showModal}
        onClose={handleCloseModal}
        profile={editingProfile}
        isEdit={!!editingProfile}
      />
    </>
  )
}

export default Profiles