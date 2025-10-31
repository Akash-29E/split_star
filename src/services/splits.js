import { api } from './api.js';

export const splitService = {
  // Create a new split
  async createSplit(splitData) {
    try {
      const response = await api.post('/splits', splitData);
      return response.data;
    } catch (error) {
      console.error('Create split error:', error);
      throw error.response?.data || error;
    }
  },

  // Get all splits for a group
  async getGroupSplits(groupId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);

      const queryString = params.toString();
      const url = `/splits/group/${groupId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Get group splits error:', error);
      throw error.response?.data || error;
    }
  },

  // Get splits for a specific member
  async getMemberSplits(memberId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);

      const queryString = params.toString();
      const url = `/splits/member/${memberId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Get member splits error:', error);
      throw error.response?.data || error;
    }
  },

  // Get a specific split by ID
  async getSplit(splitId) {
    try {
      const response = await api.get(`/splits/${splitId}`);
      return response.data;
    } catch (error) {
      console.error('Get split error:', error);
      throw error.response?.data || error;
    }
  },

  // Update a split
  async updateSplit(splitId, updates) {
    try {
      const response = await api.put(`/splits/${splitId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Update split error:', error);
      throw error.response?.data || error;
    }
  },

  // Record a payment for a split
  async recordPayment(splitId, paymentData) {
    try {
      const response = await api.post(`/splits/${splitId}/payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Record payment error:', error);
      throw error.response?.data || error;
    }
  },

  // Cancel/Delete a split
  async cancelSplit(splitId) {
    try {
      const response = await api.delete(`/splits/${splitId}`);
      return response.data;
    } catch (error) {
      console.error('Cancel split error:', error);
      throw error.response?.data || error;
    }
  },

  // Helper method to calculate split amounts
  calculateSplitAmounts(baseAmount, taxPercentage, memberSplits, splitMethod) {
    const taxAmount = (baseAmount * taxPercentage) / 100;
    const totalAmount = baseAmount + taxAmount;
    
    const result = {
      taxAmount,
      totalAmount,
      memberSplits: []
    };

    if (!memberSplits || memberSplits.length === 0) {
      return result;
    }

    const participatingMembers = memberSplits.filter(split => split.isParticipating);
    
    switch (splitMethod) {
      case 'equal':
        participatingMembers.forEach(split => {
          result.memberSplits.push({
            ...split,
            owedAmount: totalAmount / participatingMembers.length
          });
        });
        break;

      case 'amount':
        participatingMembers.forEach(split => {
          result.memberSplits.push({
            ...split,
            owedAmount: split.splitValue?.amount || 0
          });
        });
        break;

      case 'percentage':
        participatingMembers.forEach(split => {
          const percentage = split.splitValue?.percentage || 0;
          result.memberSplits.push({
            ...split,
            owedAmount: (totalAmount * percentage) / 100
          });
        });
        break;

      case 'shares': {
        const totalShares = participatingMembers.reduce((sum, split) => {
          return sum + (split.splitValue?.shares || 1);
        }, 0);
        
        participatingMembers.forEach(split => {
          const shares = split.splitValue?.shares || 1;
          result.memberSplits.push({
            ...split,
            owedAmount: (totalAmount * shares) / totalShares
          });
        });
        break;
      }

      default:
        // Default to equal split
        participatingMembers.forEach(split => {
          result.memberSplits.push({
            ...split,
            owedAmount: totalAmount / participatingMembers.length
          });
        });
    }

    // Round amounts to 2 decimal places
    result.memberSplits.forEach(split => {
      split.owedAmount = Math.round(split.owedAmount * 100) / 100;
    });

    return result;
  },

  // Validate split data before submission
  validateSplit(splitData) {
    const errors = [];

    if (!splitData.splitTitle?.trim()) {
      errors.push('Split title is required');
    }

    if (!splitData.baseAmount || splitData.baseAmount <= 0) {
      errors.push('Base amount must be greater than 0');
    }

    if (splitData.taxPercentage && (splitData.taxPercentage < 0 || splitData.taxPercentage > 100)) {
      errors.push('Tax percentage must be between 0 and 100');
    }

    if (!splitData.memberSplits || splitData.memberSplits.length === 0) {
      errors.push('At least one member must be selected');
    }

    const participatingMembers = splitData.memberSplits?.filter(split => split.isParticipating) || [];
    if (participatingMembers.length === 0) {
      errors.push('At least one member must be participating');
    }

    // Validate split method specific requirements
    if (splitData.splitMethod === 'percentage') {
      const totalPercentage = participatingMembers.reduce((sum, split) => {
        return sum + (split.splitValue?.percentage || 0);
      }, 0);
      
      if (Math.abs(totalPercentage - 100) > 0.01) {
        errors.push('Split percentages must add up to 100%');
      }
    }

    if (splitData.splitMethod === 'amount') {
      const totalSplitAmount = participatingMembers.reduce((sum, split) => {
        return sum + (split.splitValue?.amount || 0);
      }, 0);
      
      const expectedTotal = splitData.baseAmount + (splitData.baseAmount * (splitData.taxPercentage || 0) / 100);
      
      if (Math.abs(totalSplitAmount - expectedTotal) > 0.01) {
        errors.push('Split amounts must add up to the total amount including tax');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default splitService;