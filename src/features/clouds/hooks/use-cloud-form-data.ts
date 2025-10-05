import { useState, useEffect } from 'react'
import { z } from 'zod'
import { cloudService } from '@/lib/api/services'
import { getCredentialFields, getEventSourceFields } from '@/components/cloud-form/provider-configs'
import { cloudFormDefaults, cloudFormSchema } from '@/features/clouds/config/cloud-form.config'

interface UseCloudFormDataOptions {
  open: boolean
  mode: 'create' | 'edit'
  cloudId?: string
}

type CloudFormDefaults = z.infer<typeof cloudFormSchema>

export function useCloudFormData({
  open,
  mode,
  cloudId,
}: UseCloudFormDataOptions) {
  const [loadedData, setLoadedData] = useState<CloudFormDefaults | null>(null)
  const [loadError, setLoadError] = useState<Error | null>(null)

  useEffect(() => {
    // 다이얼로그 닫힐 때 정리 - cleanup logic is intentional
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadedData(null)
      setLoadError(null)
      return
    }

    // create 모드이거나 cloudId 없으면 초기화
    if (mode !== 'edit' || !cloudId) {
      setLoadedData(null)
      return
    }

    // cloudId 변경 시 이전 데이터 초기화 (로딩 표시 트리거)
    setLoadedData(null)
    setLoadError(null)

    let cancelled = false

    cloudService.get(cloudId)
      .then((cloud) => {
        if (cancelled) {return}

        const formData: CloudFormDefaults = {
          ...cloudFormDefaults,
          name: cloud.name,
          provider: cloud.provider,
          cloudGroupName: cloud.cloudGroupName || [],
          eventProcessEnabled: cloud.eventProcessEnabled,
          userActivityEnabled: cloud.userActivityEnabled,
          scheduleScanEnabled: cloud.scheduleScanEnabled,
          scheduleScanSetting: cloud.scheduleScanSetting,
          regionList: cloud.regionList,
          proxyUrl: cloud.proxyUrl || '',
          credentialType: cloud.credentialType,
        } as CloudFormDefaults

        // Add credential fields
        const credFields = getCredentialFields(cloud.provider, cloud.credentialType)
        credFields.forEach(field => {
          if (field.key in cloud.credentials) {
            const credValue = (cloud.credentials as unknown as Record<string, unknown>)[field.key]
            ;(formData as Record<string, unknown>)[field.key] = credValue || ''
          }
        })

        // Add event source fields
        if (cloud.eventSource) {
          const eventFields = getEventSourceFields(cloud.provider)
          eventFields.forEach(field => {
            if (field.key in cloud.eventSource!) {
              const eventValue = (cloud.eventSource as unknown as Record<string, unknown>)[
                field.key
              ]
              ;(formData as Record<string, unknown>)[field.key] = eventValue || ''
            }
          })
        }

        setLoadedData(formData)
      })
      .catch((error) => {
        if (cancelled) {return}
        console.error('Failed to load cloud data:', error)
        setLoadError(error)
      })

    return () => {
      cancelled = true
    }
  }, [open, mode, cloudId])

  const formDefaults = mode === 'create'
    ? cloudFormDefaults
    : (loadedData || cloudFormDefaults)

  const initializing = open && mode === 'edit' && cloudId && !loadedData && !loadError

  return {
    loadedData,
    loadError,
    formDefaults,
    initializing,
  }
}
