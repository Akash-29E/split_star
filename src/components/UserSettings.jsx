import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './UserSettings.css'
import { sessionService } from '../services/session'
import useToast from '../hooks/useToast'

function UserSettings({ onBack, currentUser, onUpdateUser }) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    notifications: {
      push: true,
      email: true,
      expenseUpdates: true,
      paymentReminders: true
    },
    privacy: {
      showPin: false,
      allowInvites: true
    }
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Redirect if no user is signed in
  useEffect(() => {
    const session = sessionService.getSession()
    if (!session && !currentUser) {
      navigate('/')
    }
  }, [currentUser, navigate])

  useEffect(() => {
    loadUserSettings()
  }, [currentUser])

  const loadUserSettings = () => {
    const session = sessionService.getSession()
    if (session) {
      setSettings(prev => ({
        ...prev,
        name: session.name || '',
        email: session.email || ''
      }))
    }
  }

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNotificationToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }))
  }

  const handlePrivacyToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key]
      }
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update session with new user data
      const updatedUser = {
        ...currentUser,
        name: settings.name,
        email: settings.email
      }
      
      sessionService.updateSession(updatedUser)
      
      if (onUpdateUser) {
        onUpdateUser(updatedUser)
      }
      
      showToast('Settings saved successfully!', 'success')
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Failed to save settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    loadUserSettings()
    setIsEditing(false)
  }

  return (
    <div className="main-content">
      <div className="user-settings-container">
        <div className="user-settings-header">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
          <h1 className="page-title">Settings</h1>
        </div>

        <div className="settings-content">
          {/* Profile Section */}
          <div className="settings-section">
            <div className="section-header">
              <h2 className="section-title">Profile</h2>
              {!isEditing && (
                <button 
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  <img src="/svg/editIcon.svg" alt="Edit" />
                  Edit
                </button>
              )}
            </div>
            
            <div className="settings-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter your name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter your email"
                />
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button 
                    className="cancel-button"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button 
                    className="save-button"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notifications Section */}
          <div className="settings-section">
            <div className="section-header">
              <h2 className="section-title">Notifications</h2>
            </div>
            
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Push Notifications</h3>
                  <p>Receive push notifications on your device</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications.push}
                    onChange={() => handleNotificationToggle('push')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Email Notifications</h3>
                  <p>Receive notifications via email</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={() => handleNotificationToggle('email')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Expense Updates</h3>
                  <p>Get notified when expenses are added or updated</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications.expenseUpdates}
                    onChange={() => handleNotificationToggle('expenseUpdates')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Payment Reminders</h3>
                  <p>Receive reminders for pending payments</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications.paymentReminders}
                    onChange={() => handleNotificationToggle('paymentReminders')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="settings-section">
            <div className="section-header">
              <h2 className="section-title">Privacy</h2>
            </div>
            
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Show PIN in Header</h3>
                  <p>Display your PIN in the group header</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.privacy.showPin}
                    onChange={() => handlePrivacyToggle('showPin')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Allow Group Invites</h3>
                  <p>Allow others to invite you to groups</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.privacy.allowInvites}
                    onChange={() => handlePrivacyToggle('allowInvites')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="settings-section">
            <div className="section-header">
              <h2 className="section-title">Account</h2>
            </div>
            
            <div className="settings-list">
              <div className="setting-item danger">
                <div className="setting-info">
                  <h3>Clear All Data</h3>
                  <p>Remove all your local data and sign out</p>
                </div>
                <button 
                  className="danger-button"
                  onClick={() => {
                    if (confirm('Are you sure? This will clear all your local data.')) {
                      sessionService.clearSession()
                      sessionService.clearGroupMemberships()
                      navigate('/')
                    }
                  }}
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSettings
