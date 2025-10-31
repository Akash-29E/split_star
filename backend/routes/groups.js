import express from 'express';
import { body, validationResult } from 'express-validator';
import Group from '../models/Group.js';
import User from '../models/User.js';
import Split from '../models/Split.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const groupValidation = [
  body('groupName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('personCount')
    .isInt({ min: 1, max: 50 })
    .withMessage('Person count must be between 1 and 50'),
  body('personNames')
    .optional()
    .isObject()
    .withMessage('Person names must be an object')
];

// POST /api/groups/verify-pin - Verify PIN and get group access
router.post('/verify-pin', async (req, res) => {
  try {
    const { uuid, pin } = req.body;

    if (!uuid || !pin) {
      return res.status(400).json({
        success: false,
        error: 'UUID and PIN are required'
      });
    }

    // Find the group
    const group = await Group.findOne({ uuid, isActive: true });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Find user with matching PIN who belongs to this group
    const authenticatedUser = await User.findOne({
      pin: pin,
      'groups.group': group._id,
      isActive: true
    });

    if (!authenticatedUser) {
      return res.status(403).json({
        success: false,
        error: 'Invalid PIN. No member found with this PIN.'
      });
    }

    // Get user's role and access level for this specific group
    const userGroupInfo = authenticatedUser.groups.find(g => g.group.toString() === group._id.toString());
    const userRole = userGroupInfo?.role || authenticatedUser.defaultRole;
    const userAccessLevel = userGroupInfo?.accessLevel || authenticatedUser.defaultAccessLevel;

    // Populate group with all members
    const populatedGroup = await Group.findById(group._id).populate('members');

    // Prepare member data for response
    const membersData = populatedGroup.members.map(member => {
      const memberGroupInfo = member.groups.find(g => g.group.toString() === group._id.toString());
      return {
        _id: member._id,
        name: member.name,
        role: memberGroupInfo?.role || member.defaultRole,
        accessLevel: memberGroupInfo?.accessLevel || member.defaultAccessLevel,
        joinedAt: memberGroupInfo?.joinedAt || member.createdAt,
        // Only include PIN for the authenticated member
        pin: member._id.equals(authenticatedUser._id) ? member.pin : undefined
      };
    });

    // Prepare response
    const groupData = {
      _id: populatedGroup._id,
      uuid: populatedGroup.uuid,
      groupName: populatedGroup.groupName,
      description: populatedGroup.description,
      personCount: populatedGroup.personCount,
      personNames: populatedGroup.personNames,
      settings: populatedGroup.settings,
      members: membersData,
      isActive: populatedGroup.isActive,
      activities: populatedGroup.activities || [],
      createdAt: populatedGroup.createdAt,
      updatedAt: populatedGroup.updatedAt,
      // Add authenticated member information with PIN
      authenticatedMember: {
        id: authenticatedUser._id,
        name: authenticatedUser.name,
        role: userRole,
        accessLevel: userAccessLevel,
        joinedAt: userGroupInfo?.joinedAt || authenticatedUser.createdAt,
        pin: authenticatedUser.pin
      }
    };

    res.json({
      success: true,
      data: groupData
    });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify PIN'
    });
  }
});

// GET /api/groups/uuid/:uuid - Get group by UUID (public access for sharing)
router.get('/uuid/:uuid', async (req, res) => {
  try {
    const group = await Group.findOne({ uuid: req.params.uuid, isActive: true });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Return basic group information (without PIN and sensitive data)
    const publicGroupData = {
      uuid: group.uuid,
      groupName: group.groupName,
      description: group.description,
      memberCount: group.memberCount || group.members?.length || 0,
      personCount: group.personCount,
      createdAt: group.createdAt,
      requiresPin: true // Indicate that PIN is required for full access
    };

    res.json({
      success: true,
      data: publicGroupData
    });
  } catch (error) {
    console.error('Error fetching group by UUID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch group'
    });
  }
});

