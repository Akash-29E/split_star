import './Features.css'
import Button from './Button'
import Footer from './Footer'
import { useNavigate } from 'react-router-dom'

function Features() {
  const navigate = useNavigate()

  const mainFeatures = [
    {
      icon: "💰",
      title: "Easy Split Management",
      description: "Effortlessly split expenses among group members with flexible calculation methods.",
      details: [
        "Split bills equally or by custom amounts",
        "Support for percentage-based splits",
        "Multiple currency support",
        "Automatic calculation and balancing"
      ]
    },
    {
      icon: "👥",
      title: "Group Collaboration",
      description: "Invite friends, family, or colleagues to collaborate on shared expenses seamlessly.",
      details: [
        "Create unlimited groups",
        "Easy member invitation via PIN",
        "Role-based permissions (Admin/Member)",
        "Real-time member synchronization"
      ]
    },
    {
      icon: "📊",
      title: "Smart Tracking",
      description: "Track payments, view balances, and get insights into your group spending patterns.",
      details: [
        "Detailed expense history",
        "Visual balance summaries",
        "Track who owes what to whom",
        "Export transaction records"
      ]
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      description: "Your financial data is protected with enterprise-grade security and privacy controls.",
      details: [
        "PIN-based group access",
        "Encrypted data transmission",
        "MongoDB secure storage",
        "No personal data selling"
      ]
    },
    {
      icon: "📱",
      title: "Cross-Platform",
      description: "Access your splits from any device - desktop, tablet, or mobile seamlessly.",
      details: [
        "Responsive web design",
        "Works on all modern browsers",
        "No app installation required",
        "Sync across all devices"
      ]
    },
    {
      icon: "⚡",
      title: "Real-time Updates",
      description: "Get instant notifications when payments are made or expenses are updated.",
      details: [
        "Live expense updates",
        "Instant balance recalculation",
        "Group activity feed",
        "Member join/leave notifications"
      ]
    }
  ]

  const useCases = [
    {
      icon: "🏠",
      title: "Roommate Expenses",
      description: "Split rent, utilities, groceries, and household supplies with roommates effortlessly."
    },
    {
      icon: "✈️",
      title: "Travel & Trips",
      description: "Manage shared expenses during group trips, vacations, and adventures."
    },
    {
      icon: "🎉",
      title: "Events & Parties",
      description: "Track costs for parties, weddings, and special events with multiple contributors."
    },
    {
      icon: "💼",
      title: "Team Projects",
      description: "Coordinate project expenses and reimbursements with colleagues and teams."
    },
    {
      icon: "🍽️",
      title: "Dining Out",
      description: "Split restaurant bills, food delivery, and group dining expenses fairly."
    },
    {
      icon: "👨‍👩‍👧‍👦",
      title: "Family Expenses",
      description: "Manage shared family costs, gifts, and household expenses together."
    }
  ]

  const handleGetStarted = () => {
    navigate('/create')
  }

  return (
    <div className="features-page">
      {/* Hero Section */}
      <section className="features-hero">
        <div className="features-hero-content">
          <h1 className="features-hero-title">
            Powerful Features for
            <span className="highlight"> Effortless Expense Sharing</span>
          </h1>
          <p className="features-hero-subtitle">
            Splitstar provides everything you need to manage shared expenses with ease,
            transparency, and precision. No more spreadsheets or awkward conversations.
          </p>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="features-main-section">
        <div className="features-main-content">
          <h2 className="section-title">Core Features</h2>
          <p className="section-subtitle">
            Designed to make expense sharing simple, transparent, and stress-free
          </p>

          <div className="features-detail-grid">
            {mainFeatures.map((feature, index) => (
              <div key={index} className="feature-detail-card">
                <div className="feature-detail-header">
                  <div className="feature-detail-icon">{feature.icon}</div>
                  <h3 className="feature-detail-title">{feature.title}</h3>
                </div>
                <p className="feature-detail-description">{feature.description}</p>
                <ul className="feature-detail-list">
                  {feature.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases-section">
        <div className="use-cases-content">
          <h2 className="section-title">Perfect For Every Occasion</h2>
          <p className="section-subtitle">
            Whether you're traveling, living with roommates, or organizing events,
            Splitstar adapts to your needs
          </p>

          <div className="use-cases-grid">
            {useCases.map((useCase, index) => (
              <div key={index} className="use-case-card">
                <div className="use-case-icon">{useCase.icon}</div>
                <h3 className="use-case-title">{useCase.title}</h3>
                <p className="use-case-description">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="how-it-works-content">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Get started in three simple steps</p>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Create a Group</h3>
              <p className="step-description">
                Set up a new group for your shared expenses. Add members and customize settings.
              </p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Add Expenses</h3>
              <p className="step-description">
                Log expenses as they happen. Choose how to split them - equally or custom amounts.
              </p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Settle Up</h3>
              <p className="step-description">
                View who owes what and settle balances. Track everything in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="features-cta-section">
        <div className="features-cta-content">
          <h2 className="features-cta-title">Ready to Simplify Your Expense Sharing?</h2>
          <p className="features-cta-subtitle">
            Join Splitstar today and experience hassle-free group expense management
          </p>
          <Button 
            variant="primary" 
            size="large"
            onClick={handleGetStarted}
          >
            Get Started - It's Free!
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Features
