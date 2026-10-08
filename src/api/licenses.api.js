import apiClient from './axios'

export const licensesApi = {
  /**
   * List licenses with filters and pagination
   * @param {object} params
   */
  list(params = {}) {
    return apiClient.get('/licenses', { params })
  },

  /**
   * Get license by ID
   * @param {string} id
   */
  getById(id) {
    return apiClient.get(`/licenses/${id}`)
  },

  /**
   * Revoke license
   * @param {string} id
   * @param {{ reason: string }} data
   */
  revoke(id, data) {
    return apiClient.post(`/licenses/${id}/revoke`, data)
  },
}
