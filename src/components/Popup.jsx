import React from 'react';
import './Popup.css';

/**
 * Reusable Popup Component
 * @param {boolean} isOpen - Controls popup visibility
 * @param {function} onClose - Callback when popup is closed
 * @param {string} title - Popup title
 * @param {string} subtitle - Popup subtitle (optional)
 * @param {string} message - Popup message content
 * @param {React.Node} children - Custom content for popup body
 * @param {string} type - Type of popup: 'confirm', 'error', 'success', 'info'
 * @param {string} primaryButtonText - Text for primary/confirm button
 * @param {string} secondaryButtonText - Text for secondary/cancel button (optional)
 * @param {function} onPrimaryClick - Callback for primary button click
 * @param {function} onSecondaryClick - Callback for secondary button click (optional)
 * @param {boolean} showSecondaryButton - Whether to show the secondary button (default: true)
 */
const Popup = ({
  isOpen,
  onClose,
  title = 'Confirmation',
  subtitle = '',
  message = '',
  children,
  type = 'confirm',
  primaryButtonText = 'OK',
  secondaryButtonText = 'Cancel',
  onPrimaryClick,
  onSecondaryClick,
  showSecondaryButton = true
}) => {
  if (!isOpen) return null;

  const handlePrimaryClick = () => {
    if (onPrimaryClick) {
      onPrimaryClick();
    }
    onClose();
  };

  const handleSecondaryClick = () => {
    if (onSecondaryClick) {
      onSecondaryClick();
    }
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="popup-icon error-icon" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'success':
        return (
          <svg className="popup-icon success-icon" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'info':
        return (
          <svg className="popup-icon info-icon" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'confirm':
      default:
        return (
          <svg className="popup-icon confirm-icon" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
    }
  };

  return (
    <div className="popup-overlay" onClick={handleBackdropClick}>
      <div className="popup-backdrop-blur"></div>
      <div className={`popup-container glass-panel ${type}`}>
        <div className="popup-header">
          {getIcon()}
          <div>
            <h3 className="popup-title">{title}</h3>
            {subtitle && <p className="popup-subtitle">{subtitle}</p>}
          </div>
        </div>
        <div className="popup-body">
          {children || <p className="popup-message">{message}</p>}
        </div>
        <div className="popup-footer">
          {showSecondaryButton && (
            <button 
              className="popup-button secondary-button" 
              onClick={handleSecondaryClick}
            >
              {secondaryButtonText}
            </button>
          )}
          <button 
            className={`popup-button primary-button ${type}`} 
            onClick={handlePrimaryClick}
          >
            {primaryButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
