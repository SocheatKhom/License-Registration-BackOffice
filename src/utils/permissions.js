import { ROLES } from '@/constants/roles'

export function hasRole(user, allowedRoles = []) {
  if (!user || !user.role) return false
  if (!allowedRoles || allowedRoles.length === 0) return true
  return allowedRoles.includes(user.role)
}

export function isSuperAdmin(user) {
  return user?.role === ROLES.SUPER_ADMIN
}

export function isAdmin(user) {
  return user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN
}
