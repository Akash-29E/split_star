import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const splitSchema = new mongoose.Schema({
  // Unique identifier for the split
  uuid: {
    type: String,
    unique: true,
    default: uuidv4,
    immutable: true
  },

  // Reference to the group this split belongs to
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Group ID is required']
  },

  // Split basic information
  splitTitle: {
    type: String,
    required: [true, 'Split title is required'],
    trim: true,
    maxlength: [200, 'Split title cannot exceed 200 characters']
  },

  splitDescription: {
    type: String,
    trim: true,
    maxlength: [1000, 'Split description cannot exceed 1000 characters']
  },

  // Split type (Split or Subsplit)
  splitType: {
    type: String,
    enum: ['split', 'subsplit'],
    required: [true, 'Split type is required'],
    default: 'split'
  },

  // Financial details
  baseAmount: {
    type: Number,
    required: [true, 'Base amount is required'],
    min: [0, 'Base amount cannot be negative']
  },

  taxPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Tax percentage cannot be negative'],
    max: [100, 'Tax percentage cannot exceed 100%']
  },

  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },

  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },

  // Split method (how the expense is divided)
  splitMethod: {
    type: String,
    enum: ['equal', 'amount', 'percentage', 'shares'],
    required: [true, 'Split method is required'],
    default: 'equal'
  },

  // Image/receipt information
  receiptImage: {
    url: {
      type: String,
      trim: true
    },
    filename: {
      type: String,
      trim: true
    },
    uploadedAt: {
      type: Date
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Member participation and split details
  memberSplits: [{
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    memberName: {
      type: String,
      required: true,
      trim: true
    },
    isParticipating: {
      type: Boolean,
      required: true,
      default: true
    },
    // Split values based on method
    splitValue: {
      amount: {
        type: Number,
        min: [0, 'Split amount cannot be negative'],
        default: 0
      },
      percentage: {
        type: Number,
        min: [0, 'Split percentage cannot be negative'],
        max: [100, 'Split percentage cannot exceed 100%'],
        default: 0
      },
      shares: {
        type: Number,
        min: [0, 'Split shares cannot be negative'],
        default: 1
      }
    },
    // Calculated final amount this member owes
    owedAmount: {
      type: Number,
      required: true,
      min: [0, 'Owed amount cannot be negative'],
      default: 0
    },
    // Payment status
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending'
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative']
    },
    paidAt: {
      type: Date
    }
  }],

  // Split metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },

  createdByName: {
    type: String,
    required: true,
    trim: true
  },

  // Split status
  splitStatus: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },

  // Settlement information
  settlementDate: {
    type: Date
  },

  settlementNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Settlement notes cannot exceed 500 characters']
  },

  // Activity tracking
  activities: [{
    activityType: {
      type: String,
      enum: ['created', 'modified', 'payment_made', 'payment_reminder', 'completed', 'cancelled'],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: {
      type: String,
      trim: true
    },
    activityData: {
      type: mongoose.Schema.Types.Mixed
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Timestamps
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
splitSchema.index({ groupId: 1, createdAt: -1 });
splitSchema.index({ createdBy: 1 });
splitSchema.index({ 'memberSplits.memberId': 1 });
splitSchema.index({ splitStatus: 1 });

// Virtual for participating members count
splitSchema.virtual('participatingMembersCount').get(function() {
  return this.memberSplits.filter(split => split.isParticipating).length;
});

// Virtual for total owed amount
splitSchema.virtual('totalOwedAmount').get(function() {
  return this.memberSplits.reduce((total, split) => {
    return total + (split.isParticipating ? split.owedAmount : 0);
  }, 0);
});

// Virtual for total paid amount
splitSchema.virtual('totalPaidAmount').get(function() {
  return this.memberSplits.reduce((total, split) => {
    return total + split.paidAmount;
  }, 0);
});

// Virtual for completion percentage
splitSchema.virtual('completionPercentage').get(function() {
  const totalOwed = this.totalOwedAmount;
  const totalPaid = this.totalPaidAmount;
  return totalOwed > 0 ? Math.round((totalPaid / totalOwed) * 100) : 0;
});

// Pre-save middleware to calculate total amount and validate splits
splitSchema.pre('save', function(next) {
  // Calculate total amount including tax
  this.taxAmount = (this.baseAmount * this.taxPercentage) / 100;
  this.totalAmount = this.baseAmount + this.taxAmount;

  // Validate that split values add up correctly based on method
  if (this.memberSplits.length > 0) {
    const participatingMembers = this.memberSplits.filter(split => split.isParticipating);
    
    if (this.splitMethod === 'percentage') {
      const totalPercentage = participatingMembers.reduce((sum, split) => {
        return sum + (split.splitValue.percentage || 0);
      }, 0);
      
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return next(new Error('Split percentages must add up to 100%'));
      }
    }

    // Calculate owed amounts based on split method
    participatingMembers.forEach(split => {
      switch (this.splitMethod) {
        case 'equal':
          split.owedAmount = this.totalAmount / participatingMembers.length;
          break;
        case 'amount':
          split.owedAmount = split.splitValue.amount || 0;
          break;
        case 'percentage':
          split.owedAmount = (this.totalAmount * (split.splitValue.percentage || 0)) / 100;
          break;
        case 'shares': {
          const totalShares = participatingMembers.reduce((sum, s) => sum + (s.splitValue.shares || 1), 0);
          split.owedAmount = (this.totalAmount * (split.splitValue.shares || 1)) / totalShares;
          break;
        }
      }
      // Round to 2 decimal places
      split.owedAmount = Math.round(split.owedAmount * 100) / 100;
    });
  }

  next();
});

// Method to populate all references
splitSchema.methods.populateReferences = function() {
  return this.populate([
    {
      path: 'groupId',
      select: 'groupName uuid'
    },
    {
      path: 'createdBy',
      select: 'name email pin'
    },
    {
      path: 'memberSplits.memberId',
      select: 'name email pin'
    },
    {
      path: 'receiptImage.uploadedBy',
      select: 'name email'
    }
  ]);
};

// Static method to find splits for a group
splitSchema.statics.findByGroup = function(groupId, options = {}) {
  const query = { groupId, isActive: true };
  if (options.status) {
    query.splitStatus = options.status;
  }
  
  return this.find(query)
    .populate([
      {
        path: 'createdBy',
        select: 'name email pin'
      },
      {
        path: 'memberSplits.memberId',
        select: 'name email pin'
      }
    ])
    .sort({ createdAt: -1 });
};

// Static method to find splits for a specific member
splitSchema.statics.findByMember = function(memberId, options = {}) {
  const query = {
    'memberSplits.memberId': memberId,
    'memberSplits.isParticipating': true,
    isActive: true
  };
  
  if (options.status) {
    query.splitStatus = options.status;
  }
  
  return this.find(query)
    .populate([
      {
        path: 'groupId',
        select: 'groupName uuid'
      },
      {
        path: 'createdBy',
        select: 'name email pin'
      }
    ])
    .sort({ createdAt: -1 });
};

const Split = mongoose.model('Split', splitSchema);

export default Split;