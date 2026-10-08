import apiClient from './axios'

export const notificationsApi = {
  /**
   * Get user notifications
   * @param {object} params
   */
  getMyNotifications(params = {}) {
    return apiClient.get('/notifications', { params })
  },

  /**
   * Mark notification as read
   * @param {string} id
   */
  markAsRead(id) {
    return apiClient.patch(`/notifications/${id}/read`)
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    return apiClient.patch('/notifications/read-all')
  },
}
