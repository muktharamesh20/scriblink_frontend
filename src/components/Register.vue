<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <img src="/scriblink.png" alt="ScribLink" class="logo-image" />
        <p>Create your account</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="success" class="success">{{ success }}</div>
        
        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="form-input"
            required
            :disabled="loading"
            placeholder="Choose a username"
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
            placeholder="Create a password"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            class="form-input"
            required
            :disabled="loading"
            placeholder="Confirm your password"
          />
        </div>

        <button type="submit" class="btn btn-success" :disabled="loading">
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>Already have an account? <router-link to="/login">Sign in</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI, requestAPI } from '../services/apiServices.js'
import { authService } from '../services/authService.js'

export default {
  name: 'Register',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const error = ref('')
    const success = ref('')

    const form = reactive({
      username: '',
      password: '',
      confirmPassword: ''
    })

    const validateForm = () => {
      if (!form.username || !form.password || !form.confirmPassword) {
        error.value = 'Please fill in all fields'
        return false
      }

      if (form.password !== form.confirmPassword) {
        error.value = 'Passwords do not match'
        return false
      }

      if (form.password.length < 6) {
        error.value = 'Password must be at least 6 characters long'
        return false
      }

      if (form.username.length < 3) {
        error.value = 'Username must be at least 3 characters long'
        return false
      }

      return true
    }

    const handleRegister = async () => {
      console.log('🚀 handleRegister called')
      console.log('📝 Form data:', form)
      
      if (!validateForm()) {
        console.log('❌ Form validation failed')
        return
      }

      console.log('✅ Form validation passed')
      loading.value = true
      error.value = ''
      success.value = ''

      try {
        console.log('🌐 Making API call to register...')
        const registerResponse = await authAPI.register(form.username, form.password)
        
        if (registerResponse.user) {
          const userId = registerResponse.user
          console.log('✅ Registration successful - User:', userId)
          
          // Automatically authenticate the user after registration to get tokens
          console.log('🔐 Auto-authenticating after registration...')
          try {
            const authResponse = await authAPI.authenticate(form.username, form.password)
            
            if (authResponse.accessToken && authResponse.user) {
              const { accessToken, user: authenticatedUserId } = authResponse
              
              // Store tokens and user data
              authService.setTokens(accessToken, authenticatedUserId, form.username)
              
              // Fetch and store root folder
              try {
                const rootFolder = await requestAPI.getRootFolderId(authenticatedUserId, accessToken)
                if (rootFolder) {
                  authService.setRootFolder(rootFolder)
                  console.log('✅ Root folder stored:', rootFolder)
                }
              } catch (folderError) {
                console.error('⚠️ Could not fetch root folder, dashboard will try again:', folderError)
                // Continue anyway - dashboard can try to fetch it
              }
              
              console.log('✅ Auto-authentication successful')
              success.value = 'Account created successfully! Redirecting to dashboard...'
              
              // Dispatch auth-changed event to update navbar
              window.dispatchEvent(new Event('auth-changed'))
              
              setTimeout(() => {
                router.push('/dashboard')
              }, 2000)
            } else {
              error.value = 'Registration successful but authentication failed. Please log in.'
            }
          } catch (authError) {
            console.error('❌ Auto-authentication error:', authError)
            error.value = 'Registration successful but could not log you in. Please log in manually.'
            // Still redirect to login after a delay
            setTimeout(() => {
              router.push('/login')
            }, 3000)
          }
        } else {
          error.value = 'Registration failed'
        }
      } catch (err) {
        console.error('❌ Registration error:', err)
        error.value = err.error || 'Registration failed. Please try again.'
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      error,
      success,
      handleRegister
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
  background: var(--bg-secondary);
  padding: 2rem;
}

.auth-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 3rem;
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-secondary);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-image {
  height: 40px;
  width: auto;
  margin: 0 auto 1rem auto;
  display: block;
  background: transparent;
  transition: all var(--transition-fast);
}

/* Dark mode logo styling - make it white with transparent background */
[data-theme="dark"] .logo-image {
  filter: brightness(0) invert(1);
}

.logo-image:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* Dark mode hover effect */
[data-theme="dark"] .logo-image:hover {
  filter: brightness(0) invert(1) drop-shadow(0 2px 4px rgba(255, 255, 255, 0.2));
}

.auth-header p {
  color: var(--text-secondary);
  font-size: 1rem;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.btn-success {
  width: 100%;
  background: var(--success);
  color: var(--text-inverse);
  font-size: 1rem;
  padding: 0.875rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.btn-success:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--text-primary) !important;
}

.btn-success:disabled {
  background: var(--bg-tertiary);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.auth-footer {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border-primary);
}

.auth-footer a {
  color: var(--accent-blue);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.auth-footer a:hover {
  color: var(--accent-indigo);
  text-decoration: underline;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all var(--transition-fast);
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--border-accent);
  box-shadow: 0 0 0 2px rgba(30, 30, 30, 0.1);
}

.form-input:disabled {
  background: var(--bg-tertiary);
  color: var(--text-muted);
  cursor: not-allowed;
}

.error {
  background: var(--accent-error);
  color: var(--text-inverse);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.success {
  background: var(--success);
  color: var(--text-inverse);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
</style>
