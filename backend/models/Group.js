import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const groupSchema = new mongoose.Schema({
  uuid: {
    type: String,
    unique: true,
    default: uuidv4,
    immutable: true
  },
  // Removed global PIN - each member now has their own PIN
  groupName: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // Users who belong to this group (just references)
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  personCount: {
    type: Number,
    required: true,
    min: [1, 'Group must have at least 1 person'],
    max: [50, 'Group cannot exceed 50 people']
  },
  personNames: {
    type: Map,
    of: String,
    default: new Map()
  },
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    allowInvites: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    }
  },
  activities: [{
    type: {
      type: String,
      enum: ['expense', 'payment', 'settlement'],
      required: true
    },
    description: String,
    amount: Number,
    participants: [String],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
groupSchema.index({ createdBy: 1 });
groupSchema.index({ members: 1 });
groupSchema.index({ createdAt: -1 });
groupSchema.index({ groupName: 'text', description: 'text' });

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to populate members with their details
groupSchema.methods.populateMembers = function() {
  return this.populate({
    path: 'members',
    select: 'name email pin defaultRole defaultAccessLevel groups isActive createdAt',
    match: { isActive: true }
  });
};

// Static method to find group with populated members
groupSchema.statics.findWithMembers = function(query) {
  return this.findOne(query).populate({
    path: 'members',
    select: 'name email pin defaultRole defaultAccessLevel groups isActive createdAt',
    match: { isActive: true }
  });
};

const Group = mongoose.model('Group', groupSchema);

export default Group;