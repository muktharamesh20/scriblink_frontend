<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>ScribLink</h1>
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
import { requestAPI } from '../services/apiServices.js'
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
        const response = await requestAPI.registerUser(form.username, form.password)
        
        if (response.user) {
          // Store both user and root folder data
          authService.setUserData({
            user: response.user,
            rootFolder: response.rootFolder
          })
          success.value = 'Account created successfully! Redirecting to login...'
          setTimeout(() => {
            router.push('/login')
          }, 2000)
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

.btn-success {
  width: 100%;
  background: #27ae60;
  font-size: 1rem;
  padding: 0.875rem;
}

.btn-success:hover {
  background: #229954;
}

.btn-success:disabled {
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
