// SearchInput.jsx
export const SearchInput = ({ value, onChange, placeholder, className, ...props }) => {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="input pl-10"
        {...props}
      />
    </div>
  )
}