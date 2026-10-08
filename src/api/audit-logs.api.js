import apiClient from './axios'

export const auditLogsApi = {
  /**
   * List audit logs with filters and pagination (SUPER_ADMIN only)
   * @param {object} params
   */
  list(params = {}) {
    return apiClient.get('/audit-logs', { params })
  },

  /**
   * Get single audit log record by ID
   * @param {string} id
   */
  getById(id) {
    return apiClient.get(`/audit-logs/${id}`)
  },
}
