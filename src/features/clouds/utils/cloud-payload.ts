import { z } from 'zod'
import {
  Provider,
  AWSCredential,
  AzureCredential,
  GCPCredential,
  AWSEventSource,
  AzureEventSource,
  GCPEventSource,
  CloudCreateRequest,
} from '@/types/types'
import { cloudFormSchema } from '@/features/clouds/config/cloud-form.config'
import { getCredentialFields, getEventSourceFields } from '@/features/clouds/config/provider-configs'

type CloudFormData = z.infer<typeof cloudFormSchema> & Record<string, unknown>

export function buildCloudPayload(
  data: z.infer<typeof cloudFormSchema>,
  currentProvider: Provider,
  currentCredentialType: string,
): CloudCreateRequest {
  const credFields = getCredentialFields(currentProvider, currentCredentialType)
  const eventFields = getEventSourceFields(currentProvider)

  // Build credentials object with proper typing
  const credentials: Record<string, string> = {}
  const formData = data as CloudFormData

  credFields.forEach(field => {
    const value = formData[field.key]
    if (value !== undefined && value !== '') {
      credentials[field.key] = String(value)
    }
  })

  // Build event source object with proper typing
  const eventSource: Record<string, string> = {}
  let hasEventSource = false

  eventFields.forEach(field => {
    const value = formData[field.key]
    if (value !== undefined && value !== '') {
      eventSource[field.key] = String(value)
      hasEventSource = true
    }
  })

  // Type assertion based on provider
  let typedCredentials: AWSCredential | AzureCredential | GCPCredential
  let typedEventSource: AWSEventSource | AzureEventSource | GCPEventSource | undefined

  if (currentProvider === 'AWS') {
    typedCredentials = credentials as unknown as AWSCredential
    typedEventSource = hasEventSource ? (eventSource as unknown as AWSEventSource) : undefined
  } else if (currentProvider === 'AZURE') {
    typedCredentials = credentials as unknown as AzureCredential
    typedEventSource = hasEventSource ? (eventSource as unknown as AzureEventSource) : undefined
  } else {
    typedCredentials = credentials as unknown as GCPCredential
    typedEventSource = hasEventSource ? (eventSource as unknown as GCPEventSource) : undefined
  }

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
    credentialType: data.credentialType as CloudCreateRequest['credentialType'],
    credentials: typedCredentials,
    eventSource: typedEventSource,
  }
}
