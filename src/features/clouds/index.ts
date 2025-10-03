/**
 * Clouds Feature Module
 *
 * This module exports all cloud-related functionality in one place.
 * Follows feature-based architecture for better scalability.
 *
 * Usage:
 * ```typescript
 * import { CloudFormWizard, CloudTable, useCloudList } from '@/features/clouds'
 * ```
 */

// Components
export { CloudFormWizard } from '@/components/cloud-form/cloud-form-wizard'
export { CloudTable } from './components/cloud-table/cloud-table'
export { createColumns as cloudColumns } from './components/cloud-table/columns'
export { RegionSelector } from '@/components/cloud-form/region-selector'
export { DynamicField } from '@/components/cloud-form/dynamic-field'
export { BasicInfoStep } from '@/components/cloud-form/steps/basic-info-step'
export { CredentialsStep } from '@/components/cloud-form/steps/credentials-step'
export { RegionsStep } from '@/components/cloud-form/steps/regions-step'
export { FeaturesStep } from '@/components/cloud-form/steps/features-step'

// Hooks
export {
  useCloudList,
  useCreateCloud,
  useUpdateCloud,
} from './hooks/use-cloud-queries'
export { useCloudFormData } from './hooks/use-cloud-form-data'

// Config
export { cloudFormConfig, cloudFormSchema } from './config/cloud-form.config'

// Utils
export { buildCloudPayload } from './utils/cloud-payload'

// Services
export { cloudService } from '@/lib/api/services'

// Query Keys
export { cloudKeys } from '@/lib/query-keys/clouds.keys'

// Types
export type { Cloud, CloudCreateRequest, CloudUpdateRequest, Provider } from '@/types/types'
