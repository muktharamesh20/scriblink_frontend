<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>ScribLink</h1>
        <p>Sign in to your account</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div v-if="error" class="error">{{ error }}</div>
        
        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="form-input"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            required
            :disabled="loading"
          />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>Don't have an account? <router-link to="/register">Sign up</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { requestAPI } from '../services/apiServices.js'
import { authService } from '../services/authService.js'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const error = ref('')

    const form = reactive({
      username: '',
      password: ''
    })

    const handleLogin = async () => {
      if (!form.username || !form.password) {
        error.value = 'Please fill in all fields'
        return
      }

      loading.value = true
      error.value = ''

      try {
        const response = await requestAPI.loginUser(form.username, form.password)
        
        if (response.user) {
          authService.setUserWithUsername(response.user, form.username)
          
        // Fetch and store the root folder ID
        try {
          const folderResponse = await requestAPI.getFolderStructure(response.user, undefined)
          if (folderResponse.folders && folderResponse.folders.length > 0) {
            // Use the first folder as the root folder
            const rootFolderId = folderResponse.folders[0]._id
            authService.setRootFolder(rootFolderId)
            console.log('✅ Root folder found and stored:', rootFolderId)
          } else {
            // No folders exist, create a root folder
            console.log('🔧 No folders found, creating root folder...')
            try {
              const rootFolderResponse = await requestAPI.createRootFolder(response.user)
              if (rootFolderResponse.folder) {
                authService.setRootFolder(rootFolderResponse.folder)
                console.log('✅ Root folder created and stored:', rootFolderResponse.folder)
              }
            } catch (createErr) {
              console.warn('⚠️ Could not create root folder:', createErr)
              // If createRootFolder fails, try to create a folder directly
              console.log('🔧 Trying to create folder directly...')
              try {
                // Create a root folder by calling the backend's createFolder with a special approach
                const directFolderResponse = await requestAPI.createFolder(response.user, 'Root', 'root')
                if (directFolderResponse.folder) {
                  authService.setRootFolder(directFolderResponse.folder)
                  console.log('✅ Root folder created directly:', directFolderResponse.folder)
                }
              } catch (directErr) {
                console.warn('⚠️ Could not create folder directly:', directErr)
                // Last resort: create a temporary root folder ID
                const tempRootId = 'temp-root-' + Date.now()
                authService.setRootFolder(tempRootId)
                console.log('🔧 Using temporary root folder ID:', tempRootId)
              }
            }
          }
        } catch (folderErr) {
          console.warn('⚠️ Could not fetch root folder:', folderErr)
          // Continue with login even if root folder fetch fails
        }
          
          router.push('/dashboard')
        } else {
          error.value = 'Invalid credentials'
        }
      } catch (err) {
        error.value = err.error || 'Login failed. Please try again.'
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      error,
      handleLogin
    }
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  color: #2c3e50;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: #666;
  font-size: 1rem;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.btn-primary {
  width: 100%;
  background: #3498db;
  font-size: 1rem;
  padding: 0.875rem;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.auth-footer a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>
