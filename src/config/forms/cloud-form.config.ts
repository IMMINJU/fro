import { z } from 'zod'
import { createFormConfig, createStep, createDynamicField } from '@/lib/forms/form-config'
import { Provider } from '@/types/types'

/**
 * Cloud Form Schema
 * Zod schema for cloud form validation
 */
export const cloudFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider: z.enum(['AWS', 'AZURE', 'GCP']),
  cloudGroupName: z.array(z.string()).optional(),
  eventProcessEnabled: z.boolean(),
  userActivityEnabled: z.boolean(),
  scheduleScanEnabled: z.boolean(),
  scheduleScanSetting: z.object({
    frequency: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH']),
    date: z.string().optional(),
    weekday: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).optional(),
    hour: z.string().optional(),
    minute: z.string().optional(),
  }).optional(),
  regionList: z.array(z.string()).min(1, 'At least one region is required'),
  proxyUrl: z.string().optional(),
  credentialType: z.string(),
  // Dynamic credential fields will be validated separately
}).passthrough() // Allow additional fields for credentials

/**
 * Cloud Form Default Values
 */
export const cloudFormDefaults = {
  name: '',
  provider: 'AWS' as Provider,
  cloudGroupName: [],
  eventProcessEnabled: false,
  userActivityEnabled: false,
  scheduleScanEnabled: false,
  regionList: [],
  credentialType: 'ACCESS_KEY',
}

/**
 * Cloud Form Configuration
 * Complete form configuration for Cloud Wizard
 */
export const cloudFormConfig = createFormConfig<typeof cloudFormSchema>()
  .name('cloud')
  .title('Cloud Account')
  .description('Configure cloud provider account')
  .schema(cloudFormSchema)
  .defaults(cloudFormDefaults)
  .addStep(
    createStep(
      'Basic Info',
      [
        createDynamicField('name', 'Name', {
          type: 'text',
          required: true,
          placeholder: 'Enter cloud account name',
        }),
        createDynamicField('provider', 'Provider', {
          type: 'select',
          required: true,
          options: [
            { value: 'AWS', label: 'AWS' },
            { value: 'AZURE', label: 'Azure (Coming Soon)' },
            { value: 'GCP', label: 'GCP (Coming Soon)' },
          ],
        }),
        createDynamicField('cloudGroupName', 'Cloud Groups', {
          type: 'array',
          required: false,
        }),
      ],
      {
        description: 'Provider and identity',
        requiredFields: ['name', 'provider'],
      }
    )
  )
  .addStep(
    createStep(
      'Credentials',
      [
        createDynamicField('credentialType', 'Credential Type', {
          type: 'select',
          required: true,
        }),
        // Dynamic credential fields rendered in custom render function
      ],
      {
        description: 'Authentication',
        requiredFields: ['credentialType'],
      }
    )
  )
  .addStep(
    createStep(
      'Regions',
      [
        createDynamicField('regionList', 'Regions', {
          type: 'array',
          required: true,
        }),
        createDynamicField('proxyUrl', 'Proxy URL', {
          type: 'text',
          required: false,
          placeholder: 'https://proxy.company.com:8080',
        }),
      ],
      {
        description: 'Region selection',
        requiredFields: ['regionList'],
      }
    )
  )
  .addStep(
    createStep(
      'Features',
      [
        createDynamicField('eventProcessEnabled', 'Event Processing', {
          type: 'checkbox',
          required: false,
        }),
        createDynamicField('userActivityEnabled', 'User Activity', {
          type: 'checkbox',
          required: false,
        }),
        createDynamicField('scheduleScanEnabled', 'Schedule Scan', {
          type: 'checkbox',
          required: false,
        }),
      ],
      {
        description: 'Features and schedule',
        requiredFields: [],
      }
    )
  )
  .build()
