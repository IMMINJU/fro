import { useState, useEffect } from 'react'
import { Provider } from '@/types/types'
import { cloudService } from '@/lib/api/services'
import { getCredentialFields, getEventSourceFields } from '@/components/cloud-form/provider-configs'
import { cloudFormConfig } from '@/config/forms/cloud-form.config'

interface UseCloudFormDataOptions {
  open: boolean
  mode: 'create' | 'edit'
  cloudId?: string
  onProviderChange?: (provider: Provider) => void
  onCredentialTypeChange?: (credentialType: string) => void
}

export function useCloudFormData({
  open,
  mode,
  cloudId,
  onProviderChange,
  onCredentialTypeChange,
}: UseCloudFormDataOptions) {
  const [loadedData, setLoadedData] = useState<Record<string, unknown> | null>(null)
  const [loadError, setLoadError] = useState<Error | null>(null)

  useEffect(() => {
    if (!open || mode !== 'edit' || !cloudId) {
      return
    }

    let cancelled = false

    cloudService.get(cloudId)
      .then((cloud) => {
        if (cancelled) {return}

        onProviderChange?.(cloud.provider)
        onCredentialTypeChange?.(cloud.credentialType)

        const formData: Record<string, unknown> = {
          ...cloudFormConfig.defaultValues,
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
        }

        // Add credential fields
        const credFields = getCredentialFields(cloud.provider, cloud.credentialType)
        credFields.forEach(field => {
          if (field.key in cloud.credentials) {
            formData[field.key] = (cloud.credentials as unknown as Record<string, unknown>)[field.key] || ''
          }
        })

        // Add event source fields
        if (cloud.eventSource) {
          const eventFields = getEventSourceFields(cloud.provider)
          eventFields.forEach(field => {
            if (field.key in cloud.eventSource!) {
              formData[field.key] = (cloud.eventSource as unknown as Record<string, unknown>)[field.key] || ''
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
  }, [open, mode, cloudId, onProviderChange, onCredentialTypeChange])

  const formDefaults = mode === 'create'
    ? cloudFormConfig.defaultValues
    : (loadedData || cloudFormConfig.defaultValues)

  const initializing = open && mode === 'edit' && cloudId && !loadedData && !loadError

  return {
    loadedData,
    loadError,
    formDefaults,
    initializing,
  }
}
