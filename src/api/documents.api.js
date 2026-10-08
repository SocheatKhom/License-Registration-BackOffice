import apiClient from './axios'

export const documentsApi = {
  /**
   * Get all documents attached to an application
   * @param {string} applicationId
   */
  getByApplication(applicationId) {
    return apiClient.get(`/applications/${applicationId}/documents`)
  },

  /**
   * Get single document metadata
   * @param {string} id
   */
  getById(id) {
    return apiClient.get(`/documents/${id}`)
  },

  /**
   * Securely download document with Bearer token
   * @param {string} id
   * @param {string} filename
   */
  async downloadDocument(id, filename = 'document.pdf') {
    const response = await apiClient.get(`/documents/${id}?download=true`, {
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => window.URL.revokeObjectURL(url), 1000)
  },

  /**
   * Securely stream and create preview blob URL
   * @param {string} id
   */
  async previewDocument(id) {
    const response = await apiClient.get(`/documents/${id}?view=true`, {
      responseType: 'blob',
    })
    const mimeType = response.headers['content-type'] || 'application/pdf'
    const blob = new Blob([response.data], { type: mimeType })
    return {
      url: window.URL.createObjectURL(blob),
      mimeType,
    }
  },

  /**
   * Delete document
   * @param {string} id
   */
  delete(id) {
    return apiClient.delete(`/documents/${id}`)
  },
}
