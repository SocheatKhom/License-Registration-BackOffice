import apiClient from './axios'

export const authApi = {
  /**
   * User login
   * @param {{ email: string, password: string }} credentials
   */
  login(credentials) {
    return apiClient.post('/auth/login', credentials)
  },

  /**
   * Get current authenticated user profile
   */
  getMe() {
    return apiClient.get('/auth/me')
  },

  /**
   * Log out user
   */
  logout() {
    return apiClient.post('/auth/logout')
  },
}
