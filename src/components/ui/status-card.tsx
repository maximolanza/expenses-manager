import * as React from "react"
import { Badge } from "./badge"
import { cn } from "@/lib/utils"

interface StatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'active' | 'inactive' | 'pending' | 'in-progress'
  title: string
  items?: string[]
}

export function StatusCard({ status, title, items, className, ...props }: StatusCardProps) {
  const statusVariants = {
    active: { variant: 'default' as const, text: 'Active' },
    inactive: { variant: 'destructive' as const, text: 'Inactive' },
    pending: { variant: 'secondary' as const, text: 'Pending' },
    'in-progress': { variant: 'default' as const, text: 'In Progress' }
  }

  return (
    <div className={cn("p-6 rounded-lg border space-y-4", className)} {...props}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <Badge variant={statusVariants[status].variant}>
          {statusVariants[status].text}
        </Badge>
      </div>
      {items && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="text-sm text-muted-foreground">
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 