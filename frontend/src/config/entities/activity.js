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
      render: (value) => ({
        type: 'badge',
        variant: 'info',
        text: value
      })
    },
    {
      key: 'actionType',
      label: 'Действие',
      width: 'w-32',
      render: (value) => {
        const colors = {
          create: 'success',
          update: 'warning',
          delete: 'danger',
          status_change: 'info',
          bulk_create: 'success',
          bulk_update: 'warning',
          bulk_delete: 'danger'
        }
        return {
          type: 'badge',
          variant: colors[value] || 'gray',
          text: value
        }
      }
    },
    {
      key: 'description',
      label: 'Описание',
      width: 'w-96',
      render: (value) => ({
        type: 'text',
        text: value,
        className: 'text-sm text-gray-900 max-w-md truncate'
      })
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
      modalContent: (item) => ({
        type: 'details',
        fields: [
          { label: 'Время', value: new Date(item.timestamp).toLocaleString('ru-RU') },
          { label: 'Тип сущности', value: item.entityType },
          { label: 'ID сущности', value: item.entityId },
          { label: 'Действие', value: item.actionType },
          { label: 'Описание', value: item.description },
          { label: 'Метаданные', value: item.metadata ? JSON.stringify(item.metadata, null, 2) : 'Нет', type: 'json' }
        ]
      })
    }
  ]
}