// GET /api/groups - Get all groups for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { createdBy: req.userId },
        { 'members.user': req.userId }
      ],
      isActive: true
    })
    .populate('createdBy', 'username firstName lastName')
    .populate('members.user', 'username firstName lastName')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: groups,
      count: groups.length
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch groups'
    });
  }
});

// GET /api/groups/:id - Get specific group
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'username firstName lastName')
      .populate('members.user', 'username firstName lastName');

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user has access to this group
    const hasAccess = group.createdBy._id.toString() === req.userId ||
                     group.members.some(member => member.user && member.user._id.toString() === req.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch group'
    });
  }
});

// POST /api/groups - Create new group (no auth required)
router.post('/', groupValidation, async (req, res) => {
  try {
    console.log('🚀 Group creation request received');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User ID:', req.userId);
    console.log('👤 User data:', req.user);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { groupName, description, personCount, personNames, settings, adminName } = req.body;

    // Step 1: Create User documents for each member
    const userPromises = [];
    
    // Create admin user first
    const adminUser = new User({
      name: adminName || 'Admin',
      defaultRole: 'admin',
      defaultAccessLevel: 'full'
    });
    userPromises.push(adminUser.save());

    // Create other users from personNames
    if (personNames && typeof personNames === 'object') {
      Object.entries(personNames).forEach(([index, name]) => {
        // Skip index "1" as it's typically the admin
        if (index !== "1" && name && name.trim()) {
          const user = new User({
            name: name.trim(),
            defaultRole: 'member',
            defaultAccessLevel: 'limited'
          });
          userPromises.push(user.save());
        }
      });
    }

    console.log('👥 Creating', userPromises.length, 'user documents...');
    
    // Save all users
    const createdUsers = await Promise.all(userPromises);
    console.log('✅ Created users with PINs:', createdUsers.map(u => ({ name: u.name, pin: u.pin, role: u.defaultRole })));

    // Step 2: Create group with user references
    const groupData = {
      groupName,
      description,
      personCount,
      personNames: personNames || {},
      settings: settings || {},
      members: createdUsers.map(user => user._id)
    };

    console.log('📝 Creating group with', createdUsers.length, 'members...');

    const group = new Group(groupData);
    
    console.log('💾 Saving group to database...');
    await group.save();
    console.log('✅ Group saved successfully with UUID:', group.uuid);
    
    // Step 3: Update each user's groups array
    const userUpdatePromises = createdUsers.map((user, index) => {
      const role = index === 0 ? 'admin' : user.defaultRole;
      const accessLevel = index === 0 ? 'full' : user.defaultAccessLevel;
      
      user.groups.push({
        group: group._id,
        role: role,
        accessLevel: accessLevel
      });
      return user.save();
    });
    
    await Promise.all(userUpdatePromises);
    console.log('✅ Updated user groups arrays');
    
    // Step 4: Populate group with member details for response
    const populatedGroup = await Group.findById(group._id).populate('members');
    console.log('🔢 Generated member PINs:', populatedGroup.members.map(m => `${m.name}: ${m.pin}`));
    
    console.log('📤 Returning group data with member information');

    res.status(201).json({
      success: true,
      data: {
        _id: populatedGroup._id,
        uuid: populatedGroup.uuid,
        groupName: populatedGroup.groupName,
        description: populatedGroup.description,
        personCount: populatedGroup.personCount,
        personNames: populatedGroup.personNames,
        settings: populatedGroup.settings,
        members: populatedGroup.members.map(member => ({
          _id: member._id,
          name: member.name,
          pin: member.pin,
          role: member.groups.find(g => g.group.toString() === group._id.toString())?.role || member.defaultRole,
          accessLevel: member.groups.find(g => g.group.toString() === group._id.toString())?.accessLevel || member.defaultAccessLevel,
          joinedAt: member.groups.find(g => g.group.toString() === group._id.toString())?.joinedAt || member.createdAt
        })),
        createdAt: populatedGroup.createdAt,
        updatedAt: group.updatedAt
      },
      message: 'Group created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create group',
      details: error.message
    });
  }
});

