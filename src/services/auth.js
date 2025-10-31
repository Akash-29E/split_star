import apiService from './api';

export const authService = {
  // Register a new user
  async register(userData) {
    try {
      const response = await apiService.post('/auth/register', userData, { includeAuth: false });
      
      if (response.success && response.data.token) {
        apiService.setAuthToken(response.data.token);
      }
      
      return response;
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  // Login user
  async login(credentials) {
    try {
      const response = await apiService.post('/auth/login', credentials, { includeAuth: false });
      
      if (response.success && response.data.token) {
        apiService.setAuthToken(response.data.token);
      }
      
      return response;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  },

  // Verify authentication token
  async verifyToken(token) {
    try {
      const response = await apiService.post('/auth/verify-token', { token }, { includeAuth: false });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Token verification failed');
    }
  },

  // Logout user
  logout() {
    apiService.removeAuthToken();
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!apiService.getAuthToken();
  },

  // Get current user token
  getToken() {
    return apiService.getAuthToken();
  }
};

export default authService;