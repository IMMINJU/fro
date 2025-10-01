import { Provider } from '@/types/types'
import * as z from 'zod'

// Provider-specific field configurations
export interface FieldConfig {
  key: string
  label: string
  type: 'text' | 'password' | 'textarea'
  placeholder?: string
  required: boolean
  description?: string
}

export interface ProviderConfig {
  credentialTypes: Array<{
    value: string
    label: string
  }>
  credentialFields: Record<string, FieldConfig[]>
  eventSourceFields: FieldConfig[]
  defaultCredentialType: string
}

// AWS Configuration
const awsConfig: ProviderConfig = {
  credentialTypes: [
    { value: 'ACCESS_KEY', label: 'Access Key' },
    { value: 'ASSUME_ROLE', label: 'Assume Role' },
    { value: 'ROLES_ANYWHERE', label: 'Roles Anywhere' },
  ],
  credentialFields: {
    ACCESS_KEY: [
      {
        key: 'accessKeyId',
        label: 'Access Key ID',
        type: 'text',
        placeholder: 'AKIAIOSFODNN7EXAMPLE',
        required: true,
      },
      {
        key: 'secretAccessKey',
        label: 'Secret Access Key',
        type: 'password',
        placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        required: true,
      },
    ],
    ASSUME_ROLE: [
      {
        key: 'accessKeyId',
        label: 'Access Key ID',
        type: 'text',
        placeholder: 'AKIAIOSFODNN7EXAMPLE',
        required: true,
      },
      {
        key: 'secretAccessKey',
        label: 'Secret Access Key',
        type: 'password',
        placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        required: true,
      },
      {
        key: 'roleArn',
        label: 'Role ARN',
        type: 'text',
        placeholder: 'arn:aws:iam::123456789012:role/RoleName',
        required: true,
      },
    ],
    ROLES_ANYWHERE: [
      {
        key: 'accessKeyId',
        label: 'Access Key ID',
        type: 'text',
        placeholder: 'AKIAIOSFODNN7EXAMPLE',
        required: true,
      },
      {
        key: 'secretAccessKey',
        label: 'Secret Access Key',
        type: 'password',
        placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        required: true,
      },
      {
        key: 'trustAnchorArn',
        label: 'Trust Anchor ARN',
        type: 'text',
        placeholder: 'arn:aws:rolesanywhere::123456789012:trust-anchor/...',
        required: false,
      },
    ],
  },
  eventSourceFields: [
    {
      key: 'cloudTrailName',
      label: 'CloudTrail Name',
      type: 'text',
      placeholder: 'my-cloudtrail',
      required: false,
    },
  ],
  defaultCredentialType: 'ACCESS_KEY',
}

// Azure Configuration
const azureConfig: ProviderConfig = {
  credentialTypes: [
    { value: 'APPLICATION', label: 'Service Principal' },
    { value: 'MANAGED_IDENTITY', label: 'Managed Identity' },
  ],
  credentialFields: {
    APPLICATION: [
      {
        key: 'tenantId',
        label: 'Tenant ID',
        type: 'text',
        placeholder: '12345678-1234-1234-1234-123456789012',
        required: true,
      },
      {
        key: 'subscriptionId',
        label: 'Subscription ID',
        type: 'text',
        placeholder: '87654321-4321-4321-4321-210987654321',
        required: true,
      },
      {
        key: 'applicationId',
        label: 'Application (Client) ID',
        type: 'text',
        placeholder: 'abcdef12-3456-7890-abcd-ef1234567890',
        required: true,
      },
      {
        key: 'secretKey',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Your client secret',
        required: true,
      },
    ],
    MANAGED_IDENTITY: [
      {
        key: 'subscriptionId',
        label: 'Subscription ID',
        type: 'text',
        placeholder: '87654321-4321-4321-4321-210987654321',
        required: true,
      },
      {
        key: 'resourceId',
        label: 'Resource ID',
        type: 'text',
        placeholder: '/subscriptions/.../resourceGroups/.../providers/...',
        required: false,
      },
    ],
  },
  eventSourceFields: [
    {
      key: 'storageAccountName',
      label: 'Storage Account Name',
      type: 'text',
      placeholder: 'mystorageaccount',
      required: false,
    },
    {
      key: 'containerName',
      label: 'Container Name',
      type: 'text',
      placeholder: 'insights-logs',
      required: false,
    },
  ],
  defaultCredentialType: 'APPLICATION',
}

