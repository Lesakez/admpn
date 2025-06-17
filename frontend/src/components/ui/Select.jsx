// Select.jsx
export const Select = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn('select', className)}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
})
Select.displayName = 'Select'