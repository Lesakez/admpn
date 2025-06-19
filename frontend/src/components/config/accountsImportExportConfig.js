// frontend/src/config/accountsImportExportConfig.js

export default {
  title: 'Импорт/Экспорт аккаунтов',
  icon: 'cilUser',
  
  import: {
    title: 'Импорт аккаунтов',
    description: 'Импортируйте аккаунты из текстового файла или введите данные вручную',
    service: 'accountsService',
    method: 'importFromText',
    
    formats: [
      {
        value: 'login:password',
        label: 'Логин:Пароль',
        example: 'user123:password123\nadmin:secretpass\nmylogin:mypass',
        description: 'Каждая строка содержит логин и пароль, разделенные двоеточием'
      },
      {
        value: 'email:password',
        label: 'Email:Пароль',
        example: 'user@example.com:password123\nadmin@site.com:secretpass\ntest@mail.com:mypass',
        description: 'Каждая строка содержит email и пароль, разделенные двоеточием'
      }
    ],
    
    delimiters: [
      { value: '\n', label: 'Новая строка' },
      { value: '\r\n', label: 'Windows (CRLF)' },
      { value: ';', label: 'Точка с запятой' },
      { value: ',', label: 'Запятая' },
      { value: '|', label: 'Вертикальная черта' }
    ],
    
    acceptedFileTypes: '.txt,.csv',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    
    resultFields: {
      imported: 'Импортировано',
      errors: 'Ошибок',
      total: 'Всего строк'
    }
  },
  
  export: {
    title: 'Экспорт аккаунтов',
    description: 'Экспортируйте аккаунты в различных форматах с настраиваемыми фильтрами',
    service: 'accountsService',
    
    formats: [
      {
        value: 'json',
        label: 'JSON',
        description: 'Полные данные аккаунтов в формате JSON',
        method: 'exportJSON',
        extension: 'json',
        mimeType: 'application/json'
      },
      {
        value: 'csv',
        label: 'CSV (Excel)',
        description: 'Табличные данные для Excel/LibreOffice',
        method: 'exportCSV',
        extension: 'csv',
        mimeType: 'text/csv'
      },
      {
        value: 'txt_login_password',
        label: 'TXT (Логин:Пароль)',
        description: 'Простой текстовый формат логин:пароль',
        method: 'exportTXT',
        extension: 'txt',
        mimeType: 'text/plain',
        params: { format: 'login:password' }
      },
      {
        value: 'txt_email_password',
        label: 'TXT (Email:Пароль)',
        description: 'Простой текстовый формат email:пароль',
        method: 'exportTXT',
        extension: 'txt',
        mimeType: 'text/plain',
        params: { format: 'email:password' }
      }
    ],
    
    filters: [
      {
        key: 'status',
        label: 'Статус',
        type: 'select',
        dynamic: true,
        hook: 'useEntityStatuses',
        entity: 'account',
        placeholder: 'Все статусы'
      },
      {
        key: 'source',
        label: 'Источник',
        type: 'select',
        options: [
          { value: '', label: 'Все источники' },
          { value: 'manual', label: 'Ручное создание' },
          { value: 'import', label: 'Импорт' },
          { value: 'registration', label: 'Регистрация' },
          { value: 'api', label: 'API' }
        ]
      },
      {
        key: 'search',
        label: 'Поиск',
        type: 'text',
        placeholder: 'Поиск по логину или email'
      },
      {
        key: 'dateFrom',
        label: 'Дата создания от',
        type: 'date'
      },
      {
        key: 'dateTo',
        label: 'Дата создания до',
        type: 'date'
      }
    ],
    
    defaultFilters: {
      status: '',
      source: '',
      search: '',
      dateFrom: '',
      dateTo: ''
    }
  }
}