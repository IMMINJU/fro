'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { ApiClientError, NetworkError, ValidationError } from '@/lib/api/services'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      // errorReporting.captureException(error, {
      //   context: errorInfo,
      //   tags: { component: 'ErrorBoundary' }
      // })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  onRetry: () => void
}

function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const getErrorMessage = (error: Error | null) => {
    if (!error) {return 'An unknown error occurred'}

    if (error instanceof ApiClientError) {
      switch (error.statusCode) {
        case 400:
          return 'Bad request. Please check your input and try again.'
        case 401:
          return 'You are not authorized. Please log in again.'
        case 403:
          return 'You do not have permission to access this resource.'
        case 404:
          return 'The requested resource was not found.'
        case 409:
          return 'A conflict occurred. The resource may already exist.'
        case 422:
          return 'Invalid data was provided. Please check your input.'
        case 429:
          return 'Too many requests. Please wait a moment and try again.'
        case 500:
          return 'A server error occurred. Please try again later.'
        case 502:
        case 503:
          return 'The service is temporarily unavailable. Please try again later.'
        default:
          return error.message || 'An API error occurred'
      }
    }

    if (error instanceof NetworkError) {
      return 'Network connection failed. Please check your internet connection and try again.'
    }

    if (error instanceof ValidationError) {
      return 'Validation failed. Please check your input and try again.'
    }

    return error.message || 'An unexpected error occurred'
  }

  const getErrorTitle = (error: Error | null) => {
    if (!error) {return 'Error'}

    if (error instanceof ApiClientError) {
      if (error.statusCode >= 500) {
        return 'Server Error'
      }
      if (error.statusCode >= 400) {
        return 'Request Error'
      }
    }

    if (error instanceof NetworkError) {
      return 'Connection Error'
    }

    if (error instanceof ValidationError) {
      return 'Validation Error'
    }

    return 'Application Error'
  }

  const shouldShowRetry = (error: Error | null) => {
    if (!error) {return true}

    if (error instanceof ApiClientError) {
      // Don't show retry for client errors (except 429)
      if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
        return false
      }
    }

    return true
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{getErrorTitle(error)}</AlertTitle>
          <AlertDescription className="mt-2">
            {getErrorMessage(error)}
          </AlertDescription>
          {shouldShowRetry(error) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}
        </Alert>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <summary className="cursor-pointer font-medium">
              Error Details (Development)
            </summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}