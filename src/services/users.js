import apiService from './api';

export const userService = {
  // Get current user profile
  async getProfile() {
    try {
      const response = await apiService.get('/users/profile');
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch user profile');
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiService.put('/users/profile', profileData);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  // Search users
  async searchUsers(query, limit = 10) {
    try {
      const response = await apiService.get(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to search users');
    }
  },

  // Deactivate user account
  async deactivateAccount() {
    try {
      const response = await apiService.delete('/users/profile');
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to deactivate account');
    }
  }
};

export default userService;