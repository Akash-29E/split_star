import './ExpensePopup.css'
import { useState, useEffect, useRef } from 'react'
import { TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'

function ExpensePopup({
  isOpen,
  onClose,
  onSubmit,
  members = [],
  currentUser,
  expenseData = null // For editing existing expense
}) {
  const [splitTitle, setSplitTitle] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date())
  const [amount, setAmount] = useState('')
  const [taxPercentage, setTaxPercentage] = useState('0')
  const [selectedPaidBy, setSelectedPaidBy] = useState(currentUser)
  const [isPaidByDropdownOpen, setIsPaidByDropdownOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState(new Set())
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [memberExpenseData, setMemberExpenseData] = useState({})
  const [globalActiveInputType, setGlobalActiveInputType] = useState('amount')

  // Prevent background scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Initialize form with existing expense data if editing
  useEffect(() => {
    if (expenseData) {
      setSplitTitle(expenseData.splitTitle || '')
      setExpenseDate(expenseData.date ? new Date(expenseData.date) : new Date())
      setAmount(expenseData.baseAmount?.toString() || '')
      setTaxPercentage(expenseData.taxPercentage?.toString() || '0')
      // Set other fields as needed
    } else {
      // Reset form for new expense
      setSplitTitle('')
      setExpenseDate(new Date())
      setAmount('')
      setTaxPercentage('0')
      setSelectedMembers(new Set())
      setMemberExpenseData({})
      setSelectedPaidBy(currentUser)
    }
  }, [expenseData, currentUser, isOpen])

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
    if (isPaidByDropdownOpen) setIsPaidByDropdownOpen(false)
  }

  const togglePaidByDropdown = () => {
    setIsPaidByDropdownOpen(!isPaidByDropdownOpen)
    if (isDropdownOpen) setIsDropdownOpen(false)
  }

  const handlePaidBySelect = (member) => {
    setSelectedPaidBy(member)
    setIsPaidByDropdownOpen(false)
  }

  const handleMemberSelection = (memberId, isChecked) => {
    const newSelectedMembers = new Set(selectedMembers)
    if (isChecked) {
      newSelectedMembers.add(memberId)
    } else {
      newSelectedMembers.delete(memberId)
      const newMemberExpenseData = { ...memberExpenseData }
      delete newMemberExpenseData[memberId]
      setMemberExpenseData(newMemberExpenseData)
    }
    setSelectedMembers(newSelectedMembers)
  }

  const handleMemberExpenseChange = (memberId, field, value) => {
    setMemberExpenseData(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value
      }
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!splitTitle.trim()) {
      alert('Please enter an expense title')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (selectedMembers.size === 0) {
      alert('Please select at least one member')
      return
    }

    const expenseFormData = {
      splitTitle: splitTitle.trim(),
      expenseDate,
      baseAmount: parseFloat(amount),
      taxPercentage: parseFloat(taxPercentage) || 0,
      selectedPaidBy,
      selectedMembers: Array.from(selectedMembers),
      memberExpenseData,
      globalActiveInputType
    }

    onSubmit(expenseFormData)
  }

  const handleCancel = () => {
    // Reset form
    setSplitTitle('')
    setExpenseDate(new Date())
    setAmount('')
    setTaxPercentage('0')
    setSelectedMembers(new Set())
    setMemberExpenseData({})
    setSelectedPaidBy(currentUser)
    setIsDropdownOpen(false)
    setIsPaidByDropdownOpen(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="expense-popup-overlay" onClick={handleCancel}>
      <div className="expense-popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="expense-popup-header">
          <h2>{expenseData ? 'Edit Expense' : 'Add New Expense'}</h2>
          <button className="expense-popup-close" onClick={handleCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="expense-popup-form">
          <div className="expense-popup-body">

            {/* Basic Information Section */}
            <div className="form-section">
              <h3 className="section-heading">Expense Details</h3>

              <div className="form-row">
                <TextField
                  label="Description"
                  variant="outlined"
                  placeholder="e.g., Dinner at restaurant"
                  value={splitTitle}
                  onChange={(e) => setSplitTitle(e.target.value)}
                  className="mui-textfield"
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
                  }}
                />
              </div>

              <div className="form-row">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date"
                    value={expenseDate ? dayjs(expenseDate) : null}
                    onChange={(newValue) => setExpenseDate(newValue ? newValue.toDate() : new Date())}
                    maxDate={dayjs()}
                    format="MMM DD, YYYY"
                    slotProps={{
                      popper: {
                        sx: {
                          zIndex: 100000,
                          '& .MuiPickersInputBase-root': {
                            backgroundColor: '#f5f5f5',
                            borderRadius: '12px',
                            fontSize: '14px',
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#9c27b0',
                          },
                        },
                      },
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        className: 'mui-textfield',
                        sx: {
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
                        },
                      },
                    }}
                    sx={{
                      width: '100%',
                    }}
                  />
                </LocalizationProvider>
              </div>
            </div>

            {/* Amount and Tax Row */}
            <div className="expense-popup-row">
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

            {/* Paid By and Members Row */}
            <div className="expense-popup-row">
              <div className="form-group">
                <div className="paid-by-dropdown">
                  <button
                    className="paid-by-select paid-by-button"
                    type="button"
                    onClick={togglePaidByDropdown}
                  >
                    <span className="paid-by-label">Paid by</span>
                    <span className="paid-by-separator"></span>
                    <span className="paid-by-name">{selectedPaidBy?.name || 'Select'}</span>
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
                    {members.map((member) => (
                      <div
                        key={member._id || member.id || member.pin}
                        className="paid-by-option member-option"
                        onClick={() => handlePaidBySelect(member)}
                      >
                        <input
                          type="radio"
                          name="paidBy"
                          checked={selectedPaidBy?._id === member._id || selectedPaidBy?.name === member.name}
                          onChange={() => { }}
                          className="member-radio"
                        />
                        <span className="member-name">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

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
                    {members && members.length > 0 ? (
                      members
                        .filter(member => member.isActive !== false)
                        .map((member, index) => (
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
            </div>

            {/* Member Split Details */}
            {selectedMembers.size > 0 && (
              <div className="member-expense-section">
                <h3 className="section-heading">Split Details</h3>
                <div className="member-expense-list">
                  {Array.from(selectedMembers).map(memberId => {
                    const member = members?.find(m => (m._id || m.id) === memberId);
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
                                setGlobalActiveInputType('amount');
                                handleMemberExpenseChange(memberId, 'amount', e.target.value);
                              }}
                              onFocus={() => setGlobalActiveInputType('amount')}
                              onClick={() => setGlobalActiveInputType('amount')}
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
                                setGlobalActiveInputType('percentage');
                                handleMemberExpenseChange(memberId, 'percentage', e.target.value);
                              }}
                              onFocus={() => setGlobalActiveInputType('percentage')}
                              onClick={() => setGlobalActiveInputType('percentage')}
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
                                setGlobalActiveInputType('shares');
                                handleMemberExpenseChange(memberId, 'shares', e.target.value);
                              }}
                              onFocus={() => setGlobalActiveInputType('shares')}
                              onClick={() => setGlobalActiveInputType('shares')}
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

          <div className="expense-popup-footer">
            <button type="button" className="expense-popup-btn expense-popup-btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="expense-popup-btn expense-popup-btn-submit">
              {expenseData ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExpensePopup
