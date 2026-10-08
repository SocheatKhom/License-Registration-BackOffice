import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'
import { storage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { ROLES } from '@/constants/roles'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(storage.get(STORAGE_KEYS.TOKEN, null))
  const user = ref(storage.get(STORAGE_KEYS.USER, null))
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => Boolean(token.value))
  const currentUser = computed(() => user.value)
  const userRole = computed(() => user.value?.role || null)
  const isSuperAdmin = computed(() => user.value?.role === ROLES.SUPER_ADMIN)
  const isAdmin = computed(() => [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user.value?.role))

  // Safe display name resolving 'name' (backend model), 'full_name', or 'email'
  const displayName = computed(() => {
    if (!user.value) return ''
    return (
      user.value.name ||
      user.value.full_name ||
      [user.value.first_name, user.value.last_name].filter(Boolean).join(' ') ||
      user.value.email ||
      ''
    )
  })

  /**
   * Initialize state from storage & refresh profile
   */
  async function initialize() {
    const storedToken = storage.get(STORAGE_KEYS.TOKEN, null)
    if (storedToken) {
      token.value = storedToken
      try {
        const response = await authApi.getMe()
        if (response?.data) {
          user.value = response.data
          storage.set(STORAGE_KEYS.USER, response.data)
        }
      } catch (err) {
        if (err.status === 401) {
          logout()
        }
      }
    }
  }

  /**
   * Login action
   */
  async function login(credentials) {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.login(credentials)
      const data = response.data
      token.value = data.token
      user.value = data.user

      storage.set(STORAGE_KEYS.TOKEN, data.token)
      storage.set(STORAGE_KEYS.USER, data.user)

      return data
    } catch (err) {
      error.value = err.message || 'Login failed.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh profile
   */
  async function fetchCurrentUser() {
    try {
      const response = await authApi.getMe()
      if (response?.data) {
        user.value = response.data
        storage.set(STORAGE_KEYS.USER, response.data)
      }
      return user.value
    } catch (err) {
      console.error('Failed to fetch user:', err)
      throw err
    }
  }

  /**
   * Logout action
   */
  async function logout() {
    try {
      if (token.value) {
        await authApi.logout().catch(() => {})
      }
    } finally {
      token.value = null
      user.value = null
      error.value = null
      storage.remove(STORAGE_KEYS.TOKEN)
      storage.remove(STORAGE_KEYS.USER)
    }
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    currentUser,
    userRole,
    displayName,
    isSuperAdmin,
    isAdmin,
    initialize,
    login,
    fetchCurrentUser,
    logout,
  }
})
