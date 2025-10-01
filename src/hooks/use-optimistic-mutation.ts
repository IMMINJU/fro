'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

interface OptimisticMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  queryKey: string[]
  optimisticUpdate?: (oldData: TData[], variables: TVariables) => TData[]
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
}

export function useOptimisticMutation<TData, TVariables>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  onSuccess,
  onError,
}: OptimisticMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData[]>(queryKey)

      // Optimistically update to the new value
      if (optimisticUpdate && previousData) {
        queryClient.setQueryData<TData[]>(queryKey, optimisticUpdate(previousData, variables))
      }

      // Return a context object with the snapshotted value
      return { previousData }
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData<TData[]>(queryKey, context.previousData)
      }
      onError?.(error as Error, variables)
    },
    onSuccess: (data, variables) => {
      onSuccess?.(data, variables)
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return mutation
}

// Specific hook for cloud operations
export function useOptimisticCloudMutation() {
  const queryClient = useQueryClient()

  const createOptimisticUpdate = useCallback((variables: any) => {
    const tempId = `temp-${Date.now()}`
    const optimisticCloud = {
      id: tempId,
      name: variables.name,
      provider: variables.provider,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...variables,
    }

    return (oldData: any[]) => [optimisticCloud, ...oldData]
  }, [])

  const updateOptimisticUpdate = useCallback((variables: any, cloudId: string) => {
    return (oldData: any[]) =>
      oldData.map((cloud) =>
        cloud.id === cloudId ? { ...cloud, ...variables, updatedAt: new Date().toISOString() } : cloud
      )
  }, [])

  const deleteOptimisticUpdate = useCallback((cloudId: string) => {
    return (oldData: any[]) => oldData.filter((cloud) => cloud.id !== cloudId)
  }, [])

  return {
    createOptimisticUpdate,
    updateOptimisticUpdate,
    deleteOptimisticUpdate,
  }
}