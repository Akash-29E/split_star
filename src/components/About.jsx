import './About.css'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import Footer from './Footer'

function About() {
  const navigate = useNavigate()

  const values = [
    {
      icon: "🎯",
      title: "Simplicity First",
      description: "We believe managing shared expenses should be effortless. Our intuitive design ensures anyone can split bills without confusion or hassle."
    },
    {
      icon: "🤝",
      title: "Trust & Transparency",
      description: "Financial matters require trust. We provide complete transparency in all calculations and transactions, so everyone knows exactly where they stand."
    },
    {
      icon: "🔒",
      title: "Privacy Matters",
      description: "Your financial data is personal. We're committed to protecting your privacy with robust security measures and never selling your data."
    },
    {
      icon: "💡",
      title: "Innovation",
      description: "We constantly improve and adapt to meet your needs. Your feedback drives our development and shapes the future of Splitstar."
    }
  ]

  const features = [
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Real-time calculations and updates ensure you're always in sync with your group."
    },
    {
      icon: "🌍",
      title: "Globally Accessible",
      description: "Access your expense groups from anywhere in the world, on any device."
    },
    {
      icon: "🎨",
      title: "Beautiful Design",
      description: "Modern glassmorphism UI that's both functional and aesthetically pleasing."
    },
    {
      icon: "🔄",
      title: "Always Improving",
      description: "Regular updates and new features based on user feedback and needs."
    }
  ]

  const stats = [
    { number: "1000+", label: "Active Users" },
    { number: "5000+", label: "Groups Created" },
    { number: "50K+", label: "Expenses Tracked" },
    { number: "99.9%", label: "Uptime" }
  ]

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1 className="about-hero-title">
            About <span className="highlight">Splitstar</span>
          </h1>
          <p className="about-hero-subtitle">
            Making shared expenses simple, transparent, and stress-free for everyone
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="about-story-section">
        <div className="about-story-content">
          <h2 className="section-title">Our Story</h2>
          <div className="story-text-container">
            <p className="story-text">
              Splitstar was born from a simple frustration: the awkwardness and complexity of 
              splitting expenses with friends and family. We've all been there – trying to figure 
              out who owes what after a group dinner, managing spreadsheets for roommate expenses, 
              or coordinating payments during a group trip.
            </p>
            <p className="story-text">
              We believed there had to be a better way. So we built Splitstar – a platform that 
              makes expense sharing as simple as it should be. No more complicated spreadsheets, 
              no more awkward money conversations, no more confusion about who owes what.
            </p>
            <p className="story-text">
              Today, Splitstar helps thousands of users worldwide manage their shared expenses 
              with ease. Whether you're splitting rent with roommates, tracking group travel costs, 
              or managing event expenses, we're here to make it effortless.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats-section">
        <div className="about-stats-content">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission-section">
        <div className="about-mission-content">
          <h2 className="section-title">Our Mission</h2>
          <div className="mission-card">
            <p className="mission-text">
              To eliminate the stress and awkwardness from shared expenses by providing 
              a transparent, intuitive, and secure platform that brings people together 
              rather than creating friction over money.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-values-section">
        <div className="about-values-content">
          <h2 className="section-title">Our Values</h2>
          <p className="section-subtitle">
            The principles that guide everything we do
          </p>

          <div className="values-grid">
            {values.map((value, index) => (
              <div key={index} className="value-card">
                <div className="value-icon">{value.icon}</div>
                <h3 className="value-title">{value.title}</h3>
                <p className="value-description">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="about-why-section">
        <div className="about-why-content">
          <h2 className="section-title">Why Choose Splitstar?</h2>
          <div className="why-grid">
            {features.map((feature, index) => (
              <div key={index} className="why-card">
                <div className="why-icon">{feature.icon}</div>
                <h3 className="why-title">{feature.title}</h3>
                <p className="why-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="about-tech-section">
        <div className="about-tech-content">
          <h2 className="section-title">Built with Modern Technology</h2>
          <p className="section-subtitle">
            Powered by cutting-edge tools for reliability and performance
          </p>
          
          <div className="tech-stack">
            <div className="tech-category">
              <h3 className="tech-category-title">Frontend</h3>
              <div className="tech-items">
                <span className="tech-item">React 19</span>
                <span className="tech-item">Vite</span>
                <span className="tech-item">React Router</span>
              </div>
            </div>
            <div className="tech-category">
              <h3 className="tech-category-title">Backend</h3>
              <div className="tech-items">
                <span className="tech-item">Node.js</span>
                <span className="tech-item">Express</span>
                <span className="tech-item">MongoDB</span>
              </div>
            </div>
            <div className="tech-category">
              <h3 className="tech-category-title">Security</h3>
              <div className="tech-items">
                <span className="tech-item">JWT</span>
                <span className="tech-item">HTTPS/TLS</span>
                <span className="tech-item">PIN Authentication</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta-section">
        <div className="about-cta-content">
          <h2 className="about-cta-title">Join the Splitstar Community</h2>
          <p className="about-cta-subtitle">
            Start managing your shared expenses with confidence today
          </p>
          <Button 
            variant="primary" 
            size="large"
            onClick={() => navigate('/create')}
          >
            Create Your First Group
          </Button>
        </div>
      </section>

      {/* Contact Section */}
      <section className="about-contact-section">
        <div className="about-contact-content">
          <h2 className="section-title">Get in Touch</h2>
          <p className="contact-text">
            Have questions, feedback, or suggestions? We'd love to hear from you!
          </p>
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-label">Email:</span>
              <span className="contact-value">hello@splitstar.app</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Support:</span>
              <span className="contact-value">support@splitstar.app</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Website:</span>
              <span className="contact-value">www.splitstar.app</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default About
