import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await authStore.logout()
    router.push('/login')
  }

  return {
    authStore,
    isAuthenticated: authStore.isAuthenticated,
    currentUser: authStore.currentUser,
    userRole: authStore.userRole,
    isSuperAdmin: authStore.isSuperAdmin,
    isAdmin: authStore.isAdmin,
    logout: handleLogout,
  }
}
