import { z } from 'zod'
import { Provider } from '@/types/types'

/**
 * Cloud Form Schema
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
 * Cloud Form Steps Configuration
 * Simple array of step definitions
 */
export const cloudFormSteps = [
  {
    title: 'Basic Info',
    description: 'Provider and identity',
  },
  {
    title: 'Credentials',
    description: 'Authentication',
  },
  {
    title: 'Regions',
    description: 'Region selection',
  },
  {
    title: 'Features',
    description: 'Features and schedule',
  },
]

/**
 * Cloud Field Translation Map
 * Maps form field names to translation keys in messages/cloud/*.json
 */
export const cloudFieldTranslationMap: Record<string, string> = {
  name: 'name',
  provider: 'provider',
  credentialType: 'credentialType',
  regionList: 'regions',
  cloudGroupName: 'cloudGroup',
  eventProcessEnabled: 'eventProcessing',
  userActivityEnabled: 'userActivity',
  scheduleScanEnabled: 'scheduleScan',
  accessKeyId: 'accessKeyId',
  secretAccessKey: 'secretAccessKey',
  roleArn: 'roleArn',
  tenantId: 'tenantId',
  subscriptionId: 'subscriptionId',
  applicationId: 'applicationId',
  secretKey: 'secretKey',
  projectId: 'projectId',
  jsonText: 'jsonText',
  cloudTrailName: 'cloudTrailName',
  storageAccountName: 'storageAccountName',
  proxyUrl: 'proxyUrl',
  frequency: 'frequency',
  minute: 'minute',
  hour: 'hour',
  weekday: 'weekday',
  date: 'date',
}
