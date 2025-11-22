import './App.css'
import Navbar from './components/Navbar'
import LandingPage from './components/LandingPage'
import CreateGroup from './components/CreateGroup'
import SharedGroupAccess from './components/SharedGroupAccess'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { groupService } from './services/groups'
import { sessionService } from './services/session'
import { useState, useEffect } from 'react'

// Create Group page component
function CreateGroupPage({ setCurrentUser, currentUser }) {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  const handleCreateGroup = async (data) => {
    try {
      setError(null)
      
      const transformedData = groupService.transformGroupData(data)
      const response = await groupService.createGroup(transformedData)
      
      if (response.success) {
        const backendGroupData = groupService.transformBackendData(response.data)
        
        // Get admin PIN from the first member (admin is created first)
        const adminMember = backendGroupData.members?.find(member => member.role === 'admin')
        const adminPin = adminMember?.pin
        
        // Set current user as the admin
        if (adminMember) {
          setCurrentUser({
            id: adminMember._id || adminMember.id,
            name: adminMember.name,
            pin: adminPin,
            role: 'admin',
            groupId: backendGroupData.uuid,
            groupName: backendGroupData.groupName
          })
        }
        
        // Redirect to the shared group URL with admin PIN for auto-authentication
        navigate(`/group/${backendGroupData.uuid}`, { 
          state: { 
            adminPin: adminPin,
            isGroupCreator: true 
          }
        })
      } else {
        console.error('❌ Failed to create group:', response.error)
        setError(response.error)
      }
    } catch (error) {
      console.error('❌ Group creation failed:', error)
      setError('Failed to create group. Please try again.')
    }
  }

  return (
    <div className="create-group-page">
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      <CreateGroup onCreateGroup={handleCreateGroup} currentUser={currentUser} />
    </div>
  )
}

// App content component with access to navigate
function AppContent() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)

  // Load user session on mount
  useEffect(() => {
    const session = sessionService.getSession()
    if (session) {
      setCurrentUser(session)
    }
  }, [])

  // Update session when user changes
  useEffect(() => {
    if (currentUser) {
      sessionService.saveSession(currentUser)
    } else {
      sessionService.clearSession()
    }
  }, [currentUser])
  
  const handleNavHome = () => {
    navigate('/')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    sessionService.clearSession()
  }

  return (
    <div className="app">
      <Navbar onHomeClick={handleNavHome} user={currentUser} onLogout={handleLogout} />
      <main className="main-container">
        <Routes>
          <Route path="/" element={<LandingPage onCreateGroup={() => navigate('/create')} />} />
          <Route path="/create" element={<CreateGroupPage setCurrentUser={setCurrentUser} currentUser={currentUser} />} />
          <Route path="/group/:uuid" element={<SharedGroupAccess setCurrentUser={setCurrentUser} />} />
        </Routes>
      </main>
    </div>
  )
}

// Main App component with Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App