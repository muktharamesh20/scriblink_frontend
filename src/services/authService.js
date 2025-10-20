// Authentication service using localStorage
export const authService = {
  // Store user in localStorage
  setUser: (user) => {
    localStorage.setItem('user', user)
  },

  // Get current user from localStorage
  getUser: () => {
    return localStorage.getItem('user')
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('user')
  },

  // Remove user from localStorage (logout)
  removeUser: () => {
    localStorage.removeItem('user')
  },

  // Clear all localStorage data
  clearAll: () => {
    localStorage.clear()
  }
}

// State management for application data
export const stateService = {
  // Store data in localStorage with key prefix
  set: (key, value) => {
    try {
      localStorage.setItem(`scriblink_${key}`, JSON.stringify(value))
    } catch (error) {
      console.error('Error storing data:', error)
    }
  },

  // Get data from localStorage
  get: (key) => {
    try {
      const data = localStorage.getItem(`scriblink_${key}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error retrieving data:', error)
      return null
    }
  },

  // Remove data from localStorage
  remove: (key) => {
    localStorage.removeItem(`scriblink_${key}`)
  },

  // Clear all scriblink data
  clear: () => {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('scriblink_')) {
        localStorage.removeItem(key)
      }
    })
  }
}

// Cache service for API responses
export const cacheService = {
  // Cache API response
  set: (key, data, ttl = 300000) => { // 5 minutes default TTL
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl
    }
    stateService.set(`cache_${key}`, cacheData)
  },

  // Get cached data if not expired
  get: (key) => {
    const cacheData = stateService.get(`cache_${key}`)
    if (!cacheData) return null

    const now = Date.now()
    if (now - cacheData.timestamp > cacheData.ttl) {
      stateService.remove(`cache_${key}`)
      return null
    }

    return cacheData.data
  },

  // Clear specific cache entry
  clear: (key) => {
    stateService.remove(`cache_${key}`)
  },

  // Clear all cache
  clearAll: () => {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('scriblink_cache_')) {
        localStorage.removeItem(key)
      }
    })
  }
}
