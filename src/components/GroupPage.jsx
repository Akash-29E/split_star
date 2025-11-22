import './GroupPage.css'
import { groupService } from '../services/groups'
import Toast from './Toast'
import Popup from './Popup'
import useToast from '../hooks/useToast'
import { useState, useEffect, useRef } from 'react'
import { TextField } from '@mui/material'

function GroupPage({ groupData, onSettings, onMembers, initialGroupData, isSharedAccess, authenticatedMember }) {
  // Use initialGroupData if provided (for shared access), otherwise use groupData
  const currentGroupData = initialGroupData || groupData;
  
  // Determine the current user for both creation and shared access
  const currentUser = isSharedAccess && authenticatedMember 
    ? authenticatedMember 
    : currentGroupData?.members?.find(member => member.role === 'admin') || 
      currentGroupData?.members?.[0] || {
        name: 'Admin',
        role: 'admin',
        accessLevel: 'full',
        pin: currentGroupData?.members?.[0]?.pin
      };
      

  // Members dropdown statenp,
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Paid by dropdown state  
  const [isPaidByDropdownOpen, setIsPaidByDropdownOpen] = useState(false);
  const [selectedPaidBy, setSelectedPaidBy] = useState(currentUser);
  

  
  // Expense input states
  const [splitTitle, setSplitTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [taxPercentage, setTaxPercentage] = useState('0');
  
  // Selected members and their expense details
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [memberExpenseData, setMemberExpenseData] = useState({});
  const [globalActiveInputType, setGlobalActiveInputType] = useState('amount');
  
  // Track if initial member selection has been made
  const hasInitializedMembers = useRef(false);
  
  // Splits state
  const [splits, setSplits] = useState([]);
  const [isAddingSplit, setIsAddingSplit] = useState(false);
  const [expandedSplits, setExpandedSplits] = useState(new Set());
  
  // Balance accordion state
  const [isBalanceExpanded, setIsBalanceExpanded] = useState(false);
  
  // Settlement popup state
  const [settlementPopup, setSettlementPopup] = useState({
    isOpen: false,
    payer: '',
    payee: '',
    amount: ''
  });
  
  // Popup state
  const [popupConfig, setPopupConfig] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: null,
    primaryButtonText: 'OK',
    secondaryButtonText: 'Cancel',
    showSecondaryButton: true
  });
  
  // Toast notification using custom hook
  const { toast, showSuccess, showError, hideToast } = useToast();



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.members-dropdown')) {
        setIsDropdownOpen(false);
      }
      if (isPaidByDropdownOpen && !event.target.closest('.paid-by-dropdown')) {
        setIsPaidByDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isPaidByDropdownOpen]);

  // Load splits when component mounts
  useEffect(() => {
    const loadSplits = async () => {
      if (currentGroupData?.uuid) {
        try {
          const response = await groupService.getSplits(currentGroupData.uuid);
          if (response.success) {
            setSplits(response.data || []);
          }
        } catch (error) {
          console.error('Failed to load splits:', error);
          // Don't show alert for loading splits - it's not critical
        }
      }
    };

    loadSplits();
  }, [currentGroupData?.uuid]);

  // Ensure selectedPaidBy has a valid name
  useEffect(() => {
    if (currentGroupData?.members && (!selectedPaidBy?.name || selectedPaidBy.name === 'Unknown User')) {
      // Set to current user if available, otherwise first member
      const validPaidBy = currentUser?.name ? currentUser : currentGroupData.members[0];
      if (validPaidBy && validPaidBy.name) {
        setSelectedPaidBy(validPaidBy);
      }
    }
  }, [currentGroupData?.members, currentUser, selectedPaidBy?.name]);

  // Select all members by default when group data is loaded (only once on initial load)
  useEffect(() => {
    if (currentGroupData?.members && !hasInitializedMembers.current) {
      const allMemberIds = new Set(currentGroupData.members.map(member => member._id || member.id));
      setSelectedMembers(allMemberIds);
      hasInitializedMembers.current = true;
    }
  }, [currentGroupData?.members]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const togglePaidByDropdown = () => {
    setIsPaidByDropdownOpen(!isPaidByDropdownOpen);
  };

  const handlePaidBySelect = (member) => {
    setSelectedPaidBy(member);
    setIsPaidByDropdownOpen(false);
  };

  const toggleSplitAccordion = (splitId) => {
    setExpandedSplits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(splitId)) {
        newSet.delete(splitId);
      } else {
        newSet.add(splitId);
      }
      return newSet;
    });
  };

  // Calculate current user's total balance
  const calculateUserBalance = () => {
    let totalToPay = 0;
    let totalToReceive = 0;
    let netBalance = 0; // Sum of all individual amounts

    splits.forEach(split => {
      const totalAmount = parseFloat(split.totalAmount) || parseFloat(split.baseAmount) || 0;
      
      // Check if current user paid for this expense
      const currentUserPaid = split.paidBy === currentUser?.id || 
                             split.paidBy === currentUser?.pin ||
                             split.paidByName === currentUser?.name;
      
      // Special handling for settlement records
      if (split.splitTitle === 'Settlement Record') {
        const currentUserIsPayee = split.memberSplits.some(ms => 
          ms.memberId === currentUser._id ||
          ms.memberId === currentUser.id ||
          ms.memberId === currentUser.pin ||
          ms.memberName === currentUser.name ||
          ms.memberId === currentUser.name
        );
        
        if (currentUserPaid) {
          // Current user is payer (lender) - add positive amount
          netBalance += totalAmount;
        } else if (currentUserIsPayee) {
          // Current user is payee (borrower) - add negative amount
          netBalance -= totalAmount;
        }
        return; // Skip normal processing for settlements
      }
      
      // Find current user's split by matching different possible identifiers
      const currentUserSplit = split.memberSplits.find(ms => {
        return ms.memberId === currentUser._id ||
               ms.memberId === currentUser.id ||
               ms.memberId === currentUser.pin ||
               ms.memberName === currentUser.name ||
               ms.memberId === currentUser.name;
      });
      
      if (!currentUserSplit) {
        return;
      }

      // Calculate the user's owed amount based on split method
      let userOwedAmount = 0;
      const totalShares = split.memberSplits.reduce((sum, ms) => sum + (ms.splitValue?.shares || 1), 0);

      switch (split.splitMethod) {
        case 'equal':
          userOwedAmount = totalAmount / split.memberSplits.length;
          break;
        case 'exact':
        case 'amount':
          userOwedAmount = parseFloat(currentUserSplit.splitValue?.amount) || 0;
          break;
        case 'percentage':
          userOwedAmount = (totalAmount * (parseFloat(currentUserSplit.splitValue?.percentage) || 0)) / 100;
          break;
        case 'shares':
          userOwedAmount = totalShares > 0 ? (totalAmount * (parseInt(currentUserSplit.splitValue?.shares) || 1)) / totalShares : 0;
          break;
        default:
          userOwedAmount = totalAmount / split.memberSplits.length;
      }

      if (currentUserPaid) {
        // Current user paid - they should receive money from others
        const amountToReceive = totalAmount - userOwedAmount;
        if (amountToReceive > 0) {
          netBalance += amountToReceive;
        }
      } else {
        // Someone else paid - current user needs to pay back
        if (userOwedAmount > 0) {
          netBalance -= userOwedAmount;
        }
      }
    });

    // Calculate totalToPay and totalToReceive from netBalance
    if (netBalance > 0) {
      totalToReceive = netBalance;
      totalToPay = 0;
    } else {
      totalToPay = Math.abs(netBalance);
      totalToReceive = 0;
    }

    return { totalToPay, totalToReceive };
  };

  // Calculate balance breakdown by member
  const calculateMemberBalances = () => {
    const memberBalances = new Map();

    splits.forEach((split) => {
      const totalAmount = parseFloat(split.totalAmount) || parseFloat(split.baseAmount) || 0;
      
      // Find current user's split
      const currentUserSplit = split.memberSplits.find(ms => {
        return ms.memberId === currentUser._id ||
               ms.memberId === currentUser.id ||
               ms.memberId === currentUser.pin ||
               ms.memberName === currentUser.name ||
               ms.memberId === currentUser.name;
      });
      
      // Check if current user paid
      const currentUserPaid = split.paidBy === currentUser?.id || 
                             split.paidBy === currentUser?.pin ||
                             split.paidByName === currentUser?.name;
      
      // Skip if current user neither paid nor owes
      if (!currentUserSplit && !currentUserPaid) return;

      // Calculate user's owed amount (only if current user is in the split)
      let userOwedAmount = 0;
      const totalShares = split.memberSplits.reduce((sum, ms) => sum + (ms.splitValue?.shares || 1), 0);
      
      if (currentUserSplit) {
        switch (split.splitMethod) {
          case 'equal':
            userOwedAmount = totalAmount / split.memberSplits.length;
            break;
          case 'exact':
          case 'amount':
            userOwedAmount = parseFloat(currentUserSplit.splitValue?.amount) || 0;
            break;
          case 'percentage':
            userOwedAmount = (totalAmount * (parseFloat(currentUserSplit.splitValue?.percentage) || 0)) / 100;
            break;
          case 'shares':
            userOwedAmount = totalShares > 0 ? (totalAmount * (parseInt(currentUserSplit.splitValue?.shares) || 1)) / totalShares : 0;
            break;
          default:
            userOwedAmount = totalAmount / split.memberSplits.length;
        }
      }

      // Special handling for settlement records
      if (split.splitTitle === 'Settlement Record') {
        if (currentUserPaid) {
          // Current user is payer - paying settlement to someone (payee in memberSplits)
          // This means current user is reducing their debt to the payee
          const payeeName = split.memberSplits[0]?.memberName;
          if (payeeName && payeeName !== currentUser.name) {
            if (!memberBalances.has(payeeName)) {
              memberBalances.set(payeeName, 0);
            }
            // Current user paying reduces the amount payee is owed (or increases what current user owes if backwards)
            // Since balance is from current user's perspective: positive = they owe you, negative = you owe them
            // Paying them means adding to their balance (moving towards positive)
            memberBalances.set(payeeName, memberBalances.get(payeeName) + totalAmount);
          }
        } else if (currentUserSplit) {
          // Someone paid a settlement TO current user (current user is payee)
          // The payer is settling their debt to current user
          const payerName = split.paidByName;
          if (payerName && payerName !== currentUser.name) {
            if (!memberBalances.has(payerName)) {
              memberBalances.set(payerName, 0);
            }
            // Reduce what payer owes to current user
            memberBalances.set(payerName, memberBalances.get(payerName) - totalAmount);
          }
        }
        return; // Skip the normal memberSplits processing for settlements
      }

      // Process each member's balance with current user
      split.memberSplits.forEach(memberSplit => {
        const memberName = memberSplit.memberName;
        
        // Skip current user
        if (memberName === currentUser.name) return;

        // Calculate this member's owed amount
        let memberOwedAmount = 0;
        switch (split.splitMethod) {
          case 'equal':
            memberOwedAmount = totalAmount / split.memberSplits.length;
            break;
          case 'exact':
          case 'amount':
            memberOwedAmount = parseFloat(memberSplit.splitValue?.amount) || 0;
            break;
          case 'percentage':
            memberOwedAmount = (totalAmount * (parseFloat(memberSplit.splitValue?.percentage) || 0)) / 100;
            break;
          case 'shares':
            memberOwedAmount = totalShares > 0 ? (totalAmount * (parseInt(memberSplit.splitValue?.shares) || 1)) / totalShares : 0;
            break;
          default:
            memberOwedAmount = totalAmount / split.memberSplits.length;
        }

        const memberPaid = split.paidBy === memberSplit.memberId || split.paidByName === memberName;

        if (!memberBalances.has(memberName)) {
          memberBalances.set(memberName, 0);
        }

        if (currentUserPaid && !memberPaid) {
          // Current user paid, this member owes current user
          memberBalances.set(memberName, memberBalances.get(memberName) + memberOwedAmount);
        } else if (memberPaid && !currentUserPaid) {
          // This member paid, current user owes this member
          memberBalances.set(memberName, memberBalances.get(memberName) - userOwedAmount);
        }
      });
    });

    const balances = Array.from(memberBalances.entries())
      .map(([name, amount]) => ({ name, amount }))
      .filter(member => Math.abs(member.amount) > 0.01)
      .sort((a, b) => b.amount - a.amount); // Sort by amount (receivable first)
    
    return balances;
  };

  const handleSettleClick = (memberName, amount) => {
    const payer = amount > 0 ? memberName : currentUser.name;
    const payee = amount > 0 ? currentUser.name : memberName;
    
    setSettlementPopup({
      isOpen: true,
      payer: payer,
      payee: payee,
      amount: Math.abs(amount).toFixed(2)
    });
  };

  const handleSettleConfirm = async () => {
    const settlementAmount = parseFloat(settlementPopup.amount);
    
    if (!settlementAmount || settlementAmount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    try {
      // Find the payer and payee member objects
      const payerMember = currentGroupData?.members?.find(m => m.name === settlementPopup.payer);
      const payeeMember = currentGroupData?.members?.find(m => m.name === settlementPopup.payee);

      if (!payerMember || !payeeMember) {
        showError('Could not find member information');
        return;
      }

      // Create settlement split data
      const settlementData = {
        splitTitle: 'Settlement Record',
        splitDescription: `Settlement: ${settlementPopup.payer} → ${settlementPopup.payee}`,
        baseAmount: settlementAmount,
        taxPercentage: 0,
        splitMethod: 'amount',
        createdBy: payerMember._id || payerMember.id || payerMember.pin,
        memberSplits: [
          {
            memberId: payeeMember._id || payeeMember.id || payeeMember.pin,
            memberName: payeeMember.name,
            splitValue: {
              amount: settlementAmount,
              percentage: 100,
              shares: 1
            }
          }
        ],
        paidBy: payerMember._id || payerMember.id || payerMember.pin,
        paidByName: payerMember.name
      };

      // Add the settlement split to the backend
      const response = await groupService.createSplit(currentGroupData.uuid, settlementData);

      if (response.success) {
        // Reload splits to show the new settlement
        const splitsResponse = await groupService.getSplits(currentGroupData.uuid);
        if (splitsResponse.success) {
          setSplits(splitsResponse.data || []);
        }
        
        showSuccess('Settlement recorded successfully!');
        setSettlementPopup({ isOpen: false, payer: '', payee: '', amount: '' });
      } else {
        showError(response.error || 'Failed to record settlement');
      }
    } catch (error) {
      console.error('Error recording settlement:', error);
      showError('Failed to record settlement. Please try again.');
    }
  };

  const handleSettleCancel = () => {
    setSettlementPopup({ isOpen: false, payer: '', payee: '', amount: '' });
  };

  const handleAddExpense = async () => {
    if (!splitTitle.trim()) {
      alert('Please enter a title for the split');
      return;
    }
    
    if (!amount || selectedMembers.size < 1) {
      alert('Please enter an amount and select at least 1 member');
      return;
    }

    setIsAddingSplit(true);
    
    try {
      // Detect split method based on user's active input type and actual inputs
      let detectedSplitMethod = 'equal';
      const memberIds = Array.from(selectedMembers);
      
      if (memberIds.length > 0) {
        // Check if users have manually entered values in specific fields
        const hasManualAmounts = memberIds.some(id => {
          const amountValue = memberExpenseData[id]?.amount;
          return amountValue && parseFloat(amountValue) > 0 && globalActiveInputType === 'amount';
        });
        
        const hasManualPercentages = memberIds.some(id => {
          const percentageValue = memberExpenseData[id]?.percentage;
          return percentageValue && parseFloat(percentageValue) > 0 && globalActiveInputType === 'percentage';
        });
        
        const hasManualShares = memberIds.some(id => {
          const sharesValue = memberExpenseData[id]?.shares;
          return sharesValue && parseInt(sharesValue) > 0 && globalActiveInputType === 'shares';
        });
        
        // Prioritize based on what the user is actively inputting
        if (globalActiveInputType === 'percentage' && hasManualPercentages) {
          detectedSplitMethod = 'percentage';
        } else if (globalActiveInputType === 'shares' && hasManualShares) {
          detectedSplitMethod = 'shares';
        } else if (globalActiveInputType === 'amount' && hasManualAmounts) {
          detectedSplitMethod = 'amount';
        } else {
          // Fallback: check for any non-zero user inputs
          const hasAnyPercentages = memberIds.some(id => memberExpenseData[id]?.percentage && parseFloat(memberExpenseData[id].percentage) > 0);
          const hasAnyShares = memberIds.some(id => memberExpenseData[id]?.shares && parseInt(memberExpenseData[id].shares) > 1);
          const hasAnyAmounts = memberIds.some(id => memberExpenseData[id]?.amount && parseFloat(memberExpenseData[id].amount) > 0);
          
          if (hasAnyPercentages) {
            detectedSplitMethod = 'percentage';
          } else if (hasAnyShares) {
            detectedSplitMethod = 'shares';
          } else if (hasAnyAmounts) {
            detectedSplitMethod = 'amount';
          }
        }
      }
      

      
      // Prepare split data according to the Split model
      const splitData = {
        splitTitle: splitTitle.trim() || 'Untitled Split',
        splitDescription: 'Split expense',
        baseAmount: parseFloat(amount),
        taxPercentage: parseFloat(taxPercentage) || 0,
        splitMethod: detectedSplitMethod,
        memberSplits: Array.from(selectedMembers).map(memberId => {
          // Try multiple ways to find the member
          let member = currentGroupData?.members?.find(m => 
            m._id === memberId || 
            m._id?.toString() === memberId?.toString() ||
            m.pin === memberId || 
            m.id === memberId
          );
          
          // If not found by ID, try finding by index (fallback)
          if (!member && typeof memberId === 'number') {
            member = currentGroupData?.members?.[memberId];
          }
          
          const expenseInfo = memberExpenseData[memberId] || {};
          
          // Check if this member is the one who paid - more robust comparison
          const isPayer = selectedPaidBy._id === member?._id || 
                         selectedPaidBy._id === member?.id ||
                         selectedPaidBy.id === member?._id ||
                         selectedPaidBy.id === member?.id || 
                         selectedPaidBy.name === member?.name ||
                         selectedPaidBy.pin === member?.pin ||
                         selectedPaidBy._id?.toString() === member?._id?.toString() ||
                         selectedPaidBy.id?.toString() === member?.id?.toString();
          

          
          return {
            memberId: memberId,
            memberName: member?.name || `Test Member ${memberId}`,
            isParticipating: true,
            paidAmount: isPayer ? (parseFloat(amount) + (parseFloat(amount) * (parseFloat(taxPercentage) || 0) / 100)) : 0,
            splitValue: {
              amount: expenseInfo.amount ? parseFloat(expenseInfo.amount) : 0,
              percentage: expenseInfo.percentage ? parseFloat(expenseInfo.percentage) : 0,
              shares: expenseInfo.shares ? parseInt(expenseInfo.shares) : 1
            }
          };
        }),
        createdBy: currentUser.pin || currentUser.id || 'unknown',
        createdByName: currentUser.name || 'Unknown',
        paidBy: selectedPaidBy._id || selectedPaidBy.id || selectedPaidBy.pin,
        paidByName: selectedPaidBy.name || 'Unknown User'
      };

      const response = await groupService.createSplit(currentGroupData.uuid, splitData);
      
      if (response.success) {
        
        // Add the new split to the local state
        setSplits(prev => [...prev, response.data]);
        
        // Reset form
        setSplitTitle('');
        setAmount('');
        setTaxPercentage('0');
        setSelectedMembers(new Set());
        setMemberExpenseData({});
        setSelectedPaidBy(currentUser);
        
        showSuccess('Expense added successfully!');
      } else {
        console.error('❌ Failed to create split:', response.error);
        showError(response.error || 'Failed to create expense');
      }
    } catch (error) {
      console.error('❌ Split creation failed:', error);
      showError(error.message || 'Failed to create expense. Please try again.');
    } finally {
      setIsAddingSplit(false);
    }
  };

  const handleAddImage = () => {
    // TODO: Implement image upload logic
    showSuccess('Add image functionality coming soon!');
  };

  // Popup helper functions
  const openPopup = (config) => {
    setPopupConfig({
      isOpen: true,
      type: config.type || 'confirm',
      title: config.title || 'Confirmation',
      message: config.message || '',
      onConfirm: config.onConfirm || null,
      primaryButtonText: config.primaryButtonText || 'OK',
      secondaryButtonText: config.secondaryButtonText || 'Cancel',
      showSecondaryButton: config.showSecondaryButton !== undefined ? config.showSecondaryButton : true
    });
  };

  const closePopup = () => {
    setPopupConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeleteExpense = async (splitId) => {
    try {
      // Show loading state (optional - could add a loading spinner)
      const response = await groupService.deleteSplit(
        currentGroupData.uuid,
        splitId,
        currentUser
      );

      if (response.success) {
        // Remove the split from local state to update UI immediately
        setSplits(prevSplits => prevSplits.filter(split => split._id !== splitId));
        
        // Show success toast
        showSuccess('Expense Deleted!');
      } else {
        console.error('❌ Failed to delete expense:', response.error);
        showError(response.error || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('❌ Delete expense failed:', error);
      showError(error.message || 'Failed to delete expense. Please try again.');
    }
  };

  const confirmDeleteExpense = (splitId) => {
    openPopup({
      type: 'error',
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense? This action cannot be undone.',
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel',
      showSecondaryButton: true,
      onConfirm: () => handleDeleteExpense(splitId)
    });
  };

  const handleMemberSelection = (memberId, isSelected) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(memberId);
        // Initialize expense data for new member
        setMemberExpenseData(prevData => ({
          ...prevData,
          [memberId]: {
            amount: '',
            percentage: '',
            shares: ''
          }
        }));

      } else {
        newSet.delete(memberId);
        // Remove expense data for deselected member
        setMemberExpenseData(prevData => {
          const newData = { ...prevData };
          delete newData[memberId];
          return newData;
        });

      }
      return newSet;
    });
  };

  const updateMemberExpenseData = (memberId, field, value) => {
    const baseAmount = parseFloat(amount) || 0;
    const tax = parseFloat(taxPercentage) || 0;
    const totalAmount = baseAmount + (baseAmount * tax / 100);

    setMemberExpenseData(prev => {
      const newData = {
        ...prev,
        [memberId]: {
          ...prev[memberId],
          [field]: value
        }
      };

      // Auto-calculate amounts based on the field being updated
      if (totalAmount > 0) {
        if (field === 'percentage') {
          const percentage = parseFloat(value) || 0;
          const calculatedAmount = (totalAmount * percentage) / 100;
          newData[memberId] = {
            ...newData[memberId],
            amount: calculatedAmount.toFixed(2)
          };

          // Distribute remaining percentage equally among other members
          const allMemberIds = Array.from(selectedMembers);
          const otherMemberIds = allMemberIds.filter(id => id !== memberId);
          
          if (otherMemberIds.length > 0 && percentage <= 100) {
            const remainingPercentage = 100 - percentage;
            const equalPercentageForOthers = remainingPercentage / otherMemberIds.length;
            
            console.log('📊 Percentage Distribution:');
            console.log(`- User entered: ${percentage}%`);
            console.log(`- Remaining: ${remainingPercentage}%`);
            console.log(`- Equal share for ${otherMemberIds.length} others: ${equalPercentageForOthers.toFixed(2)}%`);
            
            otherMemberIds.forEach(id => {
              const otherCalculatedAmount = (totalAmount * equalPercentageForOthers) / 100;
              
              // Ensure member data exists
              if (!newData[id]) {
                newData[id] = { ...prev[id] };
              }
              
              newData[id] = {
                ...newData[id],
                percentage: equalPercentageForOthers.toFixed(2),
                amount: otherCalculatedAmount.toFixed(2)
              };
            });
          }
        } else if (field === 'amount') {
          const enteredAmount = parseFloat(value) || 0;
          
          // Calculate percentage for the entered amount
          const enteredPercentage = totalAmount > 0 ? (enteredAmount / totalAmount) * 100 : 0;
          newData[memberId] = {
            ...newData[memberId],
            percentage: enteredPercentage.toFixed(2)
          };

          // Distribute remaining amount equally among other members
          const allMemberIds = Array.from(selectedMembers);
          const otherMemberIds = allMemberIds.filter(id => id !== memberId);
          
          if (otherMemberIds.length > 0 && enteredAmount <= totalAmount) {
            const remainingAmount = totalAmount - enteredAmount;
            const equalAmountForOthers = remainingAmount / otherMemberIds.length;
            const equalPercentageForOthers = totalAmount > 0 ? (equalAmountForOthers / totalAmount) * 100 : 0;
            
            console.log('💰 Amount Distribution:');
            console.log(`- User entered: $${enteredAmount.toFixed(2)}`);
            console.log(`- Remaining: $${remainingAmount.toFixed(2)}`);
            console.log(`- Equal share for ${otherMemberIds.length} others: $${equalAmountForOthers.toFixed(2)}`);
            
            otherMemberIds.forEach(id => {
              // Ensure member data exists
              if (!newData[id]) {
                newData[id] = { ...prev[id] };
              }
              
              newData[id] = {
                ...newData[id],
                amount: equalAmountForOthers.toFixed(2),
                percentage: equalPercentageForOthers.toFixed(2)
              };
            });
          }
        } else if (field === 'shares') {
          // Calculate amount based on shares - recalculate for ALL members
          const allMemberIds = Array.from(selectedMembers);
          
          // First, calculate total shares including the new value
          const totalShares = allMemberIds.reduce((sum, id) => {
            const shares = id === memberId ? parseFloat(value) || 1 : parseFloat(prev[id]?.shares) || 1;
            return sum + shares;
          }, 0);
          
          if (totalShares > 0) {
            console.log('🔢 Shares Calculation:');
            console.log('- Total amount:', totalAmount);
            console.log('- Total shares:', totalShares);
            
            // Recalculate amounts for ALL members based on new total shares
            allMemberIds.forEach(id => {
              const memberShares = id === memberId ? parseFloat(value) || 1 : parseFloat(prev[id]?.shares) || 1;
              const calculatedAmount = (totalAmount * memberShares) / totalShares;
              
              console.log(`- Member ${id}: ${memberShares} shares = $${calculatedAmount.toFixed(2)}`);
              
              // Ensure member data exists
              if (!newData[id]) {
                newData[id] = { ...prev[id] };
              }
              
              newData[id] = {
                ...newData[id],
                amount: calculatedAmount.toFixed(2)
              };
            });
          }
        }
      }

      // Split type detection removed - no longer needed
      
      return newData;
    });
  }; // End of updateMemberExpenseData function
  
  // Continuation of GroupPage function
  // Update member expense data when amount, tax, or selected members change  
  useEffect(() => {
    if (selectedMembers.size > 0 && (amount || taxPercentage !== '0')) {
      // Calculate total amount including tax
      const baseAmount = parseFloat(amount) || 0;
      const tax = parseFloat(taxPercentage) || 0;
      const totalAmount = baseAmount + (baseAmount * tax / 100);
      
      const amountPerMember = totalAmount / selectedMembers.size;
      const percentagePerMember = 100 / selectedMembers.size;
      
      setMemberExpenseData(prevData => {
        const newData = { ...prevData };
        selectedMembers.forEach(memberId => {
          newData[memberId] = {
            ...newData[memberId],
            amount: amountPerMember.toFixed(2),
            percentage: percentagePerMember.toFixed(2),
            shares: '1'
          };
        });
        return newData;
      });
    }
  }, [amount, taxPercentage, selectedMembers]);

  const setActiveInputType = (inputType) => {
    setGlobalActiveInputType(inputType);
  };

  const handleShare = async () => {
    if (!currentGroupData?.uuid) {
      alert('Group UUID not available for sharing');
      return;
    }

    try {
      const result = await groupService.copyGroupURL(currentGroupData.uuid);
      if (result.success) {
        alert(`Group link copied to clipboard!\n${result.url}`);
      }
    } catch (error) {
      console.error('Error sharing group:', error);
      alert('Failed to copy group link');
    }
  };
  // Main component JSX return
  return (
    <>
      {/* Toast Notification - Rendered at root level */}
      <Toast 
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* Popup Component - Rendered at root level */}
      <Popup
        isOpen={popupConfig.isOpen}
        onClose={closePopup}
        title={popupConfig.title}
        message={popupConfig.message}
        type={popupConfig.type}
        primaryButtonText={popupConfig.primaryButtonText}
        secondaryButtonText={popupConfig.secondaryButtonText}
        onPrimaryClick={popupConfig.onConfirm}
        showSecondaryButton={popupConfig.showSecondaryButton}
      />

      <div className="main-content">
        <div className="group-page-container">
        <div className="group-header">
          <h1 className="group-title">{currentGroupData?.groupName || 'New Group'}</h1>
          <div className="header-actions">
            {currentUser && currentUser.pin && (
              <div className="user-pin">
                <span className="pin-label">Your PIN:</span>
                <span className="pin-value">{currentUser.pin}</span>
              </div>
            )}
            <button className="members-button glass-button" onClick={onMembers}>
              <img src="/svg/multiuserIcon.svg" className="members-icon" width="20" height="20" alt="Members" />
            </button>
            <button className="settings-button glass-button" onClick={onSettings}>
              <img src="/svg/settingsIcon.svg" className="settings-icon" width="20" height="20" alt="Settings" />
            </button>
            <button className="share-button glass-button" onClick={handleShare}>
              <img src="/svg/shareIcon.svg" className="share-icon" width="20" height="20" alt="Share" />
            </button>
          </div>
        </div>
        
        <div className="group-content">
          {/* User Balance Summary */}
          <div className="user-balance-summary">
            <div 
              className="balance-container clickable-item" 
              onClick={() => setIsBalanceExpanded(!isBalanceExpanded)}
            >
              <div className="balance-main">
                <div className="balance-label">Your Balance</div>
                <div className="balance-amount">
                  {(() => {
                    const { totalToPay, totalToReceive } = calculateUserBalance();
                    const netBalance = totalToReceive - totalToPay;
                    if (Math.abs(netBalance) < 0.01) {
                      return <span className="balance-neutral">$0.00</span>;
                    } else if (netBalance > 0) {
                      return <span className="balance-positive">+${netBalance.toFixed(2)}</span>;
                    } else {
                      return <span className="balance-negative">-${Math.abs(netBalance).toFixed(2)}</span>;
                    }
                  })()}
                </div>
              </div>
              <div className={`accordion-arrow ${isBalanceExpanded ? 'expanded' : ''}`}>
                <img src="/svg/downArrowIcon.svg" width="24" height="24" alt="" />
              </div>
            </div>
            
            {/* Member balances breakdown */}
            <div className={`balance-breakdown ${isBalanceExpanded ? 'expanded' : 'collapsed'}`}>
              {(() => {
                const memberBalances = calculateMemberBalances();
                return memberBalances.length > 0 ? (
                  <div className="member-balances-list">
                    {memberBalances.map((member, index) => (
                      <div key={index} className="member-balance-item">
                      <div className="member-balance-info">
                        <div className="member-balance-name">{member.name}</div>
                        <div className={`member-balance-amount ${member.amount > 0 ? 'positive' : 'negative'}`}>
                          {member.amount > 0 ? (
                            <span>owes you ${member.amount.toFixed(2)}</span>
                          ) : (
                            <span>you owe ${Math.abs(member.amount).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <button 
                        className={`settle-button ${member.amount > 0 ? 'receive' : 'pay'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSettleClick(member.name, member.amount);
                        }}
                        title={member.amount > 0 ? `Receive $${member.amount.toFixed(2)} from ${member.name}` : `Pay $${Math.abs(member.amount).toFixed(2)} to ${member.name}`}
                      >
                        {member.amount > 0 ? (
                          <img src="/svg/settle_icon.svg" alt="Receive" className="settlement-icon" />
                        ) : (
                          <img src="/svg/settle_icon.svg" alt="Send" className="settlement-icon" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-balances-message">
                  <p>All settled up! 🎉</p>
                </div>
              );
              })()}
            </div>
          </div>

          {/* Expense Form Section */}
          <div className="expense-form-section glass-panel">
            <div className="expense-form">
            <div className="expense-controls">
              {/* Split Title and Amount Row - 50% each */}
              <div className="split-title-row">
                <TextField
                  label="For"
                  variant="outlined"
                  placeholder="Dinner, Groceries, Rent"
                  value={splitTitle}
                  onChange={(e) => setSplitTitle(e.target.value)}
                  className="mui-textfield split-title-field"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff',
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '1rem',
                      fontWeight: 500,
                      borderRadius: '12px',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        borderWidth: '2px',
                        borderRadius: '12px',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--hover-color)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--hover-color)',
                        borderWidth: '2px',
                      },
                      backgroundColor: 'transparent',
                      backdropFilter: 'blur(15px)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease',
                    },
                    '& .MuiOutlinedInput-root:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontFamily: 'Quicksand, sans-serif',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'var(--hover-color)',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      // color: 'rgba(255, 255, 255, 0.5)',
                      // opacity: 1,
                    },
                  }}
                />
                <div className="amount-tax-container">
                  <TextField
                    label="Spent"
                    variant="outlined"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mui-textfield amount-field"
                    fullWidth
                    InputProps={{
                      startAdornment: <span style={{ color: 'rgba(255, 255, 255, 0.8)', marginRight: '6px', fontWeight: 600 }}>$</span>,
                    }}
                    inputProps={{
                      step: '0.01',
                      min: '0',
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '1rem',
                        fontWeight: 500,
                        borderRadius: '12px',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          borderWidth: '2px',
                          borderRadius: '12px',
                        },
                        '&:hover fieldset': {
                          borderColor: 'var(--hover-color)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'var(--hover-color)',
                          borderWidth: '2px',
                        },
                        backgroundColor: 'transparent',
                        backdropFilter: 'blur(15px)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                      },
                      '& .MuiOutlinedInput-root:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontFamily: 'Quicksand, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        backgroundColor: 'transparent',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'var(--hover-color)',
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                        opacity: 1,
                      },
                    }}
                  />
                  <TextField
                    label="+ Tax"
                    variant="outlined"
                    type="number"
                    placeholder="0"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(e.target.value)}
                    className="mui-textfield tax-field"
                    fullWidth
                    InputProps={{
                      endAdornment: <span style={{ color: 'rgba(255, 255, 255, 0.8)', marginLeft: '6px', fontWeight: 600 }}>%</span>,
                    }}
                    inputProps={{
                      step: '0.01',
                      min: '0',
                      max: '100',
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '1rem',
                        fontWeight: 500,
                        borderRadius: '12px',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          borderWidth: '2px',
                          borderRadius: '12px',
                        },
                        '&:hover fieldset': {
                          borderColor: 'var(--hover-color)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'var(--hover-color)',
                          borderWidth: '2px',
                        },
                        backgroundColor: 'transparent',
                        backdropFilter: 'blur(15px)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                      },
                      '& .MuiOutlinedInput-root:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontFamily: 'Quicksand, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        backgroundColor: 'transparent',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'var(--hover-color)',
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                        opacity: 1,
                      },
                    }}
                  />
                </div>
              </div>

              <div className="expense-inputs-group">
                {/* Paid By Dropdown */}
                <div className="form-group">
                  <div className="paid-by-dropdown">
                    <button 
                      className="paid-by-select paid-by-button" 
                      type="button"
                      onClick={togglePaidByDropdown}
                    >
                      <span className="paid-by-label">Paid by</span>
                      <span className="paid-by-separator"></span>
                      <span className="paid-by-name">{selectedPaidBy.name}</span>
                      <img 
                        src="/svg/downArrowIcon.svg"
                        width="16" 
                        height="16" 
                        alt=""
                        style={{
                          transform: isPaidByDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    </button>
                    <div className={`paid-by-dropdown-content ${isPaidByDropdownOpen ? 'open' : ''}`}>
                      {currentGroupData?.members?.map((member) => (
                        <div 
                          key={member._id || member.id || member.pin}
                          className="paid-by-option member-option"
                          onClick={() => handlePaidBySelect(member)}
                        >
                          <input
                            type="radio"
                            name="paidBy"
                            checked={selectedPaidBy._id === member._id || selectedPaidBy.name === member.name}
                            onChange={() => {}} // Controlled by parent click
                            className="member-radio"
                          />
                          <span className="member-name">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>





                {/* Members Dropdown */}
                <div className="form-group">
                  <div className="members-dropdown">
                    <button 
                      className="members-select" 
                      type="button"
                      onClick={toggleDropdown}
                    >
                      {selectedMembers.size === 0 ? 'Select Members' : `${selectedMembers.size} Member${selectedMembers.size === 1 ? '' : 's'}`}
                      <img 
                        src="/svg/downArrowIcon.svg"
                        width="16" 
                        height="16" 
                        alt=""
                        style={{
                          transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    </button>
                    <div className={`members-dropdown-content ${isDropdownOpen ? 'open' : ''}`}>
                      {currentGroupData?.members && currentGroupData.members.length > 0 ? (
                        currentGroupData.members.map((member, index) => (
                          <label key={member._id || index} className="member-checkbox-item">
                            <input 
                              type="checkbox" 
                              className="member-checkbox"
                              checked={selectedMembers.has(member._id || index)}
                              onChange={(e) => handleMemberSelection(member._id || index, e.target.checked)}
                            />
                            <span className="member-checkbox-label">{member.name}</span>
                          </label>
                        ))
                      ) : (
                        <div className="no-members">No members found</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add Image Button */}
              <div className="form-group">
                <button 
                  className="add-image-button" 
                  type="button"
                  onClick={handleAddImage}
                  title="Add Image"
                >
                  <img 
                    src="/svg/imageIcon.svg"
                    width="20" 
                    height="20" 
                    alt="Add Image"
                    className="image-icon"
                  />
                </button>
              </div>
              </div>

              {/* Add Split Button */}
              <div className="form-group">
                <button 
                  className="add-expense-button primary-btn" 
                  type="button"
                  onClick={handleAddExpense}
                  disabled={isAddingSplit}
                  title={isAddingSplit ? "Adding Split..." : "Add Split"}
                >
                  {isAddingSplit ? (
                    <div className="spinner"></div>
                  ) : (
                    <span className="submit-text">SUBMIT</span>
                  )}
                </button>
              </div>
            </div>

            {/* Member Split Details */}
            {selectedMembers.size > 0 && (
              <div className="member-expense-section">
                <h3 className="section-title">Member Split Details</h3>
                <div className="member-expense-list">
                  {Array.from(selectedMembers).map(memberId => {
                    const member = currentGroupData?.members?.find(m => (m._id || currentGroupData.members.indexOf(m)) === memberId);
                    if (!member) return null;
                    
                    return (
                      <div key={memberId} className="member-expense-row">
                        <div className="member-name">{member.name}</div>
                        
                        <div className="expense-field-group">
                          <div className="input-with-prefix">
                            <span className="input-prefix">$</span>
                            <input 
                              type="number" 
                              className={`member-expense-input ${globalActiveInputType !== 'amount' ? 'visually-disabled' : ''}`}
                              placeholder="0.00"
                              value={memberExpenseData[memberId]?.amount || ''}
                              onChange={(e) => {
                                setActiveInputType('amount');
                                updateMemberExpenseData(memberId, 'amount', e.target.value);
                              }}
                              onFocus={() => setActiveInputType('amount')}
                              onClick={() => setActiveInputType('amount')}
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="expense-field-group">
                          <div className="input-with-suffix">
                            <input 
                              type="number" 
                              className={`member-expense-input ${globalActiveInputType !== 'percentage' ? 'visually-disabled' : ''}`}
                              placeholder="0"
                              value={memberExpenseData[memberId]?.percentage || ''}
                              onChange={(e) => {
                                setActiveInputType('percentage');
                                updateMemberExpenseData(memberId, 'percentage', e.target.value);
                              }}
                              onFocus={() => setActiveInputType('percentage')}
                              onClick={() => setActiveInputType('percentage')}
                              step="0.01"
                              min="0"
                              max="100"
                            />
                            <span className="input-suffix">%</span>
                          </div>
                        </div>

                        <div className="expense-field-group">
                          <div className="input-with-suffix">
                            <input 
                              type="number" 
                              className={`member-expense-input ${globalActiveInputType !== 'shares' ? 'visually-disabled' : ''}`}
                              placeholder="1"
                              value={memberExpenseData[memberId]?.shares || ''}
                              onChange={(e) => {
                                setActiveInputType('shares');
                                updateMemberExpenseData(memberId, 'shares', e.target.value);
                              }}
                              onFocus={() => setActiveInputType('shares')}
                              onClick={() => setActiveInputType('shares')}
                              min="1"
                            />
                            <span className="input-suffix">Shares</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Expense List Section */}
          <div className="expenses-list-section glass-panel-light">
            <h3 className="section-title">Expense List</h3>
            <div className="expenses-section">
              {splits.length > 0 ? (
                <div className="expenses-list">
                  {splits.map((split, index) => {
                    const splitId = split._id || index;
                    const isExpanded = expandedSplits.has(splitId);
                    
                    return (
                      <div 
                        key={splitId} 
                        className="expense-item clickable-item"
                        onClick={() => toggleSplitAccordion(splitId)}
                      >
                        <div className="expense-header">
                          <div className="expense-info">
                            <h4 className="expense-description">{split.splitTitle || split.description || 'Split'}</h4>
                            <div className="expense-meta">
                              <span className="expense-amount">${split.totalAmount?.toFixed(2) || split.amount?.toFixed(2) || '0.00'}</span>
                              <span className="expense-separator">•</span>
                              <span className="expense-date">
                                {new Date(split.createdAt).toLocaleDateString()}
                              </span>
                              <span className="expense-separator">•</span>
                              <span className="expense-paidby">
                                Paid by {split.paidByName || split.createdByName || 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <div className="expense-status">
                            {(() => {
                              // Check if current user paid for this expense
                              const currentUserPaid = split.paidBy === currentUser?.id || 
                                                     split.paidBy === currentUser?.pin ||
                                                     split.paidByName === currentUser?.name;
                              
                              // Special handling for settlement records
                              if (split.splitTitle === 'Settlement Record') {
                                const totalAmount = split.totalAmount || 0;
                                
                                if (currentUserPaid) {
                                  // Current user is payer - lending money
                                  return (
                                    <span className="user-split-amount positive">
                                      +${totalAmount.toFixed(2)}
                                    </span>
                                  );
                                } else {
                                  // Current user is payee - borrowing money
                                  return (
                                    <span className="user-split-amount negative">
                                      -${totalAmount.toFixed(2)}
                                    </span>
                                  );
                                }
                              }
                              
                              // Find current user's split in this expense
                              const currentUserSplit = split.memberSplits?.find(memberSplit => 
                                memberSplit.memberId === currentUser?.id || 
                                memberSplit.memberId === currentUser?.pin ||
                                memberSplit.memberName === currentUser?.name
                              );
                              
                              if (currentUserSplit) {
                                // Calculate the user's owed amount based on split method
                                let userOwedAmount = 0;
                                const totalAmount = split.totalAmount || 0;
                                
                                if (split.splitMethod === 'equal') {
                                  userOwedAmount = totalAmount / split.memberSplits.length;
                                } else if (split.splitMethod === 'amount' && currentUserSplit.splitValue?.amount) {
                                  userOwedAmount = currentUserSplit.splitValue.amount;
                                } else if (split.splitMethod === 'percentage' && currentUserSplit.splitValue?.percentage) {
                                  userOwedAmount = (totalAmount * currentUserSplit.splitValue.percentage) / 100;
                                } else if (split.splitMethod === 'shares' && currentUserSplit.splitValue?.shares) {
                                  const totalShares = split.memberSplits.reduce((sum, ms) => sum + (ms.splitValue?.shares || 1), 0);
                                  userOwedAmount = (totalAmount * currentUserSplit.splitValue.shares) / totalShares;
                                } else {
                                  userOwedAmount = totalAmount / split.memberSplits.length; // fallback to equal
                                }
                                
                                let displayText;
                                let amountClass;
                                
                                if (currentUserPaid) {
                                  // Current user paid - they should receive money from others
                                  // Calculate how much others owe to current user
                                  const amountToReceive = totalAmount - userOwedAmount;
                                  
                                  if (amountToReceive > 0) {
                                    displayText = `+$${amountToReceive.toFixed(2)}`;
                                    amountClass = 'user-split-amount positive';
                                  } else {
                                    displayText = 'Even';
                                    amountClass = 'user-split-amount neutral';
                                  }
                                } else {
                                  // Someone else paid - current user needs to pay back
                                  if (userOwedAmount > 0) {
                                    displayText = `-$${userOwedAmount.toFixed(2)}`;
                                    amountClass = 'user-split-amount negative';
                                  } else {
                                    displayText = 'Even';
                                    amountClass = 'user-split-amount neutral';
                                  }
                                }
                                
                                return (
                                  <span className={amountClass}>
                                    {displayText}
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="user-split-amount neutral">
                                    Not participating
                                  </span>
                                );
                              }
                            })()}
                            
                            {/* Edit and Delete Actions */}
                            {(() => {
                              // Check if current user can edit/delete this expense
                              const isCreatedByCurrentUser = split.createdBy === currentUser?.id || 
                                                           split.createdBy === currentUser?.pin ||
                                                           split.createdByName === currentUser?.name;
                              
                              // Enhanced admin detection - check multiple possible admin identifiers
                              const isGroupCreator = currentGroupData?.createdBy === currentUser?.id ||
                                                    currentGroupData?.createdBy === currentUser?.pin ||
                                                    currentGroupData?.createdBy?.toString() === currentUser?.id?.toString() ||
                                                    currentGroupData?.createdBy?.toString() === currentUser?.pin?.toString() ||
                                                    currentGroupData?.createdByName === currentUser?.name;
                              
                              // Check if user has admin role in members array
                              const hasAdminRole = currentGroupData?.members?.some(member => 
                                (member._id === currentUser?.id || 
                                 member._id === currentUser?.pin || 
                                 member._id?.toString() === currentUser?.id?.toString() ||
                                 member._id?.toString() === currentUser?.pin?.toString() ||
                                 member.pin === currentUser?.pin ||
                                 member.name === currentUser?.name) && 
                                member.role === 'admin'
                              );
                              
                              const isGroupAdmin = isGroupCreator || hasAdminRole;
                              
                              const canEditDelete = isCreatedByCurrentUser || isGroupAdmin;
                              
                              if (canEditDelete) {
                                return (
                                  <div className="expense-actions">
                                    <button 
                                      className="action-btn edit-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Edit expense:', split._id);
                                        // TODO: Implement edit functionality
                                      }}
                                      title="Edit expense"
                                    >
                                      <img src="/svg/editIcon.svg" alt="Edit" width="16" height="16" />
                                    </button>
                                    <button 
                                      className="action-btn delete-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        confirmDeleteExpense(split._id);
                                      }}
                                      title="Delete expense"
                                    >
                                      <img src="/svg/deleteIcon.svg" alt="Delete" width="16" height="16" />
                                    </button>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            
                            <div className="accordion-arrow">
                              <img 
                                src="/svg/downArrowIcon.svg" 
                                alt="Toggle" 
                                width="16" 
                                height="16"
                                style={{
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className={`expense-participants-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
                          {split.memberSplits && split.memberSplits.length > 0 && (
                            <div className="expense-participants">
                              <div className="participants-content">
                                <div className="participants-info">
                                  <div className="participants-header">
                                    <h5 className="participants-title">Split between:</h5>
                                    <span className="split-method-indicator">
                                      {split.splitMethod === 'equal' ? 'Equally' :
                                       split.splitMethod === 'amount' ? 'By Amount' :
                                       split.splitMethod === 'percentage' ? 'By Percentage' :
                                       split.splitMethod === 'shares' ? 'By Shares' : 'Equal'}
                                    </span>
                                  </div>
                                  <div className="participants-list">
                                {split.memberSplits.map((memberSplit, pIndex) => {
                                  // Calculate actual amount owed based on split method
                                  let owedAmount = 0;
                                  const totalAmount = split.totalAmount || 0;
                                  
                                  if (split.splitMethod === 'equal') {
                                    owedAmount = totalAmount / split.memberSplits.length;
                                  } else if (split.splitMethod === 'amount' && memberSplit.splitValue?.amount) {
                                    owedAmount = memberSplit.splitValue.amount;
                                  } else if (split.splitMethod === 'percentage' && memberSplit.splitValue?.percentage) {
                                    owedAmount = (totalAmount * memberSplit.splitValue.percentage) / 100;
                                  } else if (split.splitMethod === 'shares' && memberSplit.splitValue?.shares) {
                                    const totalShares = split.memberSplits.reduce((sum, ms) => sum + (ms.splitValue?.shares || 1), 0);
                                    owedAmount = (totalAmount * memberSplit.splitValue.shares) / totalShares;
                                  } else {
                                    owedAmount = totalAmount / split.memberSplits.length; // fallback to equal
                                  }
                                  
                                  return (
                                    <div key={pIndex} className="participant-item">
                                      <span className="participant-name">{memberSplit.memberName}</span>
                                      <span className="participant-amount">
                                        ${owedAmount.toFixed(2)}
                                      </span>
                                    </div>
                                  );
                                })}
                                  </div>
                                </div>
                                
                                <div className="expense-image-container">
                                  {split.imageUrl ? (
                                    <img 
                                      src={split.imageUrl} 
                                      alt="Expense receipt" 
                                      className="expense-image"
                                    />
                                  ) : (
                                    <div className="expense-image-placeholder">
                                      <img 
                                        src="/svg/imageIcon.svg" 
                                        alt="No image" 
                                        width="32" 
                                        height="32"
                                        className="placeholder-icon"
                                      />
                                      <span className="placeholder-text">No image</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-splits-message">
                  <p>No splits created yet. Use the form above to create your first split!</p>
                </div>
              )}
              
              {isAddingSplit && (
                <div className="adding-expense-indicator">
                  <div className="spinner"></div>
                  <span>Adding split...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settlement Popup */}
      {settlementPopup.isOpen && (
        <Popup
          isOpen={settlementPopup.isOpen}
          onClose={handleSettleCancel}
          title="Settle"
          subtitle={`${settlementPopup.payer} → ${settlementPopup.payee}`}
          type="confirm"
          primaryButtonText="Settle"
          secondaryButtonText="Cancel"
          onPrimaryClick={handleSettleConfirm}
          onSecondaryClick={handleSettleCancel}
          showSecondaryButton={true}
        >
          <div style={{ padding: '20px 0' }}>
            <TextField
              label="Amount"
              type="number"
              value={settlementPopup.amount}
              onChange={(e) => setSettlementPopup({ ...settlementPopup, amount: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'transparent',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--hover-color)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--hover-color)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: "'Quicksand', system-ui, Avenir, Helvetica, Arial, sans-serif",
                  '&.Mui-focused': {
                    color: 'var(--hover-color)',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                  fontFamily: "'Quicksand', system-ui, Avenir, Helvetica, Arial, sans-serif",
                },
              }}
            />
          </div>
        </Popup>
      )}
    </div>
    </>
  )
}
export default GroupPage