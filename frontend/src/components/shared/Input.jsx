const Input = ({ 
  label, 
  error, 
  type = 'text', 
  className = '',
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`input ${error ? 'border-red' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red">{error}</p>
      )}
    </div>
  )
}

export default Input
