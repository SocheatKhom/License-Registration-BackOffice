import apiClient from './axios'

export const usersApi = {
  /**
   * List users with search, role, status filters, and pagination
   * @param {object} params
   */
  list(params = {}) {
    return apiClient.get('/users', { params })
  },

  /**
   * Get single user by ID
   * @param {string} id
   */
  getById(id) {
    return apiClient.get(`/users/${id}`)
  },

  /**
   * Create a new user (SUPER_ADMIN only)
   * @param {{ name: string, email: string, password: string, role: string }} data
   */
  create(data) {
    return apiClient.post('/users', data)
  },

  /**
   * Update user details
   * @param {string} id
   * @param {object} data
   */
  update(id, data) {
    return apiClient.patch(`/users/${id}`, data)
  },

  /**
   * Change user role (SUPER_ADMIN only)
   * @param {string} id
   * @param {{ role: string }} data
   */
  changeRole(id, data) {
    return apiClient.patch(`/users/${id}/role`, data)
  },

  /**
   * Change user status (SUPER_ADMIN only)
   * @param {string} id
   * @param {{ status: string }} data
   */
  changeStatus(id, data) {
    return apiClient.patch(`/users/${id}/status`, data)
  },
}
