// Badge.jsx
export const Badge = ({ children, variant = 'default', className, ...props }) => {
  const variants = {
    default: 'badge-gray',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info'
  }

  return (
    <span 
      className={cn('badge', variants[variant], className)} 
      {...props}
    >
      {children}
    </span>
  )
}