'use client'

import {
  Cloud,
  CloudCreateRequest,
  CloudUpdateRequest,
} from '@/types/types'
import { cloudService ,
  PaginationParams,
  FilterParams,
} from '@/lib/api/services'
import { queryKeys } from '@/lib/query-keys'
import { useList, useCreate, useUpdate } from './use-crud-queries'

/**
 * Hook for fetching paginated cloud list
 */
export function useCloudList(
  params?: PaginationParams & FilterParams,
) {
  return useList<Cloud>(
    queryKeys.clouds.list(params),
    () => cloudService.list(params),
  )
}

/**
 * Hook for creating cloud with optimistic updates and toast notifications
 */
export function useCreateCloud() {
  return useCreate<Cloud, CloudCreateRequest>(
    queryKeys.clouds.lists(),
    cloudService.create,
    {
      translationKey: 'cloud.messages',
      onOptimisticUpdate: (newCloud) => ({
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
      }),
    },
  )
}

/**
 * Hook for updating cloud with optimistic updates and toast notifications
 */
export function useUpdateCloud() {
  return useUpdate<Cloud, CloudUpdateRequest>(
    queryKeys.clouds.lists(),
    ({ id, data }) => cloudService.update(id, data),
    {
      translationKey: 'cloud.messages',
      onOptimisticUpdate: (id, data) => data,
    },
  )
}
