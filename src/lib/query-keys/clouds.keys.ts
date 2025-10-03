/**
 * Cloud Query Keys
 * Centralized query key factory for cloud-related queries
 */

import { createQueryKeys } from './factory'

export const cloudKeys = createQueryKeys('clouds')

export type CloudQueryKey = typeof cloudKeys
