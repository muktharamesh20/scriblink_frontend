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


// Request interceptor to add auth token to headers
api.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url}`
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${fullUrl}`)
    console.log('📦 Request Data:', config.data)
    
    // Add access token to Authorization header AND body
    const accessToken = localStorage.getItem('accessToken')
    if (!config.url?.includes('PasswordAuth')) {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
      
      // Always add authToken to request body if it's a POST request (even if null/undefined)
      // This ensures the backend pattern matching works correctly
      if (config.method === 'post' && config.data && typeof config.data === 'object') {
        config.data.authToken = accessToken || null
        if (accessToken) {
          console.log('🔑 Adding authToken to request body:', accessToken.substring(0, 20) + '...')
        } else {
          console.log('⚠️ No accessToken found - sending null authToken')
        }
      }
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status || 'Network Error'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
    return Promise.reject(error)
  }
)

export default api
