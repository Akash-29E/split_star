import './TextField.css'

function TextField({ 
  type = "text", 
  placeholder = "", 
  value = "", 
  onChange, 
  label = "",
  id = "",
  ...props 
}) {
  return (
    <div className="text-field-container">
      {label && (
        <label htmlFor={id} className="text-field-label">
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="text-field"
        {...props}
      />
    </div>
  )
}

export default TextField