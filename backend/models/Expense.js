import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true
  },
  memberName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    default: null
  },
  percentage: {
    type: Number,
    default: null
  },
  shares: {
    type: Number,
    default: null
  }
});

const expenseSchema = new mongoose.Schema({
  groupUuid: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paidBy: {
    type: String,
    required: true
  },
  splitType: {
    type: String,
    required: true,
    enum: ['equal', 'exact', 'percentage', 'shares', 'split'],
    default: 'equal'
  },
  taxPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  participants: [participantSchema],
  createdBy: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
expenseSchema.index({ groupUuid: 1, createdAt: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;