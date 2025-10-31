import './Button.css'

function Button({ 
  variant = "default", 
  size = "medium",
  children, 
  onClick,
  className = "",
  ...props 
}) {
  const getButtonClass = () => {
    let baseClass = "glass-button"
    
    if (variant === "add") baseClass += " glass-button--add"
    else if (variant === "remove") baseClass += " glass-button--remove"
    else if (variant === "create") baseClass += " glass-button--create"
    
    if (size === "small") baseClass += " glass-button--small"
    else if (size === "large") baseClass += " glass-button--large"
    
    return `${baseClass} ${className}`.trim()
  }

  return (
    <button
      className={getButtonClass()}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button