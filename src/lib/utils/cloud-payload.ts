import { z } from 'zod'
import { Provider } from '@/types/types'
import { getCredentialFields, getEventSourceFields } from '@/components/cloud-form/provider-configs'
import { cloudFormSchema } from '@/config/forms/cloud-form.config'

export function buildCloudPayload(
  data: z.infer<typeof cloudFormSchema>,
  currentProvider: Provider,
  currentCredentialType: string,
) {
  const credFields = getCredentialFields(currentProvider, currentCredentialType)
  const eventFields = getEventSourceFields(currentProvider)

  const credentials: Record<string, string> = {}
  credFields.forEach(field => {
    const value = (data as Record<string, unknown>)[field.key]
    if (value !== undefined && value !== '') {
      credentials[field.key] = value as string
    }
  })

  const eventSource: Record<string, string> = {}
  let hasEventSource = false
  eventFields.forEach(field => {
    const value = (data as Record<string, unknown>)[field.key]
    if (value !== undefined && value !== '') {
      eventSource[field.key] = value as string
      hasEventSource = true
    }
  })

  return {
    name: data.name,
    provider: data.provider,
    cloudGroupName: data.cloudGroupName,
    eventProcessEnabled: data.eventProcessEnabled,
    userActivityEnabled: data.userActivityEnabled,
    scheduleScanEnabled: data.scheduleScanEnabled,
    scheduleScanSetting: data.scheduleScanEnabled ? data.scheduleScanSetting : undefined,
    regionList: data.regionList,
    proxyUrl: data.proxyUrl || undefined,
    credentialType: data.credentialType as any,
    credentials: credentials as any,
    eventSource: hasEventSource ? (eventSource as any) : undefined,
  }
}