// PUT /api/groups/:id - Update group
router.put('/:id', auth, groupValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const group = await Group.findById(req.params.id);

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is admin of this group
    const isAdmin = group.createdBy.toString() === req.userId ||
                   group.members.some(member => 
                     member.user && member.user.toString() === req.userId && member.role === 'admin'
                   );

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin rights required.'
      });
    }

    const { groupName, description, personCount, personNames, settings } = req.body;

    group.groupName = groupName || group.groupName;
    group.description = description || group.description;
    group.personCount = personCount || group.personCount;
    group.personNames = personNames || group.personNames;
    group.settings = { ...group.settings, ...settings };

    await group.save();
    await group.populate('createdBy', 'username firstName lastName');

    res.json({
      success: true,
      data: group,
      message: 'Group updated successfully'
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update group'
    });
  }
});

// DELETE /api/groups/:id - Delete group (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Only the creator can delete the group
    if (group.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only group creator can delete the group.'
      });
    }

    group.isActive = false;
    await group.save();

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete group'
    });
  }
});

// POST /api/groups/:uuid/splits - Create split for a group (non-authenticated)
router.post('/:uuid/splits', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { 
      splitTitle, 
      splitDescription, 
      baseAmount, 
      taxPercentage, 
      splitMethod, 
      memberSplits, 
      createdBy,
      createdByName,
      paidBy,
      paidByName
    } = req.body;

    // Debug logging
    console.log('📝 Split creation request:');
    console.log('UUID:', uuid);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!splitTitle || !baseAmount || !createdBy) {
      console.log('❌ Validation failed:', { splitTitle: !!splitTitle, baseAmount: !!baseAmount, createdBy: !!createdBy });
      return res.status(400).json({
        success: false,
        error: 'Split title, base amount, and created by are required'
      });
    }

    // Verify group exists
    const group = await Group.findOne({ uuid, isActive: true });
    if (!group) {
      console.log('❌ Group not found:', uuid);
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    console.log('✅ Group found:', group.groupName);

    // Find the user who is creating the split
    let createdByUserId = createdBy;
    
    // If createdBy is a PIN (string), find the corresponding User ObjectId
    if (typeof createdBy === 'string' && createdBy.length === 6) {
      console.log('🔍 Looking up user by PIN:', createdBy);
      const user = await User.findOne({ pin: createdBy, isActive: true });
      if (user) {
        createdByUserId = user._id;
        console.log('✅ Found user:', user.name, 'ID:', user._id);
      } else {
        console.log('❌ User not found for PIN:', createdBy);
        return res.status(400).json({
          success: false,
          error: 'Invalid creator PIN'
        });
      }
    }

    // Create split using the existing Split model
    const parsedBaseAmount = parseFloat(baseAmount);
    const parsedTaxPercentage = parseFloat(taxPercentage) || 0;
    const calculatedTaxAmount = (parsedBaseAmount * parsedTaxPercentage) / 100;
    const calculatedTotalAmount = parsedBaseAmount + calculatedTaxAmount;
    
    console.log('📊 Creating split with data:', {
      groupId: group._id,
      splitTitle: splitTitle.trim(),
      baseAmount: parsedBaseAmount,
      taxPercentage: parsedTaxPercentage,
      taxAmount: calculatedTaxAmount,
      totalAmount: calculatedTotalAmount,
      createdBy: createdByUserId,
      memberSplitsCount: memberSplits ? memberSplits.length : 0
    });
    
    const split = new Split({
      groupId: group._id,
      splitTitle: splitTitle.trim(),
      splitDescription: splitDescription ? splitDescription.trim() : '',
      splitType: 'split',
      baseAmount: parsedBaseAmount,
      taxPercentage: parsedTaxPercentage,
      taxAmount: calculatedTaxAmount,
      totalAmount: calculatedTotalAmount,
      splitMethod: splitMethod || 'equal',
      memberSplits: memberSplits || [],
      createdBy: createdByUserId,
      createdByName: createdByName || 'Unknown',
      paidBy: paidBy || createdByUserId,
      paidByName: paidByName || createdByName || 'Unknown',
      splitStatus: 'active'
    });

    console.log('💾 Attempting to save split...');
    await split.save();

    console.log('✅ Split created successfully:', split._id);

    res.status(201).json({
      success: true,
      data: split,
      message: 'Split created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating split:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create split',
      details: error.message
    });
  }
});

