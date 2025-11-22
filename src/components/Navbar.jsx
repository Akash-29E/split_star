import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'
import { sessionService } from '../services/session'

function Navbar({ onHomeClick, user, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleHomeClick = (e) => {
    e.preventDefault()
    if (onHomeClick) {
      onHomeClick()
    }
  }

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  }

  const handleLogout = () => {
    // Get current group UUID before clearing session
    const groupId = user?.groupId;
    
    // Clear session
    sessionService.clearSession();
    setShowDropdown(false);
    
    // Call parent logout callback if provided
    if (onLogout) {
      onLogout();
    }
    
    // Navigate to group PIN entry page if user was in a group, otherwise home
    if (groupId) {
      navigate(`/group/${groupId}`);
      // Force page refresh to clear all state
      window.location.reload();
    } else {
      navigate('/');
      window.location.reload();
    }
  }

  const handleSettings = () => {
    setShowDropdown(false);
    // TODO: Navigate to settings page or open settings modal
    console.log('Settings clicked');
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
          <div className="brand-logo">
            <img src="/svg/star-svgrepo.svg" className='brand-logo-svg' alt="StarLogo" />
          </div>
          <span className="brand-text">Splitstar</span>
        </div>
        <div className="navbar-menu">
          <a href="#home" className="nav-link" onClick={handleHomeClick}>Home</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#about" className="nav-link">About</a>
        </div>
        {user && (
          <div className="navbar-user-profile" ref={dropdownRef}>
            <div className="user-profile-wrapper" onClick={toggleDropdown}>
              <div className="user-profile-icon">
                <img src="/svg/profileIcon.svg" className='profile-icon-svg' alt="ProfileIcon" />
              </div>
              <span className="user-profile-name">{user.name || user.firstName || 'User'}</span>
              <img 
                src="/svg/downArrowIcon.svg"
                className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}
                width="12" 
                height="12" 
                alt=""
              />
            </div>
            {showDropdown && (
              <div className="user-dropdown-menu">
                <button className="dropdown-item" onClick={handleSettings}>
                  <img src="/svg/settingsIcon.svg" width="16" height="16" alt="Settings" />
                  Settings
                </button>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <img src="/svg/logoutIcon.svg" width="16" height="16" alt="Logout" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar