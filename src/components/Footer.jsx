import './Footer.css'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-logo">
          <span className="logo-text">Splitstar</span>
        </div>
        <div className="footer-links">
          <Link to="/features">Features</Link>
          <Link to="/about">About</Link>
          <a href="#contact">Contact</a>
          <Link to="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
