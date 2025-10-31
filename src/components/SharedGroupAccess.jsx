import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import PinEntry from './PinEntry'
import GroupPage from './GroupPage'
import GroupSettings from './GroupSettings'
import MemberManagement from './MemberManagement'
import { getGroupByUUID, verifyGroupPin } from '../services/groups'

function SharedGroupAccess() {
  const { uuid } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [groupInfo, setGroupInfo] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [fullGroupData, setFullGroupData] = useState(null)
  const [pinError, setPinError] = useState('')
  const [currentView, setCurrentView] = useState('group') // 'group', 'settings', or 'members'

  useEffect(() => {
    const loadGroupInfo = async () => {
      if (!uuid) {
        setError('Invalid group link')
        setLoading(false)
        return
      }

      try {
        console.log('Loading group info for UUID:', uuid)
        console.log('Making request to:', `http://localhost:5000/api/groups/uuid/${uuid}`)
        const response = await getGroupByUUID(uuid)
        console.log('Group info response:', response)
        
        if (response.success) {
          const groupData = response.data || response.group
          setGroupInfo({
            groupName: groupData.groupName,
            description: groupData.description,
            memberCount: groupData.memberCount || groupData.members?.length || 0
          })
        } else {
          setError('Group not found or invalid link')
        }
      } catch (err) {
        console.error('Error loading group:', err)
        setError('Failed to load group information')
      } finally {
        setLoading(false)
      }
    }

    loadGroupInfo()
  }, [uuid])

  // Auto-authenticate if admin PIN is provided (for group creators)
  useEffect(() => {
    const autoAuthenticate = async () => {
      const { adminPin, isGroupCreator } = location.state || {}
      
      if (adminPin && isGroupCreator && !isAuthenticated && uuid) {
        console.log('Auto-authenticating group creator with provided PIN:', adminPin)
        try {
          const response = await verifyGroupPin(uuid, adminPin)
          console.log('Auto-authentication response:', response)
          
          if (response.success) {
            const groupData = response.data || response.group
            setFullGroupData(groupData)
            setIsAuthenticated(true)
            console.log('✅ Auto-authentication successful!')
          } else {
            console.log('❌ Auto-authentication failed, user will need to enter PIN manually')
          }
        } catch (err) {
          console.error('❌ Auto-authentication error:', err)
          console.log('Auto-authentication failed, user will need to enter PIN manually')
        }
      }
    }

    autoAuthenticate()
  }, [uuid, location.state, isAuthenticated])

  const handlePinSubmit = async (pin) => {
    setPinError('')
    
    try {
      console.log('Verifying PIN for UUID:', uuid, 'PIN:', pin)
      const response = await verifyGroupPin(uuid, pin)
      console.log('PIN verification response:', response)
      
      if (response.success) {
        const groupData = response.data || response.group
        setFullGroupData(groupData)
        setIsAuthenticated(true)
      } else {
        setPinError('Invalid PIN. Please try again.')
      }
    } catch (err) {
      console.error('PIN verification error:', err)
      setPinError('Failed to verify PIN. Please try again.')
    }
  }

  const handleCancel = () => {
    navigate('/')
  }

  const handleGoToSettings = () => {
    setCurrentView('settings')
  }

  const handleGoToMembers = () => {
    setCurrentView('members')
  }

  const handleBackToGroup = () => {
    setCurrentView('group')
  }

  const handleSaveSettings = async (updatedData) => {
    try {
      // Update the full group data with new settings
      setFullGroupData(updatedData)
      setCurrentView('group')
    } catch (error) {
      console.error('Failed to save settings:', error)
      // Still update the local state and go back to group view
      setFullGroupData(updatedData)
      setCurrentView('group')
    }
  }

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <h2 style={{ color: 'white', textAlign: 'center' }}>
            Loading group...
          </h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="error-container" style={{ 
          maxWidth: '400px', 
          margin: '0 auto', 
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ color: 'white', marginBottom: '1rem' }}>
            Group Not Found
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '2rem' }}>
            {error}
          </p>
          <button 
            onClick={handleCancel}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)'
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Show PIN entry if not authenticated yet
  if (!isAuthenticated) {
    return (
      <PinEntry
        groupInfo={groupInfo}
        onPinSubmit={handlePinSubmit}
        onCancel={handleCancel}
        error={pinError}
      />
    )
  }

  // Show full group page once authenticated
  return (
    <>
      {currentView === 'group' ? (
        <GroupPage 
          initialGroupData={fullGroupData}
          isSharedAccess={true}
          authenticatedMember={fullGroupData?.authenticatedMember}
          onSettings={handleGoToSettings}
          onMembers={handleGoToMembers}
        />
      ) : currentView === 'settings' ? (
        <GroupSettings 
          groupData={fullGroupData}
          onBack={handleBackToGroup}
          onSave={handleSaveSettings}
        />
      ) : (
        <MemberManagement 
          initialGroupData={fullGroupData}
          onBack={handleBackToGroup}
        />
      )}
    </>
  )
}

export default SharedGroupAccess