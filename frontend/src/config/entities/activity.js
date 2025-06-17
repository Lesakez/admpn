export const activityConfig = {
  entityType: 'activity',
  entityName: 'Активность',
  entityNamePlural: 'Активность',
  apiEndpoint: '/activity',
  
  // Активность только для чтения
  readOnly: true,
  
  columns: [
    {
      key: 'timestamp',
      label: 'Время',
      type: 'datetime',
      sortable: true,
      width: 'w-40'
    },
    {
      key: 'entityType',
      label: 'Тип',
      width: 'w-24',
      render: (value) => (
        <span className="badge badge-info">{value}</span>
      )
    },
    {
      key: 'actionType',
      label: 'Действие',
      width: 'w-32',
      render: (value) => {
        const colors = {
          create: 'badge-success',
          update: 'badge-warning',
          delete: 'badge-danger',
          status_change: 'badge-info',
          bulk_create: 'badge-success',
          bulk_update: 'badge-warning',
          bulk_delete: 'badge-danger'
        }
        return (
          <span className={`badge ${colors[value] || 'badge-gray'}`}>
            {value}
          </span>
        )
      }
    },
    {
      key: 'description',
      label: 'Описание',
      width: 'w-96',
      render: (value) => (
        <div className="text-sm text-gray-900 max-w-md truncate">
          {value}
        </div>
      )
    },
    {
      key: 'entityId',
      label: 'ID сущности',
      width: 'w-24',
      render: (value) => value || '-'
    }
  ],

  filters: [
    {
      key: 'search',
      type: 'search',
      placeholder: 'Поиск по описанию...',
      className: 'flex-1'
    },
    {
      key: 'entityType',
      type: 'select',
      label: 'Тип сущности',
      placeholder: 'Все типы',
      options: [
        { value: 'account', label: 'account' },
        { value: 'profile', label: 'profile' },
        { value: 'proxy', label: 'proxy' },
        { value: 'phone', label: 'phone' },
        { value: 'project', label: 'project' },
        { value: 'registration', label: 'registration' }
      ],
      className: 'w-full lg:w-32'
    },
    {
      key: 'actionType',
      type: 'select',
      label: 'Действие',
      placeholder: 'Все действия',
      options: [
        { value: 'create', label: 'create' },
        { value: 'update', label: 'update' },
        { value: 'delete', label: 'delete' },
        { value: 'status_change', label: 'status_change' },
        { value: 'bulk_create', label: 'bulk_create' },
        { value: 'bulk_update', label: 'bulk_update' },
        { value: 'bulk_delete', label: 'bulk_delete' }
      ],
      className: 'w-full lg:w-32'
    },
    {
      key: 'dateFrom',
      type: 'date',
      label: 'От даты',
      className: 'w-full lg:w-40'
    },
    {
      key: 'dateTo',
      type: 'date',
      label: 'До даты',
      className: 'w-full lg:w-40'
    }
  ],

  // Специальные действия для активности
  actions: [
    {
      key: 'viewDetails',
      label: 'Подробности',
      icon: 'Eye',
      openInModal: true,
      modalContent: (item) => (
        <div className="space-y-4">
          <div>
            <strong>Время:</strong> {new Date(item.timestamp).toLocaleString('ru-RU')}
          </div>
          <div>
            <strong>Тип сущности:</strong> {item.entityType}
          </div>
          <div>
            <strong>ID сущности:</strong> {item.entityId}
          </div>
          <div>
            <strong>Действие:</strong> {item.actionType}
          </div>
          <div>
            <strong>Описание:</strong> {item.description}
          </div>
          {item.metadata && (
            <div>
              <strong>Метаданные:</strong>
              <pre className="mt-2 bg-gray-100 p-2 rounded text-sm">
                {JSON.stringify(item.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )
    }
  ]
}