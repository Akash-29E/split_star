import './App.css'
import Navbar from './components/Navbar'
import LandingPage from './components/LandingPage'
import CreateGroup from './components/CreateGroup'
import GroupPage from './components/GroupPage'
import GroupSettings from './components/GroupSettings'
import MemberManagement from './components/MemberManagement'
import SharedGroupAccess from './components/SharedGroupAccess'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { groupService } from './services/groups'
import { useState, useEffect } from 'react'

// Create Group page component
function CreateGroupPage() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  const handleCreateGroup = async (data) => {
    try {
      setError(null)
      
      console.log('🚀 Creating group...', data)
      
      const transformedData = groupService.transformGroupData(data)
      console.log('📤 Sending data to backend:', transformedData)
      
      const response = await groupService.createGroup(transformedData)
      console.log('📥 Backend response:', response)
      
      if (response.success) {
        const backendGroupData = groupService.transformBackendData(response.data)
        console.log('✅ Group created successfully!')
        console.log('📋 Full group data:', backendGroupData)
        
        // Get admin PIN from the first member (admin is created first)
        const adminMember = backendGroupData.members?.find(member => member.role === 'admin')
        const adminPin = adminMember?.pin
        
        console.log('🔢 Admin PIN:', adminPin)
        console.log('🆔 UUID:', backendGroupData.uuid)
        
        // Redirect to the shared group URL with admin PIN for auto-authentication
        navigate(`/group/${backendGroupData.uuid}`, { 
          state: { 
            adminPin: adminPin,
            isGroupCreator: true 
          }
        })
      }
    } catch (error) {
      console.error('❌ Failed to create group:', error)
      setError('Failed to create group. Please try again.')
    }
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
      setError(null)
      setGroupData(updatedData)
      setCurrentView('group')
    } catch (error) {
      console.error('Failed to save settings:', error)
      setError('Failed to save settings. Please try again.')
      setGroupData(updatedData)
      setCurrentView('group')
    }
  }

  const handleGoToCreateGroup = () => {
    setCurrentView('create')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create':
        return <CreateGroup onCreateGroup={handleCreateGroup} />
      case 'group':
        return (
          <GroupPage 
            groupData={groupData} 
            onSettings={handleGoToSettings}
            onMembers={handleGoToMembers}
          />
        )
      case 'settings':
        return (
          <GroupSettings 
            groupData={groupData} 
            onBack={handleBackToGroup} 
            onSave={handleSaveSettings} 
          />
        )
      case 'members':
        return (
          <MemberManagement 
            groupData={groupData} 
            onBack={handleBackToGroup} 
          />
        )
      case 'landing':
      default:
        return <LandingPage onCreateGroup={handleGoToCreateGroup} />
    }
  }

  return (
    <div className="home-page">
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {renderCurrentView()}
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
      <Routes>
        <Route path="/" element={<LandingPage onCreateGroup={() => navigate('/create')} />} />
        <Route path="/create" element={<CreateGroupPage />} />
        <Route path="/group/:uuid" element={<SharedGroupAccess />} />
      </Routes>
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
