import express from 'express';
import Split from '../models/Split.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Create a new split
router.post('/', auth, async (req, res) => {
  try {
    const {
      groupId,
      splitTitle,
      splitDescription,
      splitType,
      baseAmount,
      taxPercentage,
      splitMethod,
      memberSplits,
      receiptImage
    } = req.body;

    // Validate group exists and user has access
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is a member of the group
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    // Create the split
    const split = new Split({
      groupId,
      splitTitle,
      splitDescription,
      splitType: splitType || 'split',
      baseAmount,
      taxPercentage: taxPercentage || 0,
      splitMethod: splitMethod || 'equal',
      memberSplits: memberSplits || [],
      receiptImage,
      createdBy: req.user.id,
      createdByName: req.user.name,
      splitStatus: 'active'
    });

    // Add creation activity
    split.activities.push({
      activityType: 'created',
      description: `Split "${splitTitle}" created`,
      performedBy: req.user.id,
      performedByName: req.user.name
    });

    await split.save();
    await split.populateReferences();

    res.status(201).json({
      message: 'Split created successfully',
      split
    });
  } catch (error) {
    console.error('Create split error:', error);
    res.status(400).json({ 
      error: 'Failed to create split', 
      details: error.message 
    });
  }
});

// Get all splits for a group
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Validate group exists and user has access
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    const options = {};
    if (status) {
      options.status = status;
    }

    const splits = await Split.findByGroup(groupId, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalSplits = await Split.countDocuments({
      groupId,
      isActive: true,
      ...(status && { splitStatus: status })
    });

    res.json({
      splits,
      totalSplits,
      totalPages: Math.ceil(totalSplits / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get group splits error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch splits', 
      details: error.message 
    });
  }
});

// Get splits for a specific member
router.get('/member/:memberId', auth, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Users can only view their own splits unless they're viewing within their groups
    if (req.user.id !== memberId) {
      return res.status(403).json({ error: 'Access denied. You can only view your own splits.' });
    }

    const options = {};
    if (status) {
      options.status = status;
    }

    const splits = await Split.findByMember(memberId, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalSplits = await Split.countDocuments({
      'memberSplits.memberId': memberId,
      'memberSplits.isParticipating': true,
      isActive: true,
      ...(status && { splitStatus: status })
    });

    res.json({
      splits,
      totalSplits,
      totalPages: Math.ceil(totalSplits / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get member splits error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch member splits', 
      details: error.message 
    });
  }
});

// Get a specific split by ID
router.get('/:splitId', auth, async (req, res) => {
  try {
    const { splitId } = req.params;

    const split = await Split.findById(splitId);
    if (!split) {
      return res.status(404).json({ error: 'Split not found' });
    }

    // Check if user has access to this split (member of the group)
    const group = await Group.findById(split.groupId);
    if (!group || !group.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await split.populateReferences();
    res.json(split);
  } catch (error) {
    console.error('Get split error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch split', 
      details: error.message 
    });
  }
});

// Update a split
router.put('/:splitId', auth, async (req, res) => {
  try {
    const { splitId } = req.params;
    const updates = req.body;

    const split = await Split.findById(splitId);
    if (!split) {
      return res.status(404).json({ error: 'Split not found' });
    }

    // Check if user has permission to update (creator or group admin)
    const group = await Group.findById(split.groupId);
    if (!group || !group.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Only creator can modify split details
    if (split.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the split creator can modify this split.' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'splitTitle', 'splitDescription', 'baseAmount', 'taxPercentage',
      'splitMethod', 'memberSplits', 'receiptImage'
    ];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        split[field] = updates[field];
      }
    });

    // Add modification activity
    split.activities.push({
      activityType: 'modified',
      description: `Split "${split.splitTitle}" updated`,
      performedBy: req.user.id,
      performedByName: req.user.name
    });

    await split.save();
    await split.populateReferences();

    res.json({
      message: 'Split updated successfully',
      split
    });
  } catch (error) {
    console.error('Update split error:', error);
    res.status(400).json({ 
      error: 'Failed to update split', 
      details: error.message 
    });
  }
});

// Record a payment for a split
router.post('/:splitId/payment', auth, async (req, res) => {
  try {
    const { splitId } = req.params;
    const { amount, memberId } = req.body;

    const split = await Split.findById(splitId);
    if (!split) {
      return res.status(404).json({ error: 'Split not found' });
    }

    // Find the member split
    const memberSplit = split.memberSplits.find(
      ms => ms.memberId.toString() === (memberId || req.user.id)
    );

    if (!memberSplit) {
      return res.status(404).json({ error: 'Member not found in this split' });
    }

    // Validate payment amount
    const remainingAmount = memberSplit.owedAmount - memberSplit.paidAmount;
    if (amount <= 0 || amount > remainingAmount) {
      return res.status(400).json({ 
        error: `Invalid payment amount. Must be between 0 and ${remainingAmount}` 
      });
    }

    // Update payment
    memberSplit.paidAmount += parseFloat(amount);
    memberSplit.paidAt = new Date();
    
    // Update payment status
    if (memberSplit.paidAmount >= memberSplit.owedAmount) {
      memberSplit.paymentStatus = 'paid';
    } else if (memberSplit.paidAmount > 0) {
      memberSplit.paymentStatus = 'partial';
    }

    // Add payment activity
    split.activities.push({
      activityType: 'payment_made',
      description: `Payment of $${amount} made by ${req.user.name}`,
      performedBy: req.user.id,
      performedByName: req.user.name,
      activityData: { amount, memberId: memberSplit.memberId }
    });

    // Check if split is complete
    const allPaid = split.memberSplits
      .filter(ms => ms.isParticipating)
      .every(ms => ms.paymentStatus === 'paid');
    
    if (allPaid && split.splitStatus === 'active') {
      split.splitStatus = 'completed';
      split.settlementDate = new Date();
      
      split.activities.push({
        activityType: 'completed',
        description: 'Split completed - all payments received',
        performedBy: req.user.id,
        performedByName: req.user.name
      });
    }

    await split.save();
    await split.populateReferences();

    res.json({
      message: 'Payment recorded successfully',
      split
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(400).json({ 
      error: 'Failed to record payment', 
      details: error.message 
    });
  }
});

// Delete/Cancel a split
router.delete('/:splitId', auth, async (req, res) => {
  try {
    const { splitId } = req.params;

    const split = await Split.findById(splitId);
    if (!split) {
      return res.status(404).json({ error: 'Split not found' });
    }

    // Check if user has permission (creator or group admin)
    if (split.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the split creator can delete this split.' });
    }

    // Soft delete - mark as cancelled
    split.splitStatus = 'cancelled';
    split.isActive = false;

    split.activities.push({
      activityType: 'cancelled',
      description: `Split "${split.splitTitle}" cancelled`,
      performedBy: req.user.id,
      performedByName: req.user.name
    });

    await split.save();

    res.json({
      message: 'Split cancelled successfully'
    });
  } catch (error) {
    console.error('Delete split error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel split', 
      details: error.message 
    });
  }
});

export default router;