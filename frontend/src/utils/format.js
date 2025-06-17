// Форматирование даты и времени
export const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

export const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU')
  } catch (error) {
    return dateString
  }
}

export const formatTime = (dateString) => {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

// Форматирование относительного времени
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) {
      return 'только что'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} мин. назад`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} ч. назад`
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} дн. назад`
    } else {
      return formatDate(dateString)
    }
  } catch (error) {
    return dateString
  }
}

// Форматирование чисел
export const formatNumber = (number) => {
  if (typeof number !== 'number') return number
  return number.toLocaleString('ru-RU')
}

// Форматирование размера файла
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Б'
  
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

// Форматирование процентов
export const formatPercent = (value, total) => {
  if (!total || total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

// Обрезание текста
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Форматирование статуса
export const formatStatus = (status) => {
  if (!status) return '-'
  
  // Заменяем подчеркивания на пробелы и делаем первую букву заглавной
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Форматирование валюты
export const formatCurrency = (amount, currency = 'RUB') => {
  if (typeof amount !== 'number') return amount
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

// Форматирование телефона
export const formatPhone = (phone) => {
  if (!phone) return '-'
  
  // Удаляем все кроме цифр
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    // Российский номер
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`
  } else if (cleaned.length === 10) {
    // Номер без кода страны
    return `+7 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 10)}`
  }
  
  return phone
}

// Форматирование JSON для отображения
export const formatJson = (obj, indent = 2) => {
  if (!obj) return ''
  
  try {
    if (typeof obj === 'string') {
      obj = JSON.parse(obj)
    }
    return JSON.stringify(obj, null, indent)
  } catch (error) {
    return obj.toString()
  }
}

// Извлечение доменного имени из email
export const extractDomain = (email) => {
  if (!email || !email.includes('@')) return email
  return email.split('@')[1]
}

// Генерация инициалов из имени
export const getInitials = (name) => {
  if (!name) return ''
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}

// Форматирование списка в строку
export const formatList = (items, separator = ', ', lastSeparator = ' и ') => {
  if (!Array.isArray(items) || items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return items.join(lastSeparator)
  
  const allButLast = items.slice(0, -1).join(separator)
  const last = items[items.length - 1]
  
  return allButLast + lastSeparator + last
}