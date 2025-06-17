import { getStatusesForEntity } from '../../utils/statuses'

export const profilesConfig = {
  entityType: 'profile',
  entityName: 'Профиль',
  entityNamePlural: 'Профили',
  apiEndpoint: '/profiles',
  
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
          <div className="text-sm text-gray-500">ID: {row.profileId}</div>
        </div>
      )
    },
    {
      key: 'folderName',
      label: 'Папка',
      sortable: true,
      width: 'w-40',
      render: (value) => value || '[Пусто]'
    },
    {
      key: 'workspaceName',
      label: 'Workspace',
      sortable: true,
      width: 'w-40'
    },
    {
      key: 'userId',
      label: 'User ID',
      width: 'w-32',
      render: (value) => value || '-'
    },
    {
      key: 'status',
      label: 'Статус',
      type: 'status',
      entityType: 'profile',
      sortable: true,
      width: 'w-32'
    },
    {
      key: 'proxy',
      label: 'Прокси',
      width: 'w-32',
      render: (value) => {
        if (!value || value === 'none') return 'Нет'
        return value.length > 20 ? value.substring(0, 20) + '...' : value
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
      placeholder: 'Поиск по названию, ID или user ID...',
      className: 'flex-1'
    },
    {
      key: 'folderName',
      type: 'select',
      label: 'Папка',
      placeholder: 'Все папки',
      apiEndpoint: '/profiles/folders',
      className: 'w-full lg:w-48'
    },
    {
      key: 'status',
      type: 'select',
      label: 'Статус',
      placeholder: 'Все статусы',
      options: getStatusesForEntity('profile').map(status => ({
        value: status,
        label: status
      })),
      className: 'w-full lg:w-48'
    },
    {
      key: 'userId',
      type: 'text',
      placeholder: 'User ID',
      className: 'w-full lg:w-32'
    }
  ],

  formFields: [
    {
      key: 'profileId',
      label: 'Profile ID',
      type: 'text',
      required: true,
      validation: {
        required: 'Profile ID обязателен',
        maxLength: { value: 255, message: 'Максимум 255 символов' }
      }
    },
    {
      key: 'name',
      label: 'Название',
      type: 'text',
      required: true,
      validation: {
        required: 'Название обязательно',
        maxLength: { value: 255, message: 'Максимум 255 символов' }
      }
    },
    {
      key: 'folderName',
      label: 'Папка',
      type: 'text'
    },
    {
      key: 'workspaceId',
      label: 'Workspace ID',
      type: 'text',
      required: true,
      validation: {
        required: 'Workspace ID обязателен',
        maxLength: { value: 50, message: 'Максимум 50 символов' }
      }
    },
    {
      key: 'workspaceName',
      label: 'Workspace Name',
      type: 'text',
      required: true,
      validation: {
        required: 'Workspace Name обязательно',
        maxLength: { value: 255, message: 'Максимум 255 символов' }
      }
    },
    {
      key: 'proxy',
      label: 'Прокси',
      type: 'textarea',
      required: true,
      validation: {
        required: 'Прокси настройки обязательны'
      }
    },
    {
      key: 'userId',
      label: 'User ID',
      type: 'text'
    },
    {
      key: 'status',
      label: 'Статус',
      type: 'select',
      options: getStatusesForEntity('profile').map(status => ({
        value: status,
        label: status
      })),
      defaultValue: 'created'
    }
  ],

  bulkActions: [
    {
      key: 'bulk-delete',
      label: 'Удалить выбранные',
      icon: 'Trash2',
      variant: 'danger',
      confirm: true,
      confirmMessage: 'Удалить выбранные профили?'
    },
    {
      key: 'bulk-update-status',
      label: 'Изменить статус',
      icon: 'Edit',
      variant: 'outline',
      requiresInput: true,
      inputType: 'select',
      inputLabel: 'Новый статус',
      inputOptions: getStatusesForEntity('profile').map(status => ({
        value: status,
        label: status
      }))
    }
  ],

  // Профили поддерживают массовое создание и обновление
  supportsBulkCreate: true,
  supportsBulkUpdate: true,

  actions: [
    {
      key: 'createFolder',
      label: 'Создать папку',
      endpoint: '/profiles/folders',
      method: 'POST',
      requiresInput: true,
      inputType: 'text',
      inputLabel: 'Название папки'
    }
  ]
}