import axios from 'axios'
import { authService } from './authService.js'

console.log('🔧 API service loaded')

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request interceptor to add auth token to headers
api.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url}`
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${fullUrl}`)
    console.log('📦 Request Data:', config.data)
    
    // Add access token to Authorization header
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken && !config.url?.includes('PasswordAuth')) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    
    // Still add user to body for backward compatibility (if not already present)
    const user = localStorage.getItem('user')
    if (user && config.method === 'post' && config.data && !config.data.user && !config.url?.includes('PasswordAuth')) {
      config.data.user = user
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('PasswordAuth')) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(err => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        processQueue(error, null)
        isRefreshing = false
        authService.removeUser()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post('/api/PasswordAuth/refresh', {
          refreshToken
        })
        
        const { accessToken } = response.data
        localStorage.setItem('accessToken', accessToken)
        
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        isRefreshing = false
        
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshing = false
        authService.removeUser()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    console.error(`❌ API Error: ${error.response?.status || 'Network Error'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
    return Promise.reject(error)
  }
)

export default api
