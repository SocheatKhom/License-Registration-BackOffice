import axios from 'axios'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { storage } from '@/utils/storage'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.get(STORAGE_KEYS.TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: extract response & handle 401
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const status = error.response ? error.response.status : null

    if (status === 401) {
      storage.remove(STORAGE_KEYS.TOKEN)
      storage.remove(STORAGE_KEYS.USER)

      if (window.location.pathname !== '/login') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      }
    }

    const customError = {
      status,
      message: error.response?.data?.message || error.message || 'An unexpected error occurred.',
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      errors: error.response?.data?.errors || null,
    }

    return Promise.reject(customError)
  }
)

export default apiClient
