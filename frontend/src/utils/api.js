import axios from 'axios'
import toast from 'react-hot-toast'

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
    
    // Don't show toast for 404 errors on GET requests
    if (!(error.response?.status === 404 && error.config?.method === 'get')) {
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

export default api