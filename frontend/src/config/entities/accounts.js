import { getStatusesForEntity } from '../../utils/statuses'

export const accountsConfig = {
  entityType: 'account',
  entityName: 'Аккаунт',
  entityNamePlural: 'Аккаунты',
  apiEndpoint: '/accounts',
  
  // Конфигурация колонок таблицы
  columns: [
    {
      key: 'login',
      label: 'Логин',
      sortable: true,
      required: true,
      type: 'text',
      width: 'w-48',
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          {row.userId && (
            <div className="text-sm text-gray-500">ID: {row.userId}</div>
          )}
        </div>
      )
    },
    {
      key: 'password',
      label: 'Пароль',
      type: 'password',
      showToggle: true,
      width: 'w-32'
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      sortable: true,
      width: 'w-48',
      render: (value) => value || '-'
    },
    {
      key: 'status',
      label: 'Статус',
      type: 'status',
      entityType: 'account',
      sortable: true,
      width: 'w-32'
    },
    {
      key: 'source',
      label: 'Источник',
      sortable: true,
      width: 'w-32',
      render: (value) => value || 'manual'
    },
    {
      key: 'friendsCounts',
      label: 'Друзья',
      type: 'number',
      width: 'w-24',
      render: (value) => value || 0
    },
    {
      key: 'createdAt',
      label: 'Создан',
      type: 'datetime',
      sortable: true,
      width: 'w-40'
    }
  ],

  // Конфигурация фильтров
  filters: [
    {
      key: 'search',
      type: 'search',
      placeholder: 'Поиск по логину, email или user ID...',
      className: 'flex-1'
    },
    {
      key: 'status',
      type: 'select',
      label: 'Статус',
      placeholder: 'Все статусы',
      options: getStatusesForEntity('account').map(status => ({
        value: status,
        label: status
      })),
      className: 'w-full lg:w-48'
    },
    {
      key: 'source',
      type: 'select',
      label: 'Источник',
      placeholder: 'Все источники',
      options: [
        { value: 'manual', label: 'manual' },
        { value: 'import', label: 'import' },
        { value: 'registration', label: 'registration' }
      ],
      className: 'w-full lg:w-48'
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

  // Конфигурация форм
  formFields: [
    {
      key: 'login',
      label: 'Логин',
      type: 'text',
      required: true,
      validation: {
        required: 'Логин обязателен',
        minLength: { value: 1, message: 'Минимум 1 символ' },
        maxLength: { value: 255, message: 'Максимум 255 символов' }
      }
    },
    {
      key: 'password',
      label: 'Пароль',
      type: 'password',
      required: true,
      validation: {
        required: 'Пароль обязателен',
        minLength: { value: 1, message: 'Минимум 1 символ' },
        maxLength: { value: 255, message: 'Максимум 255 символов' }
      }
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      validation: {
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: 'Некорректный email'
        },
        maxLength: { value: 255, message: 'Максимум 255 символов' }
      }
    },
    {
      key: 'emailPassword',
      label: 'Пароль от email',
      type: 'password'
    },
    {
      key: 'emailRecovery',
      label: 'Резервный email',
      type: 'email',
      validation: {
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: 'Некорректный email'
        }
      }
    },
    {
      key: 'twoFA',
      label: '2FA код',
      type: 'text'
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
      options: getStatusesForEntity('account').map(status => ({
        value: status,
        label: status
      })),
      defaultValue: 'active'
    },
    {
      key: 'source',
      label: 'Источник',
      type: 'select',
      options: [
        { value: 'manual', label: 'manual' },
        { value: 'import', label: 'import' },
        { value: 'registration', label: 'registration' }
      ],
      defaultValue: 'manual'
    },
    {
      key: 'note',
      label: 'Заметки',
      type: 'textarea'
    }
  ],

  // Массовые операции
  bulkActions: [
    {
      key: 'bulk-delete',
      label: 'Удалить выбранные',
      icon: 'Trash2',
      variant: 'danger',
      confirm: true,
      confirmMessage: 'Удалить выбранные аккаунты?'
    },
    {
      key: 'bulk-update-status',
      label: 'Изменить статус',
      icon: 'Edit',
      variant: 'outline',
      requiresInput: true,
      inputType: 'select',
      inputLabel: 'Новый статус',
      inputOptions: getStatusesForEntity('account').map(status => ({
        value: status,
        label: status
      }))
    }
  ],

  // Настройки импорта/экспорта
  importExport: {
    import: {
      endpoint: '/accounts/import-text',
      formats: [
        { value: 'login:password', label: 'логин:пароль' },
        { value: 'login:password:email', label: 'логин:пароль:email' }
      ],
      sources: [
        { value: 'import', label: 'import' },
        { value: 'manual', label: 'manual' }
      ]
    },
    export: {
      formats: [
        { value: 'json', label: 'JSON', endpoint: '/accounts/export-json' },
        { value: 'csv', label: 'CSV', endpoint: '/accounts/export-csv' },
        { value: 'txt', label: 'TXT', endpoint: '/accounts/export-txt' }
      ]
    }
  },

  // Дополнительные действия
  actions: [
    {
      key: 'changeStatus',
      label: 'Изменить статус',
      endpoint: (id) => `/accounts/${id}/status`,
      method: 'POST',
      requiresInput: true,
      inputType: 'select',
      inputOptions: getStatusesForEntity('account').map(status => ({
        value: status,
        label: status
      }))
    }
  ]
}