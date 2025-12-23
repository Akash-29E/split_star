import './Privacy.css'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import Footer from './Footer'

function Privacy() {
  const navigate = useNavigate()

  const sections = [
    {
      title: "Information We Collect",
      icon: "📋",
      content: [
        {
          subtitle: "Group and Member Information",
          text: "When you create a group or join as a member, we collect the group name, member names, and PIN codes for secure access. This information is essential for the core functionality of Splitstar."
        },
        {
          subtitle: "Expense Data",
          text: "We store details about expenses you add, including amounts, descriptions, dates, and how they're split among members. This data is used solely to provide you with accurate tracking and balance calculations."
        },
        {
          subtitle: "Usage Information",
          text: "We may collect information about how you interact with our service, such as feature usage patterns and session data, to improve our application and user experience."
        }
      ]
    },
    {
      title: "How We Use Your Information",
      icon: "🎯",
      content: [
        {
          subtitle: "Service Delivery",
          text: "Your data is used to provide, maintain, and improve the Splitstar service, including calculating splits, tracking balances, and managing group memberships."
        },
        {
          subtitle: "Communication",
          text: "We may use your information to send you service-related notifications, updates about your groups, and important changes to our service."
        },
        {
          subtitle: "Security and Fraud Prevention",
          text: "We use your information to protect the security and integrity of our service, prevent fraud, and ensure compliance with our terms of service."
        }
      ]
    },
    {
      title: "Data Storage and Security",
      icon: "🔐",
      content: [
        {
          subtitle: "Secure Storage",
          text: "All your data is stored securely in MongoDB databases with enterprise-grade encryption. We implement industry-standard security measures to protect your information."
        },
        {
          subtitle: "Data Encryption",
          text: "Data transmitted between your device and our servers is encrypted using HTTPS/TLS protocols, ensuring your information remains private and secure during transmission."
        },
        {
          subtitle: "Access Controls",
          text: "PIN-based authentication ensures that only authorized members can access group data. We implement strict access controls and regularly audit our security practices."
        }
      ]
    },
    {
      title: "Data Sharing and Disclosure",
      icon: "🤝",
      content: [
        {
          subtitle: "No Data Selling",
          text: "We do not sell, rent, or trade your personal information to third parties for marketing purposes. Your privacy is our priority."
        },
        {
          subtitle: "Group Members",
          text: "Information you add to a group (expenses, payments, etc.) is shared with other members of that group as part of the core functionality."
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose your information if required by law, legal process, or governmental request, or to protect the rights, property, or safety of Splitstar, our users, or others."
        }
      ]
    },
    {
      title: "Your Rights and Choices",
      icon: "⚖️",
      content: [
        {
          subtitle: "Access and Control",
          text: "You have the right to access, update, or delete your information within the application. Group admins can manage group data and member access."
        },
        {
          subtitle: "Data Portability",
          text: "You can export your expense data and transaction history at any time through the application interface."
        },
        {
          subtitle: "Account Deletion",
          text: "You can request deletion of your data by leaving groups or contacting us. Please note that some information may be retained for legal or legitimate business purposes."
        }
      ]
    },
    {
      title: "Cookies and Tracking",
      icon: "🍪",
      content: [
        {
          subtitle: "Session Management",
          text: "We use browser storage (localStorage/sessionStorage) to maintain your logged-in state and remember your preferences for a better user experience."
        },
        {
          subtitle: "Analytics",
          text: "We may use analytics tools to understand how users interact with our service, helping us improve functionality and user experience."
        },
        {
          subtitle: "No Third-Party Tracking",
          text: "We do not use third-party advertising cookies or tracking pixels. Your browsing behavior on Splitstar is not tracked for advertising purposes."
        }
      ]
    },
    {
      title: "Children's Privacy",
      icon: "👶",
      content: [
        {
          subtitle: "Age Restrictions",
          text: "Splitstar is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13."
        },
        {
          subtitle: "Parental Consent",
          text: "If we become aware that we have collected information from a child under 13 without parental consent, we will take steps to delete that information promptly."
        }
      ]
    },
    {
      title: "Changes to Privacy Policy",
      icon: "📝",
      content: [
        {
          subtitle: "Policy Updates",
          text: "We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons."
        },
        {
          subtitle: "Notification",
          text: "We will notify users of any material changes to this policy through the application or via other communication channels. Continued use of the service after changes constitutes acceptance."
        }
      ]
    }
  ]

  return (
    <div className="privacy-page">
      {/* Hero Section */}
      <section className="privacy-hero">
        <div className="privacy-hero-content">
          <h1 className="privacy-hero-title">
            Privacy Policy
          </h1>
          <p className="privacy-hero-subtitle">
            Your privacy matters to us. Learn how Splitstar collects, uses, 
            and protects your personal information.
          </p>
          <p className="privacy-last-updated">
            Last Updated: December 23, 2025
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="privacy-intro-section">
        <div className="privacy-intro-content">
          <p className="privacy-intro-text">
            At Splitstar, we are committed to protecting your privacy and ensuring the security 
            of your personal information. This Privacy Policy explains what information we collect, 
            how we use it, and your rights regarding your data. By using Splitstar, you agree to 
            the terms outlined in this policy.
          </p>
        </div>
      </section>

      {/* Privacy Sections */}
      <section className="privacy-sections">
        <div className="privacy-sections-content">
          {sections.map((section, index) => (
            <div key={index} className="privacy-section-card">
              <div className="privacy-section-header">
                <span className="privacy-section-icon">{section.icon}</span>
                <h2 className="privacy-section-title">{section.title}</h2>
              </div>
              <div className="privacy-section-content">
                {section.content.map((item, idx) => (
                  <div key={idx} className="privacy-content-item">
                    <h3 className="privacy-content-subtitle">{item.subtitle}</h3>
                    <p className="privacy-content-text">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="privacy-contact-section">
        <div className="privacy-contact-content">
          <h2 className="privacy-contact-title">Questions About Privacy?</h2>
          <p className="privacy-contact-text">
            If you have any questions, concerns, or requests regarding this Privacy Policy 
            or how we handle your data, please don't hesitate to contact us.
          </p>
          <div className="privacy-contact-info">
            <p><strong>Email:</strong> privacy@splitstar.app</p>
            <p><strong>Website:</strong> www.splitstar.app</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="privacy-cta-section">
        <div className="privacy-cta-content">
          <h2 className="privacy-cta-title">Ready to Get Started?</h2>
          <p className="privacy-cta-subtitle">
            Start managing your shared expenses with confidence and security
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

      <Footer />
    </div>
  )
}

export default Privacy
