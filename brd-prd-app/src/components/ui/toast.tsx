"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Toast = React.forwardRef<
  HTMLDivElement,
  {
    id?: string
    title?: string
    description?: string
    action?: React.ReactNode
    variant?: "default" | "destructive"
    onOpenChange?: (open: boolean) => void
  }
>(({ id, title, description, action, variant = "default", onOpenChange, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(true)

  const dismiss = () => {
    setIsVisible(false)
    onOpenChange?.(false)
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      dismiss()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        variant === "default" && "border bg-background text-foreground",
        variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground"
      )}
      {...props}
    >
      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      {action}
      <button
        onClick={dismiss}
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
})
Toast.displayName = "Toast"

export { Toast }