import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'Произошла ошибка'
    
    // Don't show error for 404 on GET requests
    if (!(error.response?.status === 404 && error.config?.method === 'get')) {
      console.error('API Error:', message)
    }
    
    return Promise.reject(error)
  }
)

export default api