// GCP Configuration
const gcpConfig: ProviderConfig = {
  credentialTypes: [
    { value: 'SERVICE_ACCOUNT', label: 'Service Account Key' },
    { value: 'WORKLOAD_IDENTITY', label: 'Workload Identity' },
  ],
  credentialFields: {
    SERVICE_ACCOUNT: [
      {
        key: 'projectId',
        label: 'Project ID',
        type: 'text',
        placeholder: 'my-gcp-project-12345',
        required: true,
      },
      {
        key: 'serviceAccountKey',
        label: 'Service Account Key (JSON)',
        type: 'textarea',
        placeholder: '{"type": "service_account", "project_id": "..."}',
        required: true,
        description: 'Paste your service account JSON key here',
      },
    ],
    WORKLOAD_IDENTITY: [
      {
        key: 'projectId',
        label: 'Project ID',
        type: 'text',
        placeholder: 'my-gcp-project-12345',
        required: true,
      },
      {
        key: 'workloadIdentityProvider',
        label: 'Workload Identity Provider',
        type: 'text',
        placeholder: 'projects/123456789/locations/global/workloadIdentityPools/...',
        required: true,
      },
      {
        key: 'serviceAccount',
        label: 'Service Account Email',
        type: 'text',
        placeholder: 'my-service-account@project.iam.gserviceaccount.com',
        required: true,
      },
    ],
  },
  eventSourceFields: [
    {
      key: 'bucketName',
      label: 'Cloud Storage Bucket',
      type: 'text',
      placeholder: 'my-audit-logs-bucket',
      required: false,
    },
    {
      key: 'logSinkName',
      label: 'Cloud Logging Sink Name',
      type: 'text',
      placeholder: 'my-audit-sink',
      required: false,
    },
  ],
  defaultCredentialType: 'SERVICE_ACCOUNT',
}

// Provider configurations mapping
export const PROVIDER_CONFIGS: Record<Provider, ProviderConfig> = {
  AWS: awsConfig,
  AZURE: azureConfig,
  GCP: gcpConfig,
}

// Helper function to get provider config
export const getProviderConfig = (provider: Provider): ProviderConfig => {
  return PROVIDER_CONFIGS[provider]
}

// Helper function to get credential fields for a specific provider and type
export const getCredentialFields = (
  provider: Provider,
  credentialType: string
): FieldConfig[] => {
  const config = getProviderConfig(provider)
  return config.credentialFields[credentialType] || []
}

// Helper function to get event source fields for a provider
export const getEventSourceFields = (provider: Provider): FieldConfig[] => {
  const config = getProviderConfig(provider)
  return config.eventSourceFields
}

// Dynamic schema generation based on provider and credential type
export const createProviderSchema = (
  provider: Provider,
  credentialType: string
) => {
  const credentialFields = getCredentialFields(provider, credentialType)
  const eventSourceFields = getEventSourceFields(provider)

  // Build credential schema dynamically
  const credentialSchema: Record<string, z.ZodTypeAny> = {}
  credentialFields.forEach(field => {
    if (field.required) {
      credentialSchema[field.key] = z.string().min(1, `${field.label} is required`)
    } else {
      credentialSchema[field.key] = z.string().optional()
    }
  })

  // Build event source schema dynamically
  const eventSourceSchema: Record<string, z.ZodTypeAny> = {}
  eventSourceFields.forEach(field => {
    if (field.required) {
      eventSourceSchema[field.key] = z.string().min(1, `${field.label} is required`)
    } else {
      eventSourceSchema[field.key] = z.string().optional()
    }
  })

  return {
    credentialSchema: z.object(credentialSchema),
    eventSourceSchema: z.object(eventSourceSchema),
  }
}