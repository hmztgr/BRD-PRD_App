"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:text-primary-foreground",
            className
          )}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <Check className="h-3 w-3 absolute left-0.5 top-0.5 pointer-events-none text-white opacity-0 peer-checked:opacity-100" />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }