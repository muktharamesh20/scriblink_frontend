<template>
  <div id="app">
    <nav class="navbar" v-if="isAuthenticated">
      <div class="nav-brand">
        <img src="/scriblink.png" alt="ScribLink" class="logo-image" />
      </div>
      <div class="nav-actions">
        <button @click="cycleTheme" class="theme-toggle" :title="getThemeTitle()">
          <div class="theme-icon">
            <div class="theme-circle" :class="getThemeClass()"></div>
          </div>
        </button>
        <span class="user-info">Welcome, {{ currentUser }}</span>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from './services/authService.js'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    
    // Use reactive refs for authentication state
    const isAuthenticated = ref(!!localStorage.getItem('user'))
    const currentUser = ref(authService.getUsername() || '')
    
    // Theme management - only light and dark
    const themes = ['light', 'dark']
    const currentThemeIndex = ref(0)
    
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme && themes.includes(savedTheme)) {
      currentThemeIndex.value = themes.indexOf(savedTheme)
    }
    
    // Apply theme on mount
    onMounted(() => {
      document.documentElement.setAttribute('data-theme', themes[currentThemeIndex.value])
    })
    
    const cycleTheme = () => {
      currentThemeIndex.value = (currentThemeIndex.value + 1) % themes.length
      const theme = themes[currentThemeIndex.value]
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    }
    
    const getThemeTitle = () => {
      const themeNames = {
        'light': 'Light Mode',
        'dark': 'Dark Mode'
      }
      const currentTheme = themes[currentThemeIndex.value]
      const nextTheme = themes[(currentThemeIndex.value + 1) % themes.length]
      return `Current: ${themeNames[currentTheme]} - Click for ${themeNames[nextTheme]}`
    }
    
    const getThemeClass = () => {
      const themeClasses = {
        'light': 'light-mode',
        'dark': 'dark-mode'
      }
      return themeClasses[themes[currentThemeIndex.value]]
    }
    
    // Function to update auth state
    const updateAuthState = () => {
      isAuthenticated.value = !!localStorage.getItem('user')
      currentUser.value = authService.getUsername() || ''
    }
    
    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        updateAuthState()
      }
    }
    
    onMounted(() => {
      window.addEventListener('storage', handleStorageChange)
      // Also listen for custom events for same-tab changes
      window.addEventListener('auth-changed', updateAuthState)
    })
    
    onUnmounted(() => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-changed', updateAuthState)
    })
    
    const logout = () => {
      authService.removeUser()
      // Update reactive state
      isAuthenticated.value = false
      currentUser.value = ''
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event('auth-changed'))
      router.push('/login')
    }
    
    return {
      isAuthenticated,
      currentUser,
      cycleTheme,
      getThemeTitle,
      getThemeClass,
      logout
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-secondary);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color var(--transition-normal), color var(--transition-normal);
}

#app {
  min-height: 100vh;
}

.navbar {
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
  border-bottom: 1px solid var(--border-secondary);
}

.nav-brand {
  display: flex;
  align-items: center;
}

.logo-image {
  height: 20px;
  width: auto;
  background: transparent;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: all var(--transition-fast);
}

/* Dark mode logo styling - make it white with transparent background */
[data-theme="dark"] .logo-image {
  filter: brightness(0) invert(1) drop-shadow(0 2px 4px rgba(255, 255, 255, 0.3));
}

.logo-image:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
}

/* Dark mode hover effect */
[data-theme="dark"] .logo-image:hover {
  filter: brightness(0) invert(1) drop-shadow(0 4px 8px rgba(255, 255, 255, 0.4));
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-toggle {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.theme-toggle:hover {
  background: var(--bg-hover);
  border-color: var(--border-accent);
  transform: scale(1.05);
  box-shadow: var(--shadow-sm);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.theme-icon {
  width: 20px;
  height: 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--text-primary);
  transition: all var(--transition-fast);
  position: relative;
}

.theme-circle.light-mode {
  background: var(--accent-primary);
  box-shadow: inset 0 0 0 2px var(--bg-primary);
}

.theme-circle.dark-mode {
  background: var(--accent-primary);
  box-shadow: inset 0 0 0 2px var(--bg-primary);
}

.theme-circle::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bg-primary);
  transition: all var(--transition-fast);
}

.theme-circle.light-mode::before {
  background: var(--text-primary);
  transform: scale(0.3);
}

.theme-circle.dark-mode::before {
  background: var(--text-primary);
  transform: scale(0.3);
}

.user-info {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
}

.logout-btn {
  background: var(--text-primary);
  color: var(--text-inverse);
  border: 1px solid var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.logout-btn:hover {
  background: var(--text-secondary);
  border-color: var(--text-secondary);
  transform: none;
  box-shadow: var(--shadow-sm);
}

.main-content {
  padding: 0;
  max-width: 100%;
  margin: 0 auto;
}

.btn {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-family: var(--font-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition-fast);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: none;
  position: relative;
  overflow: hidden;
  letter-spacing: 0;
}

.btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-accent);
  transform: none;
  box-shadow: var(--shadow-sm);
}

.btn:active {
  transform: none;
  box-shadow: none;
}

.btn-primary {
  background: var(--text-primary);
  border-color: var(--text-primary);
  color: var(--text-inverse);
  font-weight: 600;
}

.btn-primary:hover {
  background: var(--text-secondary);
  border-color: var(--text-secondary);
  box-shadow: var(--shadow-sm);
}

.btn-primary:active {
  background: var(--text-primary);
  transform: none;
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  font-weight: 500;
}

.btn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--border-accent);
  color: var(--text-primary);
}

.btn-danger {
  background: var(--error);
  border-color: var(--error);
  color: var(--text-inverse);
  font-weight: 600;
}

.btn-danger:hover {
  background: var(--text-secondary);
  border-color: var(--text-secondary);
}

.btn-success {
  background: var(--success);
  border-color: var(--success);
  color: var(--text-inverse);
  font-weight: 600;
}

.btn-success:hover {
  background: #2d8f47;
  border-color: #2d8f47;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  border-radius: 6px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-family: var(--font-secondary);
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  font-family: var(--font-secondary);
  font-size: 1rem;
  background: var(--bg-card);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(66, 165, 245, 0.1);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  margin-bottom: 1rem;
  border: 1px solid var(--border-primary);
  transition: all var(--transition-normal);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.grid {
  display: grid;
  gap: 1rem;
}

.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.text-center {
  text-align: center;
}

.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 1.5rem; }

.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mt-3 { margin-top: 1.5rem; }

.flex {
  display: flex;
}

.flex-between {
  justify-content: space-between;
}

.flex-center {
  align-items: center;
}

.gap-1 { gap: 0.5rem; }
.gap-2 { gap: 1rem; }

.text-muted {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.error {
  color: var(--error);
  background: rgba(244, 67, 54, 0.1);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid rgba(244, 67, 54, 0.2);
}

.success {
  color: var(--success);
  background: rgba(102, 187, 106, 0.1);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid rgba(102, 187, 106, 0.2);
}
</style>
