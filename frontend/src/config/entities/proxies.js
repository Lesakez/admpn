import { getStatusesForEntity } from '../../utils/statuses'

export const proxiesConfig = {
  entityType: 'proxy',
  entityName: 'Прокси',
  entityNamePlural: 'Прокси',
  apiEndpoint: '/proxies',
  
  columns: [
    {
      key: 'ipPort',
      label: 'IP:Port',
      sortable: true,
      required: true,
      type: 'text',
      width: 'w-40',
      render: (value) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'type',
      label: 'Тип',
      width: 'w-24',
      render: (value) => value || 'http'
    },
    {
      key: 'login',
      label: 'Логин',
      width: 'w-32',
      render: (value) => value || '-'
    },
    {
      key: 'password',
      label: 'Пароль',
      type: 'password',
      showToggle: true,
      width: 'w-32'
    },
    {
      key: 'country',
      label: 'Страна',
      sortable: true,
      width: 'w-24',
      render: (value) => value || '-'
    },
    {
      key: 'status',
      label: 'Статус',
      type: 'status',
      entityType: 'proxy',
      sortable: true,
      width: 'w-32'
    },
    {
      key: 'project',
      label: 'Проект',
      width: 'w-32',
      render: (value, row) => row.project?.name || '-'
    },
    {
      key: 'dateLastChangeIp',
      label: 'Последняя смена IP',
      type: 'datetime',
      width: 'w-40',
      render: (value) => value ? new Date(value).toLocaleString('ru-RU') : '-'
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
      placeholder: 'Поиск по IP, логину или стране...',
      className: 'flex-1'
    },
    {
      key: 'status',
      type: 'select',
      label: 'Статус',
      placeholder: 'Все статусы',
      options: getStatusesForEntity('proxy').map(status => ({
        value: status,
        label: status
      })),
      className: 'w-full lg:w-48'
    },
    {
      key: 'country',
      type: 'select',
      label: 'Страна',
      placeholder: 'Все страны',
      apiEndpoint: '/proxies?_distinct=country',
      className: 'w-full lg:w-32'
    },
    {
      key: 'projectId',
      type: 'select',
      label: 'Проект',
      placeholder: 'Все проекты',
      apiEndpoint: '/projects',
      optionValue: 'id',
      optionLabel: 'name',
      className: 'w-full lg:w-48'
    }
  ],

  formFields: [
    {
      key: 'ipPort',
      label: 'IP:Port',
      type: 'text',
      required: true,
      validation: {
        required: 'IP:Port обязателен',
        pattern: {
          value: /^.+:\d+$/,
          message: 'Формат должен быть IP:PORT'
        }
      }
    },
    {
      key: 'type',
      label: 'Тип',
      type: 'select',
      options: [
        { value: 'http', label: 'HTTP' },
        { value: 'https', label: 'HTTPS' },
        { value: 'socks4', label: 'SOCKS4' },
        { value: 'socks5', label: 'SOCKS5' }
      ],
      defaultValue: 'http'
    },
    {
      key: 'login',
      label: 'Логин',
      type: 'text'
    },
    {
      key: 'password',
      label: 'Пароль',
      type: 'password'
    },
    {
      key: 'country',
      label: 'Страна',
      type: 'text'
    },
    {
      key: 'changeIpUrl',
      label: 'URL смены IP',
      type: 'url',
      validation: {
        pattern: {
          value: /^https?:\/\/.+/,
          message: 'Введите корректный URL'
        }
      }
    },
    {
      key: 'projectId',
      label: 'Проект',
      type: 'select',
      apiEndpoint: '/projects',
      optionValue: 'id',
      optionLabel: 'name'
    },
    {
      key: 'status',
      label: 'Статус',
      type: 'select',
      options: getStatusesForEntity('proxy').map(status => ({
        value: status,
        label: status
      })),
      defaultValue: 'free'
    }
  ],

  bulkActions: [
    {
      key: 'bulk-delete',
      label: 'Удалить выбранные',
      icon: 'Trash2',
      variant: 'danger',
      confirm: true,
      confirmMessage: 'Удалить выбранные прокси?'
    },
    {
      key: 'bulk-update-status',
      label: 'Изменить статус',
      icon: 'Edit',
      variant: 'outline',
      requiresInput: true,
      inputType: 'select',
      inputLabel: 'Новый статус',
      inputOptions: getStatusesForEntity('proxy').map(status => ({
        value: status,
        label: status
      }))
    }
  ],

  actions: [
    {
      key: 'toggle',
      label: 'Переключить статус',
      endpoint: (id) => `/proxies/${id}/toggle`,
      method: 'POST',
      icon: 'ToggleLeft'
    },
    {
      key: 'changeIp',
      label: 'Сменить IP',
      endpoint: (id) => `/proxies/${id}/change-ip`,
      method: 'POST',
      icon: 'RefreshCw',
      requiresConfirm: true,
      confirmMessage: 'Сменить IP для этого прокси?'
    }
  ]
}