// GET /api/groups/:uuid/splits - Get all splits for a group (non-authenticated)
router.get('/:uuid/splits', async (req, res) => {
  try {
    const { uuid } = req.params;

    // Verify group exists
    const group = await Group.findOne({ uuid, isActive: true });
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Get splits for the group
    const splits = await Split.find({ 
      groupId: group._id, 
      splitStatus: 'active' 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: splits,
      count: splits.length
    });

  } catch (error) {
    console.error('Error fetching splits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch splits'
    });
  }
});

// DELETE /api/groups/:uuid/splits/:splitId - Delete a split (non-authenticated)
router.delete('/:uuid/splits/:splitId', async (req, res) => {
  try {
    const { uuid, splitId } = req.params;
    const { userId, userPin, userName } = req.body;

    // Debug logging
    console.log('🗑️ Split deletion request:');
    console.log('UUID:', uuid);
    console.log('Split ID:', splitId);
    console.log('User data:', { userId, userPin, userName });
    
    // Validate splitId format
    if (!splitId || splitId.length !== 24) {
      console.log('❌ Invalid splitId format:', splitId);
      return res.status(400).json({
        success: false,
        error: 'Invalid split ID format'
      });
    }

    // Verify group exists
    const group = await Group.findOne({ uuid, isActive: true });
    if (!group) {
      console.log('❌ Group not found:', uuid);
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Find the split to delete
    console.log('🔍 Looking for split with ID:', splitId);
    const split = await Split.findById(splitId);
    console.log('📊 Found split:', split ? 'Yes' : 'No');
    
    if (!split) {
      console.log('❌ Split not found:', splitId);
      return res.status(404).json({
        success: false,
        error: 'Split not found'
      });
    }
    
    console.log('✅ Split found:', {
      id: split._id,
      title: split.splitTitle,
      status: split.splitStatus,
      groupId: split.groupId
    });

    // Verify split belongs to the group
    if (split.groupId.toString() !== group._id.toString()) {
      console.log('❌ Split does not belong to group');
      return res.status(403).json({
        success: false,
        error: 'Split does not belong to this group'
      });
    }

    // Check permissions - user must be either the creator of the split or group admin
    const isCreatedByUser = split.createdBy?.toString() === userId ||
                           split.createdBy === userPin ||
                           split.createdByName === userName;

    const isGroupAdmin = group.createdBy?.toString() === userId ||
                        group.createdBy === userPin ||
                        group.createdByName === userName;

    // Also check if user has admin role in members array
    const hasAdminRole = group.members?.some(member => 
      (member.user?.toString() === userId ||
       member.pin === userPin ||
       member.name === userName) && 
      member.role === 'admin'
    );

    const canDelete = isCreatedByUser || isGroupAdmin || hasAdminRole;

    console.log('🔍 Permission check:');
    console.log('- isCreatedByUser:', isCreatedByUser);
    console.log('- isGroupAdmin:', isGroupAdmin);
    console.log('- hasAdminRole:', hasAdminRole);
    console.log('- canDelete:', canDelete);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete your own splits or you must be a group admin.'
      });
    }

    // Hard delete the split from database
    await Split.findByIdAndDelete(splitId);

    console.log('✅ Split permanently deleted from database:', split._id);

    res.json({
      success: true,
      message: 'Split deleted successfully',
      data: { splitId: split._id }
    });

  } catch (error) {
    console.error('Error deleting split:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete split'
    });
  }
});

export default router;