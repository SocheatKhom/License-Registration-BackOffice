import { storage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { hasRole } from '@/utils/permissions'

export function setupGuards(router) {
  router.beforeEach((to, from, next) => {
    const token = storage.get(STORAGE_KEYS.TOKEN)
    const user = storage.get(STORAGE_KEYS.USER)
    const isAuthenticated = Boolean(token)

    // Route for guests only (e.g. /login)
    if (to.meta.guestOnly && isAuthenticated) {
      return next({ path: '/dashboard' })
    }

    // Protected route
    if (to.meta.requiresAuth) {
      if (!isAuthenticated) {
        return next({
          path: '/login',
          query: { redirect: to.fullPath },
        })
      }

      // Role check
      if (to.meta.roles && to.meta.roles.length > 0) {
        if (!hasRole(user, to.meta.roles)) {
          return next({ path: '/403' })
        }
      }
    }

    next()
  })
}
