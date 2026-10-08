import apiClient from './axios'

export const applicationsApi = {
  /**
   * List applications with filters and pagination
   * @param {object} params
   */
  list(params = {}) {
    return apiClient.get('/applications', { params })
  },

  /**
   * Get application by ID
   * @param {string} id
   */
  getById(id) {
    return apiClient.get(`/applications/${id}`)
  },

  /**
   * Create application
   * @param {object} data
   */
  create(data) {
    return apiClient.post('/applications', data)
  },

  /**
   * Update application
   * @param {string} id
   * @param {object} data
   */
  update(id, data) {
    return apiClient.patch(`/applications/${id}`, data)
  },

  /**
   * Submit application
   * @param {string} id
   */
  submit(id) {
    return apiClient.post(`/applications/${id}/submit`)
  },

  /**
   * Review application (ADMIN / SUPER_ADMIN)
   * @param {string} id
   * @param {{ action: string, comments?: string }} data
   */
  review(id, data) {
    return apiClient.post(`/applications/${id}/review`, data)
  },
}
