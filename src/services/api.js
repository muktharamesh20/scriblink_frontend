import axios from 'axios'

console.log('🔧 API service loaded')

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // Use proxy instead of direct backend URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token if available and log requests
api.interceptors.request.use(
  (config) => {
    // Print API request URL with more details
    const fullUrl = `${config.baseURL}${config.url}`
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${fullUrl}`)
    console.log('📦 Request Data:', config.data)
    
    const user = localStorage.getItem('user')
    if (user) {
      console.log('👤 User:', user)
      // Only add user to request body if:
      // 1. It's a POST request
      // 2. Request data exists
      // 3. User is not already in the request data (explicitly provided)
      // 4. Endpoint is not PasswordAuth (which uses username/password instead)
      if (config.method === 'post' && config.data && !config.data.user && !config.url?.includes('PasswordAuth')) {
        config.data.user = user
      }
    } else {
      console.log('👤 No user found in localStorage')
    }
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
    console.log('📦 Response Data:', response.data)
    return response
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status || 'Network Error'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
    console.error('📦 Error Data:', error.response?.data || error.message)
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
