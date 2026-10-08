import { ref, reactive } from 'vue'
import { applicationsApi } from '@/api/applications.api'
import { licensesApi } from '@/api/licenses.api'
import { notificationsApi } from '@/api/notifications.api'
import { useAuthStore } from '@/stores/auth.store'

export function useDashboard() {
  const authStore = useAuthStore()

  const loading = ref(false)
  const error = ref(null)

  const stats = reactive({
    totalApplications: 0,
    pendingReview: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
  })

  const recentApplications = ref([])
  const recentNotifications = ref([])

  // Helper to extract total count whether in payload.pagination or payload.data.pagination or array length
  function extractCount(response) {
    if (!response) return 0
    // Backend standard: { success: true, data: [...], pagination: { totalItems: 4 } }
    if (response.pagination && response.pagination.totalItems !== undefined) {
      return Number(response.pagination.totalItems)
    }
    if (response.data && response.data.pagination && response.data.pagination.totalItems !== undefined) {
      return Number(response.data.pagination.totalItems)
    }
    if (Array.isArray(response.data)) {
      return response.data.length
    }
    return 0
  }

  // Helper to extract array from response
  function extractArray(response) {
    if (!response) return []
    if (Array.isArray(response.data)) {
      return response.data
    }
    if (response.data && Array.isArray(response.data.applications)) {
      return response.data.applications
    }
    if (response.data && Array.isArray(response.data.licenses)) {
      return response.data.licenses
    }
    if (response.data && Array.isArray(response.data.notifications)) {
      return response.data.notifications
    }
    return []
  }

  async function fetchDashboardData() {
    loading.value = true
    error.value = null

    try {
      const requests = [
        // 0. Total applications
        applicationsApi.list({ limit: 1 }),
        // 1. Pending review (SUBMITTED)
        applicationsApi.list({ status: 'SUBMITTED', limit: 1 }),
        // 2. Under review (UNDER_REVIEW)
        applicationsApi.list({ status: 'UNDER_REVIEW', limit: 1 }),
        // 3. Approved (APPROVED)
        applicationsApi.list({ status: 'APPROVED', limit: 1 }),
        // 4. Rejected (REJECTED)
        applicationsApi.list({ status: 'REJECTED', limit: 1 }),
        // 5. Recent applications (limit 5)
        applicationsApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'DESC' }),
        // 6. Recent notifications (limit 5)
        notificationsApi.getMyNotifications({ limit: 5 }).catch(() => null),
      ]

      // Admin or Super Admin query licenses
      if (authStore.isAdmin) {
        requests.push(licensesApi.list({ status: 'ACTIVE', limit: 1 }).catch(() => null))
        requests.push(licensesApi.list({ status: 'EXPIRED', limit: 1 }).catch(() => null))
      }

      const results = await Promise.all(requests)

      // Total applications
      stats.totalApplications = extractCount(results[0])
      // Pending
      stats.pendingReview = extractCount(results[1])
      // Under Review
      stats.underReview = extractCount(results[2])
      // Approved
      stats.approved = extractCount(results[3])
      // Rejected
      stats.rejected = extractCount(results[4])

      // Recent Applications array
      recentApplications.value = extractArray(results[5])

      // Recent Notifications array
      recentNotifications.value = results[6]?.data?.notifications || extractArray(results[6])

      // Licenses
      if (authStore.isAdmin && results.length >= 9) {
        stats.activeLicenses = extractCount(results[7])
        stats.expiredLicenses = extractCount(results[8])
      }
    } catch (err) {
      console.error('Dashboard load failed:', err)
      error.value = err.message || 'Unable to retrieve dashboard metrics from the licensing server.'
    } finally {
      loading.value = false
    }
  }

  async function markAllNotificationsRead() {
    try {
      await notificationsApi.markAllAsRead()
      recentNotifications.value.forEach(n => { n.is_read = true })
    } catch (e) {
      console.warn('Failed to mark notifications read:', e)
    }
  }

  return {
    loading,
    error,
    stats,
    recentApplications,
    recentNotifications,
    fetchDashboardData,
    markAllNotificationsRead,
  }
}
