'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'
import { cloudService } from '@/lib/api/services'
import { queryKeys } from '@/lib/query-keys'
import {
  Cloud,
  CloudCreateRequest,
  CloudUpdateRequest,
} from '@/types/types'
import {
  ListResponse,
  PaginationParams,
  FilterParams,
  ApiClientError,
} from '@/lib/api/services'

// Query options type helpers
type CloudListQueryOptions = UseQueryOptions<
  ListResponse<Cloud>,
  ApiClientError,
  ListResponse<Cloud>,
  ReturnType<typeof queryKeys.clouds.list>
>

/**
 * Hook for fetching paginated cloud list
 */
export function useCloudList(
  params?: PaginationParams & FilterParams,
  options?: Omit<CloudListQueryOptions, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.clouds.list(params),
    queryFn: () => cloudService.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

/**
 * Hook for creating cloud with optimistic updates
 */
export function useCreateCloud(
  options?: UseMutationOptions<Cloud, ApiClientError, CloudCreateRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cloudService.create.bind(cloudService),
    onSuccess: () => {
      // Invalidate and refetch cloud list
      queryClient.invalidateQueries({ queryKey: queryKeys.clouds.lists() })
    },
    ...options,
  })
}

/**
 * Hook for updating cloud
 */
export function useUpdateCloud(
  options?: UseMutationOptions<
    Cloud,
    ApiClientError,
    { id: string; data: Partial<CloudUpdateRequest> }
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => cloudService.update(id, data),
    onSuccess: () => {
      // Invalidate cloud list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.clouds.lists() })
    },
    ...options,
  })
}
