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
        description: 'Каждая строка содержит логин и пароль, разделенные двоеточием',
        parser: (line) => {
          const parts = line.split(':')
          if (parts.length < 2) return { valid: false, reason: 'Недостаточно данных' }
          
          const [login, ...passwordParts] = parts
          const password = passwordParts.join(':') // На случай двоеточий в пароле
          
          if (!login?.trim() || !password?.trim()) {
            return { valid: false, reason: 'Логин или пароль пустые' }
          }
          
          return {
            valid: true,
            login: login.trim(),
            password: password.trim()
          }
        }
      },
      {
        value: 'email:password',
        label: 'Email:Пароль',
        example: 'user@example.com:password123\nadmin@site.com:secretpass\ntest@mail.com:mypass',
        description: 'Каждая строка содержит email и пароль, разделенные двоеточием',
        parser: (line) => {
          const parts = line.split(':')
          if (parts.length < 2) return { valid: false, reason: 'Недостаточно данных' }
          
          const [email, ...passwordParts] = parts
          const password = passwordParts.join(':')
          
          if (!email?.trim() || !password?.trim()) {
            return { valid: false, reason: 'Email или пароль пустые' }
          }
          
          // Простая валидация email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(email.trim())) {
            return { valid: false, reason: 'Неверный формат email' }
          }
          
          return {
            valid: true,
            email: email.trim(),
            password: password.trim()
          }
        }
      },
      {
        value: 'login:password:email',
        label: 'Логин:Пароль:Email',
        example: 'user123:password123:user@example.com\nadmin:secretpass:admin@site.com',
        description: 'Каждая строка содержит логин, пароль и email, разделенные двоеточиями',
        parser: (line) => {
          const parts = line.split(':')
          if (parts.length < 3) return { valid: false, reason: 'Недостаточно данных' }
          
          const [login, password, email] = parts
          
          if (!login?.trim() || !password?.trim()) {
            return { valid: false, reason: 'Логин или пароль пустые' }
          }
          
          const result = {
            valid: true,
            login: login.trim(),
            password: password.trim()
          }
          
          if (email?.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (emailRegex.test(email.trim())) {
              result.email = email.trim()
            }
          }
          
          return result
        }
      }
    ],
    
    delimiters: [
      { value: '\n', label: 'Новая строка' },
      { value: '\r\n', label: 'Windows (CRLF)' },
      { value: ';', label: 'Точка с запятой' },
      { value: ',', label: 'Запятая' },
      { value: '|', label: 'Вертикальная черта' }
    ],
    
    additionalFields: [
      {
        key: 'validateEmails',
        label: 'Валидировать email адреса',
        type: 'checkbox',
        description: 'Проверять корректность email адресов при импорте'
      },
      {
        key: 'allowDuplicates',
        label: 'Разрешить дубликаты',
        type: 'checkbox',
        description: 'Импортировать даже если аккаунт уже существует'
      },
      {
        key: 'defaultStatus',
        label: 'Статус по умолчанию',
        type: 'select',
        options: [
          { value: 'active', label: 'Активный' },
          { value: 'inactive', label: 'Неактивный' },
          { value: 'pending', label: 'Ожидает' }
        ],
        description: 'Статус, который будет присвоен импортированным аккаунтам'
      },
      {
        key: 'defaultSource',
        label: 'Источник по умолчанию',
        type: 'text',
        placeholder: 'import',
        description: 'Источник, который будет указан для импортированных аккаунтов'
      }
    ],
    
    acceptedFileTypes: '.txt,.csv',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    encoding: 'UTF-8',
    
    resultFields: {
      imported: 'Импортировано',
      skipped: 'Пропущено',
      errors: 'Ошибок',
      total: 'Всего строк',
      duplicates: 'Дубликатов'
    },
    
    successMessage: 'Аккаунты успешно импортированы',
    warningMessage: 'Импорт завершен с ошибками',
    submitLabel: 'Импортировать аккаунты'
  },
  
  export: {
    title: 'Экспорт аккаунтов',
    description: 'Экспортируйте аккаунты в различных форматах с гибкими настройками',
    service: 'accountsService',
    defaultMethod: 'exportJSON',
    
    formats: [
      {
        value: 'json',
        label: 'JSON',
        description: 'Полные данные аккаунтов в формате JSON',
        method: 'exportJSON',
        extension: 'json',
        mimeType: 'application/json',
        filename: 'accounts_export.json'
      },
      {
        value: 'csv',
        label: 'CSV (Excel)',
        description: 'Табличные данные для Excel/LibreOffice',
        method: 'exportCSV',
        extension: 'csv',
        mimeType: 'text/csv',
        filename: 'accounts_export.csv'
      },
      {
        value: 'txt_login_password',
        label: 'TXT (Логин:Пароль)',
        description: 'Простой формат логин:пароль',
        method: 'exportTXT',
        extension: 'txt',
        mimeType: 'text/plain',
        params: { format: 'login:password' },
        filename: 'accounts_login_password.txt'
      },
      {
        value: 'txt_email_password',
        label: 'TXT (Email:Пароль)',
        description: 'Простой формат email:пароль',
        method: 'exportTXT',
        extension: 'txt',
        mimeType: 'text/plain',
        params: { format: 'email:password' },
        filename: 'accounts_email_password.txt'
      },
      {
        value: 'txt_custom',
        label: 'TXT (Кастомный шаблон)',
        description: 'Использовать кастомный шаблон для экспорта',
        method: 'exportCustom',
        extension: 'txt',
        mimeType: 'text/plain',
        params: { format: 'template' },
        filename: 'accounts_custom.txt'
      }
    ],
    
    filters: [
      {
        key: 'status',
        label: 'Статус',
        type: 'select',
        dynamic: true,
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
        label: 'Создан от',
        type: 'date'
      },
      {
        key: 'dateTo',
        label: 'Создан до',
        type: 'date'
      },
      {
        key: 'hasEmail',
        label: 'Только с email',
        type: 'checkbox',
        description: 'Экспортировать только аккаунты с указанным email'
      },
      {
        key: 'has2FA',
        label: 'Только с 2FA',
        type: 'checkbox',
        description: 'Экспортировать только аккаунты с настроенной двухфакторной аутентификацией'
      }
    ],
    
    advancedSettings: [
      {
        key: 'includePasswords',
        label: 'Включить пароли',
        type: 'checkbox',
        description: 'Экспортировать пароли (только для авторизованных пользователей)'
      },
      {
        key: 'includeEmailPasswords',
        label: 'Включить пароли от email',
        type: 'checkbox',
        description: 'Экспортировать пароли от email адресов'
      },
      {
        key: 'includeCookies',
        label: 'Включить cookies',
        type: 'checkbox',
        description: 'Экспортировать cookies'
      },
      {
        key: 'includeTokens',
        label: 'Включить токены',
        type: 'checkbox',
        description: 'Экспортировать access и refresh токены'
      },
      {
        key: 'customDelimiter',
        label: 'Кастомный разделитель',
        type: 'text',
        placeholder: 'Например: |, ;, @',
        description: 'Для текстовых форматов (оставьте пустым для стандартного)'
      },
      {
        key: 'customTemplate',
        label: 'Кастомный шаблон',
        type: 'textarea',
        placeholder: '{login}:{password}#{email}#{userAgent}',
        description: 'Доступные переменные: {login}, {password}, {email}, {userAgent}, {cookies}, {twoFA}, {status}, {source}'
      }
    ],
    
    defaultFilters: {
      status: '',
      source: '',
      search: '',
      dateFrom: '',
      dateTo: '',
      hasEmail: false,
      has2FA: false
    },
    
    defaultValues: {
      includePasswords: false,
      includeEmailPasswords: false,
      includeCookies: false,
      includeTokens: false,
      customDelimiter: '',
      customTemplate: ''
    }
  }
}