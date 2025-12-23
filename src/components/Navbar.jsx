import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Navbar.css'
import { sessionService } from '../services/session'
import Popup from './Popup'

function Navbar({ onHomeClick, user, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({
    username: '',
    password: ''
  });
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
    navigate('/settings');
  }

  const handleGroups = () => {
    setShowDropdown(false);
    navigate('/groups');
  }

  const handleLogin = () => {
    setShowLoginPopup(true);
  }

  const handleLoginSubmit = () => {
    // TODO: Implement actual login logic
    console.log('Login attempted with:', loginCredentials);
    // For now, just navigate to create page
    setShowLoginPopup(false);
    setLoginCredentials({ username: '', password: '' });
    navigate('/create');
  }

  const handleCancelLogin = () => {
    setShowLoginPopup(false);
    setLoginCredentials({ username: '', password: '' });
  }

  const handleCredentialChange = (field, value) => {
    setLoginCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  }

  return (
    <>
      {/* Login Popup */}
      <Popup
        isOpen={showLoginPopup}
        onClose={handleCancelLogin}
        title="Login"
        type="info"
        primaryButtonText="Login"
        secondaryButtonText="Cancel"
        onPrimaryClick={handleLoginSubmit}
        onSecondaryClick={handleCancelLogin}
        showSecondaryButton={true}
      >
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ 
              display: 'block', 
              color: 'rgba(255, 255, 255, 0.8)', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Username
            </label>
            <input
              type="text"
              value={loginCredentials.username}
              onChange={(e) => handleCredentialChange('username', e.target.value)}
              placeholder="Enter your username"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '1rem',
                fontFamily: 'Quicksand, system-ui, Avenir, Helvetica, Arial, sans-serif',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              color: 'rgba(255, 255, 255, 0.8)', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Password
            </label>
            <input
              type="password"
              value={loginCredentials.password}
              onChange={(e) => handleCredentialChange('password', e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '1rem',
                fontFamily: 'Quicksand, system-ui, Avenir, Helvetica, Arial, sans-serif',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
          </div>
        </div>
      </Popup>

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
          <Link to="/features" className="nav-link">Features</Link>
          <Link to="/about" className="nav-link">About</Link>
        </div>
        {user ? (
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
                <button className="dropdown-item" onClick={handleGroups}>
                  <img src="/svg/groupIcon.svg" width="16" height="16" alt="Groups" />
                  Groups
                </button>
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
        ) : (
          <button className="login-button" onClick={handleLogin}>
            Login
          </button>
        )}
      </div>
    </nav>
    </>
  )
}

export default Navbar