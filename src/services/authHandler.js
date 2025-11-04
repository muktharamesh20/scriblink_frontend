import { authService } from './authService.js'

/**
 * Authentication utility for API calls
 * Handles token updates and authentication error handling
 */
export const authHandler = {
  /**
   * Processes API response to update tokens if present
   * @param {Object} response - Axios response object
   */
  handleResponse: (response) => {
    // Check both response.data and response directly (in case response IS the data)
    const responseData = response?.data || response
    
    // If response contains a new accessToken, update it
    if (responseData?.accessToken) {
      const newToken = responseData.accessToken
      const oldToken = localStorage.getItem('accessToken')
      const isNewToken = newToken !== oldToken
      
      console.log('🔄 Updating access token from API response:', {
        hasNewToken: !!newToken,
        tokenLength: newToken?.length,
        isNewToken,
        oldToken: oldToken?.substring(0, 20) + '...',
        newToken: newToken?.substring(0, 20) + '...'
      })
      
      if (isNewToken) {
        authService.setAccessToken(newToken)
        console.log('✅ Token updated in localStorage')
        // Verify it was stored
        const stored = localStorage.getItem('accessToken')
        console.log('🔍 Verification - stored token:', stored?.substring(0, 20) + '...', stored === newToken ? '✅ Match' : '❌ Mismatch')
      } else {
        console.log('⚠️ Token is the same as current token, skipping update')
      }
    } else {
      console.log('⚠️ No accessToken in response:', {
        hasResponse: !!response,
        hasData: !!response?.data,
        responseKeys: response ? Object.keys(response) : [],
        dataKeys: responseData ? Object.keys(responseData) : [],
        fullResponse: JSON.stringify(responseData, null, 2).substring(0, 200)
      })
    }
    
    return responseData
  },

  /**
   * Checks if an error is an authentication error
   * @param {Object} error - Error object
   * @returns {boolean} - True if error is authentication-related
   */
  isAuthError: (error) => {
    const errorData = error?.response?.data || error
    const errorMessage = String(errorData?.error || errorData?.message || '').toLowerCase()
    const status = error?.response?.status

    // Check for 401 status
    if (status === 401) {
      return true
    }

    // Check for authentication-related error messages
    // Common patterns: "Invalid", "expired", "token", "authentication", "unauthorized", "access token"
    const authErrorPatterns = [
      'invalid',
      'expired',
      'token',
      'access token',
      'authentication',
      'unauthorized',
      'authenticated user'
    ]

    // Check if error message contains any auth-related keywords
    const hasAuthPattern = authErrorPatterns.some(pattern => 
      errorMessage.includes(pattern)
    )

    // Also check for specific error message patterns
    const specificPatterns = [
      errorMessage.includes('invalid') && errorMessage.includes('token'),
      errorMessage.includes('expired') && errorMessage.includes('token'),
      errorMessage.includes('invalid') && errorMessage.includes('access'),
      errorMessage.includes('authentication'),
      errorMessage.includes('authenticated user')
    ]

    return hasAuthPattern || specificPatterns.some(pattern => pattern === true)
  },

  /**
   * Handles authentication errors by clearing user data and redirecting to login
   * @param {Object} error - Error object
   * @throws {Object} - Re-throws the error data
   */
  handleAuthError: (error) => {
    console.log('❌ Authentication error detected - redirecting to login')
    authService.removeUser()
    window.location.href = '/login'
    const errorData = error?.response?.data || error
    throw errorData
  },

  /**
   * Wraps an API call with authentication handling
   * @param {Function} apiCall - Async function that returns an axios promise
   * @returns {Promise} - Promise that resolves with response data or rejects with error
   */
  wrap: async (apiCall) => {
    try {
      const response = await apiCall()
      console.log('🔍 authHandler.wrap - response received:', {
        hasData: !!response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : [],
        hasAccessToken: !!response?.data?.accessToken,
        status: response?.status
      })
      
      // Check if response contains an error field (backend may return 200 with { error: ... })
      const responseData = response?.data || response
      if (responseData?.error) {
        // Create an error-like object to check if it's an auth error
        const errorObject = {
          response: {
            data: responseData,
            status: response?.status || 200
          }
        }
        
        if (authHandler.isAuthError(errorObject)) {
          authHandler.handleAuthError(errorObject)
        }
        
        // Throw the error even if not auth-related
        throw responseData
      }
      
      const result = authHandler.handleResponse(response)
      console.log('🔍 authHandler.wrap - after handleResponse:', {
        resultKeys: result ? Object.keys(result) : []
      })
      return result
    } catch (error) {
      if (authHandler.isAuthError(error)) {
        authHandler.handleAuthError(error)
      }
      // Re-throw other errors
      const errorData = error?.response?.data || error
      throw errorData
    }
  }
}

