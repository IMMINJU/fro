'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { ListResponse, ApiClientError } from '@/lib/api/services'

/**
 * Generic hook for fetching paginated lists
 * @template T - Entity type
 */
export function useList<T>(
  queryKey: QueryKey,
  fetcher: () => Promise<ListResponse<T>>,
  options?: Omit<
    UseQueryOptions<ListResponse<T>, ApiClientError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<ListResponse<T>, ApiClientError>({
    queryKey,
    queryFn: fetcher,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Generic hook for fetching a single entity
 * @template T - Entity type
 */
export function useGetOne<T>(
  queryKey: QueryKey,
  fetcher: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, ApiClientError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, ApiClientError>({
    queryKey,
    queryFn: fetcher,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Generic hook for creating entities with optimistic updates
 * @template T - Entity type
 * @template TCreate - Creation request type
 */
export function useCreate<T, TCreate>(
  invalidateKey: QueryKey,
  mutationFn: (data: TCreate) => Promise<T>,
  options?: {
    translationKey?: string
    onOptimisticUpdate?: (data: TCreate) => Partial<T>
    mutationOptions?: UseMutationOptions<T, ApiClientError, TCreate, { previousData: any }>
  }
) {
  const queryClient = useQueryClient()
  const t = useTranslations(options?.translationKey || 'messages')

  return useMutation<T, ApiClientError, TCreate, { previousData: any }>({
    mutationFn,
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: invalidateKey })

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({ queryKey: invalidateKey })

      // Optimistic update if handler provided
      if (options?.onOptimisticUpdate) {
        queryClient.setQueriesData<ListResponse<T>>(
          { queryKey: invalidateKey },
          (old) => {
            if (!old) return old

            const optimisticItem = {
              id: `temp-${Date.now()}`,
              ...options.onOptimisticUpdate!(newData),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as T

            return {
              ...old,
              items: [optimisticItem, ...old.items],
              total: old.total + 1,
            }
          }
        )
      }

      return { previousData }
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error(t('createError'), {
        description: error.message || 'An error occurred',
      })
    },
    onSuccess: (data: any) => {
      toast.success(t('createSuccess'), {
        description: data?.name ? `${data.name} has been created` : undefined,
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey })
    },
    ...options?.mutationOptions,
  })
}

/**
 * Generic hook for updating entities with optimistic updates
 * @template T - Entity type
 * @template TUpdate - Update request type
 */
export function useUpdate<T extends { id: string }, TUpdate>(
  invalidateKey: QueryKey,
  mutationFn: (params: { id: string; data: Partial<TUpdate> }) => Promise<T>,
  options?: {
    translationKey?: string
    onOptimisticUpdate?: (id: string, data: Partial<TUpdate>) => Partial<T>
    mutationOptions?: UseMutationOptions<
      T,
      ApiClientError,
      { id: string; data: Partial<TUpdate> },
      { previousData: any }
    >
  }
) {
  const queryClient = useQueryClient()
  const t = useTranslations(options?.translationKey || 'messages')

  return useMutation<
    T,
    ApiClientError,
    { id: string; data: Partial<TUpdate> },
    { previousData: any }
  >({
    mutationFn,
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: invalidateKey })

      const previousData = queryClient.getQueriesData({ queryKey: invalidateKey })

      // Optimistic update if handler provided
      if (options?.onOptimisticUpdate) {
        queryClient.setQueriesData<ListResponse<T>>(
          { queryKey: invalidateKey },
          (old) => {
            if (!old) return old

            return {
              ...old,
              items: old.items.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      ...options.onOptimisticUpdate!(id, data),
                      updatedAt: new Date().toISOString(),
                    }
                  : item
              ),
            }
          }
        )
      }

      return { previousData }
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error(t('updateError'), {
        description: error.message || 'An error occurred',
      })
    },
    onSuccess: (data: any) => {
      toast.success(t('updateSuccess'), {
        description: data?.name ? `${data.name} has been updated` : undefined,
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey })
    },
    ...options?.mutationOptions,
  })
}

/**
 * Generic hook for deleting entities
 * @template T - Entity type
 */
export function useDelete<T = void>(
  invalidateKey: QueryKey,
  mutationFn: (id: string) => Promise<T>,
  options?: {
    translationKey?: string
    mutationOptions?: UseMutationOptions<T, ApiClientError, string>
  }
) {
  const queryClient = useQueryClient()
  const t = useTranslations(options?.translationKey || 'messages')

  return useMutation<T, ApiClientError, string>({
    mutationFn,
    onSuccess: () => {
      toast.success(t('deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: invalidateKey })
    },
    onError: (error) => {
      toast.error(t('deleteError'), {
        description: error.message || 'An error occurred',
      })
    },
    ...options?.mutationOptions,
  })
}
