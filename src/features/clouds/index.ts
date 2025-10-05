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

// Hooks
export {
  useCloudList,
  useCreateCloud,
  useUpdateCloud,
} from './hooks/use-cloud-queries'
export { useCloudFormData } from './hooks/use-cloud-form-data'

// Types
export type { Cloud, CloudCreateRequest, CloudUpdateRequest, Provider } from '@/types/types'
