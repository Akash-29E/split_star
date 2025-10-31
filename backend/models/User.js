import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Basic user information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  // PIN for group access
  pin: {
    type: String,
    required: true,
    length: 6,
    default: function() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
  },
  // Role in the context of groups
  defaultRole: {
    type: String,
    enum: ['admin', 'member', 'viewer'],
    default: 'member'
  },
  // Access level
  defaultAccessLevel: {
    type: String,
    enum: ['full', 'limited', 'readonly'],
    default: 'limited'
  },
  // User preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      }
    }
  },
  // Groups this user belongs to
  groups: [{
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member'
    },
    accessLevel: {
      type: String,
      enum: ['full', 'limited', 'readonly'],
      default: function() {
        return this.role === 'admin' ? 'full' : 
               this.role === 'member' ? 'limited' : 'readonly';
      }
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastAccess: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ 'groups.group': 1 });
userSchema.index({ pin: 1 });
userSchema.index({ email: 1 }, { sparse: true });

// Method to verify PIN
userSchema.methods.verifyPin = function(candidatePin) {
  return this.pin === candidatePin;
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.pin;
  delete userObject.__v;
  return userObject;
};

// Method to get profile with PIN (for user's own data)
userSchema.methods.getProfileWithPin = function() {
  const userObject = this.toObject();
  delete userObject.__v;
  return userObject;
};

// Static method to find user by PIN and group
userSchema.statics.findByPinAndGroup = function(pin, groupId) {
  return this.findOne({
    pin: pin,
    'groups.group': groupId,
    isActive: true
  }).populate('groups.group');
};

const User = mongoose.model('User', userSchema);

export default User;