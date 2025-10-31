import './GroupPage.css'
import { groupService } from '../services/groups'
import Toast from './Toast'
import useToast from '../hooks/useToast'
import { useState, useEffect } from 'react'

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

  // Members dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Split dropdown state
  const [isSplitDropdownOpen, setIsSplitDropdownOpen] = useState(false);
  const [selectedSplitType, setSelectedSplitType] = useState('Split');
  
  // Expense input states
  const [splitTitle, setSplitTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [taxPercentage, setTaxPercentage] = useState('0');
  
  // Selected members and their expense details
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [memberExpenseData, setMemberExpenseData] = useState({});
  const [globalActiveInputType, setGlobalActiveInputType] = useState('amount');
  
  // Splits state
  const [splits, setSplits] = useState([]);
  const [isAddingSplit, setIsAddingSplit] = useState(false);
  const [expandedSplits, setExpandedSplits] = useState(new Set());
  
  // Toast notification using custom hook
  const { toast, showSuccess, showError, hideToast } = useToast();



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.members-dropdown')) {
        setIsDropdownOpen(false);
      }
      if (isSplitDropdownOpen && !event.target.closest('.split-dropdown')) {
        setIsSplitDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isSplitDropdownOpen]);

  // Load splits when component mounts
  useEffect(() => {
    const loadSplits = async () => {
      if (currentGroupData?.uuid) {
        try {
          console.log('Loading splits for group:', currentGroupData.uuid);
          const response = await groupService.getSplits(currentGroupData.uuid);
          if (response.success) {
            setSplits(response.data || []);
            console.log('Loaded splits:', response.data);
          }
        } catch (error) {
          console.error('Failed to load splits:', error);
          // Don't show alert for loading splits - it's not critical
        }
      }
    };

    loadSplits();
  }, [currentGroupData?.uuid]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleSplitDropdown = () => {
    setIsSplitDropdownOpen(!isSplitDropdownOpen);
  };

  const handleSplitTypeSelect = (type) => {
    setSelectedSplitType(type);
    setIsSplitDropdownOpen(false);
    
    // Reset member expense data when changing split types
    // This ensures users get fresh fields for the new calculation method
    if (currentGroupData) {
      const resetMemberData = currentGroupData.members.reduce((acc, member) => {
        acc[member._id] = {
          included: true,
          amount: '',
          percentage: '',
          shares: ''
        };
        return acc;
      }, {});
      setMemberExpenseData(resetMemberData);
    }
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

  const handleAddExpense = async () => {
    if (!splitTitle.trim()) {
      alert('Please enter a title for the split');
      return;
    }
    
    if (!amount || selectedMembers.size === 0) {
      alert('Please enter an amount and select at least one member');
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
      
      console.log('🔍 Split Method Detection:');
      console.log('- Active input type:', globalActiveInputType);
      console.log('- Detected split method:', detectedSplitMethod);
      console.log('- Member expense data:', memberExpenseData);
      console.log('- Selected members:', Array.from(selectedMembers));
      
      // Prepare split data according to the Split model
      const splitData = {
        splitTitle: splitTitle.trim() || 'Untitled Split',
        splitDescription: 'Split expense',
        baseAmount: parseFloat(amount),
        taxPercentage: parseFloat(taxPercentage) || 0,
        splitMethod: detectedSplitMethod,
        memberSplits: Array.from(selectedMembers).map(memberId => {
          console.log('Looking for member with ID:', memberId);
          console.log('Available members:', currentGroupData?.members);
          
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
          
          console.log('Found member:', member);
          const expenseInfo = memberExpenseData[memberId] || {};
          
          return {
            memberId: memberId,
            memberName: member?.name || `Test Member ${memberId}`,
            isParticipating: true,
            splitValue: {
              amount: expenseInfo.amount ? parseFloat(expenseInfo.amount) : 0,
              percentage: expenseInfo.percentage ? parseFloat(expenseInfo.percentage) : 0,
              shares: expenseInfo.shares ? parseInt(expenseInfo.shares) : 1
            }
          };
        }),
        createdBy: currentUser.pin || currentUser.id || 'unknown',
        createdByName: currentUser.name || 'Unknown'
      };

      console.log('Current User:', currentUser);
      console.log('Creating split:', splitData);
      console.log('Group UUID:', currentGroupData.uuid);
      
      const response = await groupService.createSplit(currentGroupData.uuid, splitData);
      
      if (response.success) {
        console.log('✅ Split created successfully!', response.data);
        
        // Add the new split to the local state
        setSplits(prev => [...prev, response.data]);
        
        // Reset form
        setSplitTitle('');
        setAmount('');
        setTaxPercentage('0');
        setSelectedMembers(new Set());
        setMemberExpenseData({});
        setSelectedSplitType('Split');
        
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

  const handleDeleteExpense = async (splitId) => {
    try {
      console.log('🗑️ Deleting expense:', splitId);
      console.log('🗑️ Group UUID:', currentGroupData.uuid);
      console.log('🗑️ Current user:', currentUser);
      
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

        console.log('✅ Expense deleted successfully');
      } else {
        console.error('❌ Failed to delete expense:', response.error);
        showError(response.error || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('❌ Delete expense failed:', error);
      showError(error.message || 'Failed to delete expense. Please try again.');
    }
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

      // Auto-detect split method based on user input patterns
      const memberIds = Array.from(selectedMembers);
      const hasCustomAmounts = memberIds.some(id => {
        const memberData = id === memberId ? newData[memberId] : prev[id];
        const expectedEqualAmount = totalAmount / memberIds.length;
        const actualAmount = parseFloat(memberData?.amount || 0);
        return Math.abs(actualAmount - expectedEqualAmount) > 0.01;
      });
      
      const hasPercentages = memberIds.some(id => {
        const memberData = id === memberId ? newData[memberId] : prev[id];
        const percentage = parseFloat(memberData?.percentage || 0);
        const expectedEqualPercentage = 100 / memberIds.length;
        return Math.abs(percentage - expectedEqualPercentage) > 0.01;
      });
      
      const hasCustomShares = memberIds.some(id => {
        const memberData = id === memberId ? newData[memberId] : prev[id];
        const shares = parseFloat(memberData?.shares || 1);
        return shares !== 1;
      });

      // Update split type based on detected pattern
      if (field === 'amount' || hasCustomAmounts) {
        setSelectedSplitType('Amount');
      } else if (field === 'percentage' || hasPercentages) {
        setSelectedSplitType('Percentage');
      } else if (field === 'shares' || hasCustomShares) {
        setSelectedSplitType('Shares');
      } else {
        setSelectedSplitType('Split'); // Equal split
      }

      return newData;
    });
  };

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

  return (
    <>
      {/* Toast Notification - Rendered at root level */}
      <Toast 
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
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
            <button className="members-button" onClick={onMembers}>
              <svg className="members-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="settings-button" onClick={onSettings}>
              <svg className="settings-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2578 9.77251 19.9887C9.5799 19.7197 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="share-button" onClick={handleShare}>
              <svg className="share-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M8.59 13.51L15.42 17.49" stroke="currentColor" strokeWidth="2"/>
                <path d="M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="group-content">
          {/* Expense Form Section */}
          <div className="expense-form-section">
            <div className="expense-form">
            <div className="expense-controls">
              {/* Split Title Input - Full Width on Top */}
              <div className="split-title-row">
                <input 
                  type="text" 
                  className="expense-input split-title-input" 
                  placeholder="Split title (e.g., Dinner, Groceries, Rent)"
                  value={splitTitle}
                  onChange={(e) => setSplitTitle(e.target.value)}
                />
              </div>

              <div className="expense-inputs-group">
                {/* Split Type Dropdown */}
                <div className="form-group">
                  <div className="split-dropdown">
                    <button 
                      className="split-select" 
                      type="button"
                      onClick={toggleSplitDropdown}
                    >
                      {selectedSplitType}
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          transform: isSplitDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <div className={`split-dropdown-content ${isSplitDropdownOpen ? 'open' : ''}`}>
                      <div 
                        className="split-option"
                        onClick={() => handleSplitTypeSelect('Split')}
                      >
                        Split (Equal)
                      </div>
                      <div 
                        className="split-option"
                        onClick={() => handleSplitTypeSelect('Subsplit')}
                      >
                        Subsplit (Equal)
                      </div>
                      <div 
                        className="split-option"
                        onClick={() => handleSplitTypeSelect('Amount')}
                      >
                        Amount
                      </div>
                      <div 
                        className="split-option"
                        onClick={() => handleSplitTypeSelect('Percentage')}
                      >
                        Percentage
                      </div>
                      <div 
                        className="split-option"
                        onClick={() => handleSplitTypeSelect('Shares')}
                      >
                        Shares
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="form-group">
                  <div className="input-with-prefix">
                    <span className="input-prefix">$</span>
                    <input 
                      type="number" 
                      className="expense-input" 
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Tax Input */}
                <div className="form-group">
                  <div className="input-with-suffix">
                    <input 
                      type="number" 
                      className="expense-input" 
                      placeholder="0"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(e.target.value)}
                    />
                    <span className="input-suffix">%</span>
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
                      Select Members
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
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
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="image-icon"
                  >
                    <rect 
                      x="3" 
                      y="3" 
                      width="18" 
                      height="18" 
                      rx="2" 
                      ry="2" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    />
                    <circle 
                      cx="8.5" 
                      cy="8.5" 
                      r="1.5" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    />
                    <path 
                      d="M21 15L16 10L5 21" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              </div>

              {/* Add Expense Button */}
              <div className="form-group">
                <button 
                  className="add-expense-button" 
                  type="button"
                  onClick={handleAddExpense}
                  disabled={isAddingSplit}
                  title={isAddingSplit ? "Adding Split..." : "Add Split"}
                >
                  {isAddingSplit ? (
                    <div className="spinner"></div>
                  ) : (
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="checkmark-icon"
                    >
                      <path 
                        d="M20 6L9 17L4 12" 
                        stroke="currentColor" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Member Expense Details */}
            {selectedMembers.size > 0 && (
              <div className="member-expense-section">
                <h3 className="section-title">Member Expense Details</h3>
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

          {/* Splits List Section */}
          <div className="expenses-list-section">
            <h3 className="section-title">Recent Splits</h3>
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
                                Created by {split.createdByName || 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <div className="expense-status">
                            {(() => {
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
                                
                                // Check if current user created this expense
                                const isCreatedByCurrentUser = split.createdBy === currentUser?.id || 
                                                             split.createdBy === currentUser?.pin ||
                                                             split.createdByName === currentUser?.name;
                                
                                // Calculate net amount: what user owes minus what they paid
                                let netAmount;
                                let displayText;
                                let amountClass;
                                
                                if (isCreatedByCurrentUser) {
                                  // User paid the full amount, gets back (totalAmount - userOwedAmount)
                                  netAmount = totalAmount - userOwedAmount;
                                  if (netAmount > 0) {
                                    displayText = `+$${netAmount.toFixed(2)}`;
                                    amountClass = 'user-split-amount positive';
                                  } else if (netAmount < 0) {
                                    displayText = `-$${Math.abs(netAmount).toFixed(2)}`;
                                    amountClass = 'user-split-amount negative';
                                  } else {
                                    displayText = 'Even';
                                    amountClass = 'user-split-amount neutral';
                                  }
                                } else {
                                  // User owes the calculated amount
                                  netAmount = userOwedAmount;
                                  displayText = `$${netAmount.toFixed(2)}`;
                                  amountClass = 'user-split-amount negative';
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
                              
                              // Debug logging for admin detection
                              console.log('🔍 Admin Check Debug for expense:', split.splitTitle);
                              console.log('- Current User:', currentUser);
                              console.log('- Group createdBy:', currentGroupData?.createdBy);
                              console.log('- Group createdByName:', currentGroupData?.createdByName);
                              console.log('- Group members:', currentGroupData?.members);
                              console.log('- Split createdBy:', split.createdBy);
                              console.log('- Split createdByName:', split.createdByName);
                              console.log('- isCreatedByCurrentUser:', isCreatedByCurrentUser);
                              console.log('- isGroupCreator:', isGroupCreator);
                              console.log('- hasAdminRole:', hasAdminRole);
                              console.log('- isGroupAdmin:', isGroupAdmin);
                              console.log('- canEditDelete:', isCreatedByCurrentUser || isGroupAdmin);
                              
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
                                      <svg 
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path 
                                          d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" 
                                          stroke="currentColor" 
                                          strokeWidth="2" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round"
                                        />
                                        <path 
                                          d="M18.5 2.49998C18.8978 2.10216 19.4374 1.87866 20 1.87866C20.5626 1.87866 21.1022 2.10216 21.5 2.49998C21.8978 2.89781 22.1213 3.43737 22.1213 3.99998C22.1213 4.56259 21.8978 5.10216 21.5 5.49998L12 15L8 16L9 12L18.5 2.49998Z" 
                                          stroke="currentColor" 
                                          strokeWidth="2" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>
                                    <button 
                                      className="action-btn delete-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure you want to delete this expense?')) {
                                          handleDeleteExpense(split._id);
                                        }
                                      }}
                                      title="Delete expense"
                                    >
                                      <svg 
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path 
                                          d="M3 6H5H21" 
                                          stroke="currentColor" 
                                          strokeWidth="2" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round"
                                        />
                                        <path 
                                          d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" 
                                          stroke="currentColor" 
                                          strokeWidth="2" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round"
                                        />
                                        <path 
                                          d="M10 11V17" 
                                          stroke="currentColor" 
                                          strokeWidth="2" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round"
                                        />
                                        <path 
                                          d="M14 11V17" 
                                          stroke="currentColor" 
                                          strokeWidth="2" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            
                            <div className="accordion-arrow">
                              <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                                style={{
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                              >
                                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
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
                                      <svg 
                                        width="32" 
                                        height="32" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="placeholder-icon"
                                      >
                                        <rect 
                                          x="3" 
                                          y="3" 
                                          width="18" 
                                          height="18" 
                                          rx="2" 
                                          ry="2" 
                                          stroke="currentColor" 
                                          strokeWidth="2"
                                        />
                                        <circle 
                                          cx="8.5" 
                                          cy="8.5" 
                                          r="1.5" 
                                          stroke="currentColor" 
                                          strokeWidth="2"
                                        />
                                        <path 
                                          d="M21 15L16 10L5 21" 
                                          stroke="currentColor" 
                                          strokeWidth="2" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round"
                                        />
                                      </svg>
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
    </div>
    </>
  )
}

export default GroupPage