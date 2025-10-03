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
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

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
 * Hook for creating cloud with optimistic updates and toast notifications
 */
export function useCreateCloud(
  options?: UseMutationOptions<Cloud, ApiClientError, CloudCreateRequest, { previousClouds: any }>
) {
  const queryClient = useQueryClient()
  const t = useTranslations('cloud.messages')

  return useMutation<Cloud, ApiClientError, CloudCreateRequest, { previousClouds: any }>({
    mutationFn: cloudService.create.bind(cloudService),
    onMutate: async (newCloud) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.clouds.lists() })

      // Snapshot previous value
      const previousClouds = queryClient.getQueriesData({
        queryKey: queryKeys.clouds.lists(),
      })

      // Optimistically update to new value
      queryClient.setQueriesData<ListResponse<Cloud>>(
        { queryKey: queryKeys.clouds.lists() },
        (old) => {
          if (!old) return old

          const optimisticCloud: Cloud = {
            id: `temp-${Date.now()}`,
            name: newCloud.name,
            provider: newCloud.provider,
            cloudGroupName: newCloud.cloudGroupName || [],
            eventProcessEnabled: newCloud.eventProcessEnabled,
            userActivityEnabled: newCloud.userActivityEnabled,
            scheduleScanEnabled: newCloud.scheduleScanEnabled,
            scheduleScanSetting: newCloud.scheduleScanSetting,
            regionList: newCloud.regionList,
            proxyUrl: newCloud.proxyUrl,
            credentialType: newCloud.credentialType,
            credentials: newCloud.credentials,
            eventSource: newCloud.eventSource,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          return {
            ...old,
            items: [optimisticCloud, ...old.items],
            total: old.total + 1,
          }
        }
      )

      return { previousClouds }
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousClouds) {
        context.previousClouds.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error(t('createError'), {
        description: error.message || 'An error occurred',
      })
    },
    onSuccess: (data) => {
      toast.success(t('createSuccess'), {
        description: `${data.name} has been created`,
      })
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.clouds.lists() })
    },
    ...options,
  })
}

/**
 * Hook for updating cloud with optimistic updates and toast notifications
 */
export function useUpdateCloud(
  options?: UseMutationOptions<
    Cloud,
    ApiClientError,
    { id: string; data: Partial<CloudUpdateRequest> },
    { previousClouds: any }
  >
) {
  const queryClient = useQueryClient()
  const t = useTranslations('cloud.messages')

  return useMutation<
    Cloud,
    ApiClientError,
    { id: string; data: Partial<CloudUpdateRequest> },
    { previousClouds: any }
  >({
    mutationFn: ({ id, data }) => cloudService.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.clouds.lists() })

      // Snapshot previous value
      const previousClouds = queryClient.getQueriesData({
        queryKey: queryKeys.clouds.lists(),
      })

      // Optimistically update
      queryClient.setQueriesData<ListResponse<Cloud>>(
        { queryKey: queryKeys.clouds.lists() },
        (old) => {
          if (!old) return old

          return {
            ...old,
            items: old.items.map((cloud) =>
              cloud.id === id
                ? {
                    ...cloud,
                    ...data,
                    updatedAt: new Date().toISOString(),
                  }
                : cloud
            ),
          }
        }
      )

      return { previousClouds }
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousClouds) {
        context.previousClouds.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error(t('updateError'), {
        description: error.message || 'An error occurred',
      })
    },
    onSuccess: (data) => {
      toast.success(t('updateSuccess'), {
        description: `${data.name} has been updated`,
      })
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.clouds.lists() })
    },
    ...options,
  })
}
