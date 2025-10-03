'use client'

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { useEffect } from 'react'
import { GlobalLoading } from '@/components/loading/global-loading'

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <GlobalLoading />
      <ReactQueryDevtools
        initialIsOpen={false}
        buttonPosition="bottom-right"
      />
      {process.env.NODE_ENV === 'development' && <QueryDevelopmentTools />}
    </QueryClientProvider>
  )
}

/**
 * Development tools for query monitoring
 */
function QueryDevelopmentTools() {
  useEffect(() => {
    // Log cache statistics periodically in development
    const interval = setInterval(() => {
      const stats = {
        queryCount: queryClient.getQueryCache().getAll().length,
        mutationCount: queryClient.getMutationCache().getAll().length,
        cacheSize: new Blob([
          JSON.stringify(queryClient.getQueryCache().getAll())
        ]).size,
      }

      console.group('📊 Query Cache Statistics')
      console.log('Active Queries:', stats.queryCount)
      console.log('Active Mutations:', stats.mutationCount)
      console.log('Cache Size:', `${(stats.cacheSize / 1024).toFixed(2)} KB`)
      console.groupEnd()
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return null
}