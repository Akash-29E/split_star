import apiService from './api';

export const groupService = {
  // Get all groups for authenticated user
  async getAllGroups() {
    try {
      const response = await apiService.get('/groups');
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch groups');
    }
  },

  // Get specific group by ID
  async getGroup(groupId) {
    try {
      const response = await apiService.get(`/groups/${groupId}`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch group');
    }
  },

  // Get group by UUID (public access, no authentication required)
  async getGroupByUUID(uuid) {
    try {
      const url = `${apiService.baseURL}/groups/uuid/${uuid}`
      console.log('Making request to URL:', url)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch group');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch group by UUID');
    }
  },

  // Verify PIN and get full group access
  async verifyGroupPin(uuid, pin) {
    try {
      const response = await fetch(`${apiService.baseURL}/groups/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uuid, pin })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify PIN');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to verify PIN');
    }
  },

  // Create new group
  async createGroup(groupData) {
    try {
      const response = await apiService.post('/groups', groupData);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to create group');
    }
  },

  // Update existing group
  async updateGroup(groupId, updateData) {
    try {
      const response = await apiService.put(`/groups/${groupId}`, updateData);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update group');
    }
  },

  // Delete group (soft delete)
  async deleteGroup(groupId) {
    try {
      const response = await apiService.delete(`/groups/${groupId}`);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete group');
    }
  },

  // Transform frontend group data to backend format
  transformGroupData(frontendData) {
    const personNames = frontendData.personNames || {};
    return {
      groupName: frontendData.groupName,
      description: frontendData.description || '',
      personCount: parseInt(frontendData.personCount),
      personNames: personNames,
      adminName: personNames["1"] || 'Admin', // Extract admin name from personNames
      settings: {
        isPrivate: frontendData.isPrivate || false,
        allowInvites: frontendData.allowInvites !== false,
        emailNotifications: frontendData.emailNotifications !== false,
        pushNotifications: frontendData.pushNotifications !== false
      }
    };
  },

  // Transform backend group data to frontend format
  transformBackendData(backendData) {
    return {
      id: backendData._id,
      uuid: backendData.uuid,
      pin: backendData.pin,
      groupName: backendData.groupName,
      description: backendData.description,
      personCount: backendData.personCount,
      personNames: backendData.personNames,
      createdBy: backendData.createdBy,
      members: backendData.members,
      settings: backendData.settings,
      createdAt: backendData.createdAt,
      updatedAt: backendData.updatedAt,
      ...backendData.settings // Spread settings to top level for backward compatibility
    };
  },

  // Generate shareable URL for group
  getShareableURL(uuid) {
    const baseURL = window.location.origin;
    return `${baseURL}/group/${uuid}`;
  },

  // Copy group URL to clipboard
  async copyGroupURL(uuid) {
    const url = this.getShareableURL(uuid);
    try {
      await navigator.clipboard.writeText(url);
      return { success: true, url };
    } catch (error) {
      // Fallback for older browsers
      console.warn('Clipboard API not available, using fallback:', error.message);
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return { success: true, url };
    }
  },

  // Create split for a group
  async createSplit(groupUuid, splitData) {
    try {
      const url = `${apiService.baseURL}/groups/${groupUuid}/splits`;
      console.log('🚀 Making split API call to:', url);
      console.log('📤 Split data:', splitData);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(splitData)
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ Error response text:', responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || 'Failed to create split');
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          throw new Error(`Server error: ${response.status} - ${responseText.substring(0, 100)}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ Success response:', data);
      return data;
    } catch (error) {
      console.error('❌ Full error:', error);
      throw new Error(error.message || 'Failed to create split');
    }
  },

  // Delete split from a group
  async deleteSplit(groupUuid, splitId, userData) {
    try {
      const url = `${apiService.baseURL}/groups/${groupUuid}/splits/${splitId}`;
      console.log('🗑️ Making delete split API call to:', url);
      console.log('👤 User data:', userData);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userData.id,
          userPin: userData.pin,
          userName: userData.name
        })
      });
      
      console.log('📥 Delete response status:', response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ Delete error response:', responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || 'Failed to delete split');
        } catch (parseError) {
          console.error('❌ Failed to parse delete error response:', parseError);
          throw new Error(`Server error: ${response.status} - ${responseText.substring(0, 100)}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ Delete success response:', data);
      return data;
    } catch (error) {
      console.error('❌ Delete split error:', error);
      throw new Error(error.message || 'Failed to delete split');
    }
  },

  // Get splits for a group
  async getSplits(groupUuid) {
    try {
      const url = `${apiService.baseURL}/groups/${groupUuid}/splits`;
      console.log('🔍 Fetching splits from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Get splits response status:', response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ Get splits error response:', responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || 'Failed to fetch splits');
        } catch (parseError) {
          console.error('❌ Failed to parse splits error response:', parseError);
          throw new Error(`Server error: ${response.status} - ${responseText.substring(0, 100)}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ Got splits:', data);
      return data;
    } catch (error) {
      console.error('❌ Get splits full error:', error);
      throw new Error(error.message || 'Failed to fetch splits');
    }
  },

  // Add a new member to a group
  async addMember(groupUuid, memberData) {
    try {
      const url = `${apiService.baseURL}/groups/${groupUuid}/members`;
      console.log('👤 Adding member to group:', groupUuid);
      console.log('📤 Member data:', memberData);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(memberData)
      });
      
      console.log('📥 Add member response status:', response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ Add member error response:', responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || 'Failed to add member');
        } catch (parseError) {
          console.error('❌ Failed to parse add member error response:', parseError);
          throw new Error(`Server error: ${response.status} - ${responseText.substring(0, 100)}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ Member added successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Add member full error:', error);
      throw new Error(error.message || 'Failed to add member');
    }
  }
};

// Export standalone functions for easier imports
export const getGroupByUUID = groupService.getGroupByUUID.bind(groupService);
export const verifyGroupPin = groupService.verifyGroupPin.bind(groupService);

export default groupService;