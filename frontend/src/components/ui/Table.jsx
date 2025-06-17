import { cn } from '../../utils/cn'

function Table({ children, className, ...props }) {
  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className={cn("min-w-full divide-y divide-gray-200", className)} {...props}>
          {children}
        </table>
      </div>
    </div>
  )
}

function TableHeader({ children, className, ...props }) {
  return (
    <thead className={cn("bg-gray-50", className)} {...props}>
      {children}
    </thead>
  )
}

function TableBody({ children, className, empty, emptyMessage = "Данные не найдены", ...props }) {
  if (empty) {
    return (
      <tbody>
        <tr>
          <td colSpan="100%" className="text-center py-12">
            <div className="text-gray-500">{emptyMessage}</div>
          </td>
        </tr>
      </tbody>
    )
  }

  return (
    <tbody className={cn("bg-white divide-y divide-gray-200", className)} {...props}>
      {children}
    </tbody>
  )
}

function TableRow({ children, className, hover = true, ...props }) {
  return (
    <tr className={cn(hover && "hover:bg-gray-50", className)} {...props}>
      {children}
    </tr>
  )
}

function TableHead({ children, className, sortable = false, onSort, sortDirection, ...props }) {
  return (
    <th 
      className={cn(
        "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
        sortable && "cursor-pointer select-none hover:text-gray-700",
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <span className="text-gray-400">
            {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
          </span>
        )}
      </div>
    </th>
  )
}

function TableCell({ children, className, ...props }) {
  return (
    <td className={cn("px-6 py-4 whitespace-nowrap", className)} {...props}>
      {children}
    </td>
  )
}

function TableCheckbox({ 
  checked, 
  onChange, 
  indeterminate = false,
  className,
  ...props 
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={input => {
        if (input) input.indeterminate = indeterminate
      }}
      onChange={onChange}
      className={cn("rounded border-gray-300 focus:ring-primary-500", className)}
      {...props}
    />
  )
}

Table.Header = TableHeader
Table.Body = TableBody
Table.Row = TableRow
Table.Head = TableHead
Table.Cell = TableCell
Table.Checkbox = TableCheckbox

export default Table