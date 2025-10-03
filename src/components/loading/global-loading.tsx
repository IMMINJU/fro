'use client'

import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GlobalLoadingProps {
  className?: string
}

export function GlobalLoading({ className }: GlobalLoadingProps) {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()

  const isLoading = isFetching > 0 || isMutating > 0

  if (!isLoading) return null

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg",
        className
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

interface ButtonLoadingProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ButtonLoading({
  isLoading,
  children,
  className,
  disabled,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonLoadingProps) {
  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={cn(
        // Base button styles from Shadcn
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // Variant styles
        variant === 'default' && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        variant === 'outline' && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        variant === 'secondary' && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === 'ghost' && "hover:bg-accent hover:text-accent-foreground",
        variant === 'link' && "text-primary underline-offset-4 hover:underline",
        // Size styles
        size === 'default' && "h-10 px-4 py-2",
        size === 'sm' && "h-9 rounded-md px-3",
        size === 'lg' && "h-11 rounded-md px-8",
        size === 'icon' && "h-10 w-10",
        // Gap for loading icon
        "gap-2",
        className
      )}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}