import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationsApi } from '@/api/notifications.api'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const mobileSidebarOpen = ref(false)
  const unreadNotificationsCount = ref(0)
  const loadingNotifications = ref(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSidebarCollapsed(val) {
    sidebarCollapsed.value = Boolean(val)
  }

  function toggleMobileSidebar() {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }

  function closeMobileSidebar() {
    mobileSidebarOpen.value = false
  }

  async function fetchUnreadNotifications() {
    loadingNotifications.value = true
    try {
      const response = await notificationsApi.getMyNotifications({ limit: 1, isRead: 'false' })
      if (response?.data?.unreadCount !== undefined) {
        unreadNotificationsCount.value = response.data.unreadCount
      }
    } catch (err) {
      // Non-blocking notification fetch failure
      console.warn('Failed to fetch unread notifications count:', err.message)
    } finally {
      loadingNotifications.value = false
    }
  }

  return {
    sidebarCollapsed,
    mobileSidebarOpen,
    unreadNotificationsCount,
    loadingNotifications,
    toggleSidebar,
    setSidebarCollapsed,
    toggleMobileSidebar,
    closeMobileSidebar,
    fetchUnreadNotifications,
  }
})
