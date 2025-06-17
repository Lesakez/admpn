// Input.jsx

export const Input = forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn('input', className)}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'