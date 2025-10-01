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
}

export function ButtonLoading({
  isLoading,
  children,
  className,
  disabled,
  ...props
}: ButtonLoadingProps) {
  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        className
      )}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}