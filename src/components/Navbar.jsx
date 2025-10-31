import './Navbar.css'

function Navbar({ onHomeClick }) {
  const handleHomeClick = (e) => {
    e.preventDefault()
    if (onHomeClick) {
      onHomeClick()
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
          <div className="brand-logo">
            <img src="/StarLogoN.svg" className='brand-logo-svg' alt="StarLogo" />
          </div>
          <span className="brand-text">Splitstar</span>
        </div>
        <div className="navbar-menu">
          <a href="#home" className="nav-link" onClick={handleHomeClick}>Home</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#about" className="nav-link">About</a>
        </div>
      </div>
    </nav>
  )
}

export default Navbar