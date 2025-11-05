import './App.css'
import Navbar from './components/Navbar'
import LandingPage from './components/LandingPage'
import CreateGroup from './components/CreateGroup'
import SharedGroupAccess from './components/SharedGroupAccess'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { groupService } from './services/groups'
import { useState } from 'react'

// Create Group page component
function CreateGroupPage() {
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
      <CreateGroup onCreateGroup={handleCreateGroup} />
    </div>
  )
}

// App content component with access to navigate
function AppContent() {
  const navigate = useNavigate()
  
  const handleNavHome = () => {
    navigate('/')
  }

  return (
    <div className="app">
      <Navbar onHomeClick={handleNavHome} />
      <main className="main-container">
        <Routes>
          <Route path="/" element={<LandingPage onCreateGroup={() => navigate('/create')} />} />
          <Route path="/create" element={<CreateGroupPage />} />
          <Route path="/group/:uuid" element={<SharedGroupAccess />} />
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