import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards'
import { ROLES } from '@/constants/roles'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/',
      component: () => import('@/components/layout/AdminLayout.vue'),
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue'),
          meta: {
            title: 'navigation.dashboard',
          },
        },
        {
          path: 'applications',
          name: 'applications',
          component: () => import('@/views/applications/ApplicationListView.vue'),
          meta: {
            title: 'navigation.applications',
          },
        },
        {
          path: 'applications/:id',
          name: 'application-detail',
          component: () => import('@/views/applications/ApplicationDetailView.vue'),
          meta: {
            title: 'application.detail',
          },
        },
        {
          path: 'licenses',
          name: 'licenses',
          component: () => import('@/views/licenses/LicenseListView.vue'),
          meta: {
            title: 'navigation.licenses',
          },
        },
        {
          path: 'licenses/:id',
          name: 'license-detail',
          component: () => import('@/views/licenses/LicenseDetailView.vue'),
          meta: {
            title: 'license.detail',
          },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/users/UserListView.vue'),
          meta: {
            title: 'navigation.users',
            roles: [ROLES.SUPER_ADMIN],
          },
        },
        {
          path: 'audit-logs',
          name: 'audit-logs',
          component: () => import('@/views/audit/AuditLogListView.vue'),
          meta: {
            title: 'navigation.auditLogs',
            roles: [ROLES.SUPER_ADMIN],
          },
        },
        {
          path: 'notifications',
          name: 'notifications',
          component: () => import('@/views/notifications/NotificationListView.vue'),
          meta: {
            title: 'navigation.notifications',
          },
        },
      ],
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/views/errors/ForbiddenView.vue'),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/errors/NotFoundView.vue'),
      meta: {
        requiresAuth: false,
      },
    },
  ],
})

setupGuards(router)

export default router
