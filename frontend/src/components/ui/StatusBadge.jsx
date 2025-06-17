import { cn } from '../../utils/cn'
import { getStatusColor, getStatusDescription } from '../../utils/statuses'

export default function StatusBadge({ 
  status, 
  entityType,
  showDescription = false, 
  className,
  onClick,
  interactive = false
}) {
  return (
    <span 
      className={cn(
        'badge', 
        getStatusColor(status), 
        interactive && 'cursor-pointer hover:opacity-75',
        className
      )}
      onClick={onClick}
    >
      {showDescription ? getStatusDescription(status) : status}
    </span>
  )
}