export const projectsConfig = {
  entityType: 'project',
  entityName: 'Проект',
  entityNamePlural: 'Проекты',
  apiEndpoint: '/projects',
  
  columns: [
    {
      key: 'name',
      label: 'Название',
      sortable: true,
      required: true,
      type: 'text',
      width: 'w-48',
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          {row.transliterateName && (
            <div className="text-sm text-gray-500">{row.transliterateName}</div>
          )}
        </div>
      )
    },
    {
      key: 'description',
      label: 'Описание',
      width: 'w-64',
      render: (value) => {
        if (!value) return '-'
        return value.length > 50 ? value.substring(0, 50) + '...' : value
      }
    },
    {
      key: 'stats',
      label: 'Ресурсы',
      width: 'w-48',
      render: (value, row) => {
        const stats = row.stats || {}
        const proxies = stats.proxies || { total: 0, free: 0, busy: 0 }
        const phones = stats.phones || { total: 0, free: 0, busy: 0 }
        
        return (
          <div className="text-sm">
            <div>Прокси: {proxies.total} ({proxies.free} свободных)</div>
            <div>Телефоны: {phones.total} ({phones.free} свободных)</div>
          </div>
        )
      }
    },
    {
      key: 'createdAt',
      label: 'Создан',
      type: 'datetime',
      sortable: true,
      width: 'w-40'
    }
  ],

  filters: [
    {
      key: 'search',
      type: 'search',
      placeholder: 'Поиск по названию или описанию...',
      className: 'flex-1'
    }
  ],

  formFields: [
    {
      key: 'name',
      label: 'Название',
      type: 'text',
      required: true,
      validation: {
        required: 'Название проекта обязательно',
        minLength: { value: 1, message: 'Минимум 1 символ' },
        maxLength: { value: 255, message: 'Максимум 255 символов' }
      }
    },
    {
      key: 'description',
      label: 'Описание',
      type: 'textarea',
      validation: {
        maxLength: { value: 1000, message: 'Максимум 1000 символов' }
      }
    }
  ],

  bulkActions: [
    {
      key: 'bulk-delete',
      label: 'Удалить выбранные',
      icon: 'Trash2',
      variant: 'danger',
      confirm: true,
      confirmMessage: 'Удалить выбранные проекты? Это также удалит все связанные ресурсы.'
    }
  ],

  actions: [
    {
      key: 'stats',
      label: 'Статистика',
      endpoint: (id) => `/projects/${id}/stats`,
      method: 'GET',
      icon: 'BarChart3',
      openInModal: true
    }
  ],

  // Проекты имеют вложенные ресурсы
  hasNestedResources: true,
  nestedResources: [
    {
      key: 'proxies',
      label: 'Прокси',
      endpoint: (id) => `/proxies?projectId=${id}`,
      icon: 'Globe'
    },
    {
      key: 'phones',
      label: 'Телефоны',
      endpoint: (id) => `/phones?projectId=${id}`,
      icon: 'Smartphone'
    }
  ]
}