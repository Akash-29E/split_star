import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './UserGroups.css'
import { sessionService } from '../services/session'

function UserGroups({ onBack }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadUserGroups()
  }, [])

  const loadUserGroups = () => {
    try {
      const memberships = sessionService.getGroupMemberships()
      const groupsList = Object.entries(memberships).map(([groupId, memberData]) => ({
        uuid: groupId,
        groupName: memberData.groupName,
        memberName: memberData.name,
        role: memberData.role,
        lastAccessed: memberData.lastAccessed
      }))

      // Sort by last accessed (most recent first)
      groupsList.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
      
      setGroups(groupsList)
    } catch (error) {
      console.error('Error loading groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGroupClick = (groupUuid) => {
    navigate(`/group/${groupUuid}`)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString()
  }

  return (
    <div className="main-content">
      <div className="user-groups-container">
        <div className="user-groups-header">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
          <h1 className="page-title">Your Groups</h1>
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Loading your groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <img src="/svg/groupIcon.svg" width="64" height="64" alt="No groups" style={{ opacity: 0.3 }} />
            <h3>No Groups Yet</h3>
            <p>You haven't joined any groups yet. Create or join a group to get started!</p>
          </div>
        ) : (
          <div className="groups-list">
            {groups.map((group) => (
              <div 
                key={group.uuid} 
                className="group-card"
                onClick={() => handleGroupClick(group.uuid)}
              >
                <div className="group-card-content">
                  <div className="group-icon">
                    <img src="/svg/groupIcon.svg" width="24" height="24" alt="Group" />
                  </div>
                  <div className="group-info">
                    <h3 className="group-name">{group.groupName}</h3>
                    <p className="group-meta">
                      <span className="member-info">
                        {group.memberName} • {group.role}
                      </span>
                      <span className="last-accessed">
                        {formatDate(group.lastAccessed)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="group-card-arrow">
                  <img src="/svg/rightArrowIcon.svg" width="24" height="24" alt="Open" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserGroups
