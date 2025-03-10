"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    indeterminate?: boolean
  }
>(({ className, indeterminate, ...props }, ref) => {
  const innerRef = React.useRef<HTMLInputElement>(null)
  const combinedRef = React.useMemo(() => {
    return (node: HTMLInputElement) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }
  }, [ref])

  React.useEffect(() => {
    if (innerRef.current) {
      innerRef.current.indeterminate = !!indeterminate
    }
  }, [indeterminate])

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        ref={combinedRef}
        className={cn(
          "peer h-4 w-4 shrink-0 appearance-none rounded-sm border border-input ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      <CheckIcon className="absolute left-0 top-0 h-4 w-4 opacity-0 text-primary peer-checked:opacity-100" />
    </div>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox } 