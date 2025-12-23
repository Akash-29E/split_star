import './LandingPage.css'
import Button from './Button'
import Footer from './Footer'
import { Link } from 'react-router-dom'

function LandingPage({ onCreateGroup }) {
  const features = [
    {
      icon: "💰",
      title: "Easy Split Management",
      description: "Effortlessly split expenses among group members with flexible calculation methods."
    },
    {
      icon: "👥",
      title: "Group Collaboration",
      description: "Invite friends, family, or colleagues to collaborate on shared expenses seamlessly."
    },
    {
      icon: "📊",
      title: "Smart Tracking",
      description: "Track payments, view balances, and get insights into your group spending patterns."
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      description: "Your financial data is protected with enterprise-grade security and privacy controls."
    },
    {
      icon: "📱",
      title: "Cross-Platform",
      description: "Access your splits from any device - desktop, tablet, or mobile seamlessly."
    },
    {
      icon: "⚡",
      title: "Real-time Updates",
      description: "Get instant notifications when payments are made or expenses are updated."
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Split expenses with
              <span className="highlight"> Splitstar</span>
            </h1>
            <p className="hero-subtitle">
              The easiest way to split bills, track expenses, and settle up with friends, 
              family, and colleagues. No more awkward money conversations.
            </p>
            <div className="hero-actions">
              <Button 
                variant="primary" 
                size="large"
                onClick={onCreateGroup}
              >
                Create New Split Group
              </Button>
              <button className="secondary-button">
                Learn More
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="feature-preview">
              <div className="preview-card">
                <div className="preview-header">
                  <div className="preview-title">Weekend Trip</div>
                  <div className="preview-amount">$324.50</div>
                </div>
                <div className="preview-members">
                  <div className="member-item">
                    <span className="member-name">Alex</span>
                    <span className="member-amount">$81.13</span>
                  </div>
                  <div className="member-item">
                    <span className="member-name">Sarah</span>
                    <span className="member-amount">$81.13</span>
                  </div>
                  <div className="member-item">
                    <span className="member-name">Mike</span>
                    <span className="member-amount">$81.12</span>
                  </div>
                  <div className="member-item">
                    <span className="member-name">Emma</span>
                    <span className="member-amount">$81.12</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-content">
          <h2 className="features-title">Why Choose Splitstar?</h2>
          <p className="features-subtitle">
            Powerful features designed to make expense sharing simple and stress-free
          </p>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Start Splitting?</h2>
          <p className="cta-subtitle">
            Join thousands of users who have simplified their expense sharing with Splitstar
          </p>
          <Button 
            variant="primary" 
            size="large"
            onClick={onCreateGroup}
          >
            Get Started - Create Your First Group
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage