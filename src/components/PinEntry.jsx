import './PinEntry.css'
import { useState } from 'react'

function PinEntry({ groupInfo, onPinSubmit, onCancel, error }) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (pin.length !== 6) {
      return
    }
    
    setLoading(true)
    try {
      await onPinSubmit(pin)
    } catch (error) {
      console.error('PIN verification failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPin(value)
  }

  return (
    <div className="main-content">
      <div className="pin-entry-container">
        <div className="pin-entry-header">
          <h1 className="pin-entry-title">Join Group</h1>
          <button className="cancel-button" onClick={onCancel}>
            ← Back
          </button>
        </div>

        <div className="pin-entry-content">
          <div className="group-info-preview">
            <h2>{groupInfo?.groupName || 'Loading...'}</h2>
            {groupInfo?.description && (
              <p className="group-description">{groupInfo.description}</p>
            )}
            {groupInfo?.memberCount && (
              <p className="member-count">{groupInfo.memberCount} members</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="pin-form" autoComplete="on">
            {/* Hidden username field for password managers */}
            <input
              type="hidden"
              name="username"
              value={`${groupInfo?.groupName || 'Group'}_Member`}
              autoComplete="username"
            />
            
            <div className="pin-input-section">
              <label htmlFor="pin" className="pin-label">
                Enter your personal 6-digit PIN
              </label>
              <p className="pin-hint">
                Each member has their own unique PIN for access
              </p>
              <input
                type="password"
                id="pin"
                name="password"
                value={pin}
                onChange={handlePinChange}
                placeholder="••••••"
                className="pin-input"
                maxLength="6"
                autoComplete="current-password"
                autoFocus
              />
              {error && (
                <div className="error-message">{error}</div>
              )}
            </div>

            <div className="pin-actions">
              <button 
                type="button" 
                onClick={onCancel} 
                className="secondary-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="primary-btn"
                disabled={pin.length !== 6 || loading}
              >
                {loading ? 'Verifying...' : 'Access Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PinEntry