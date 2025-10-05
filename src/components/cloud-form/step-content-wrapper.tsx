'use client'

import { useEffect } from 'react'
import { Provider } from '@/types/types'
import { getProviderConfig } from '@/features/clouds/config/provider-configs'
import { useCloudFormContext } from './cloud-form-context'
import { BasicInfoStep } from './steps/basic-info-step'
import { CredentialsStep } from './steps/credentials-step'
import { FeaturesStep } from './steps/features-step'
import { RegionsStep } from './steps/regions-step'

interface StepContentWrapperProps {
  step: number
}

export function StepContentWrapper({ step }: StepContentWrapperProps) {
  const { form, currentProvider } = useCloudFormContext()
  const { watch, setValue } = form

  // Watch for provider changes
  const watchProvider = watch('provider') as Provider

  // Handle provider changes - reset credential type to default
  useEffect(() => {
    if (watchProvider && watchProvider !== currentProvider) {
      const config = getProviderConfig(watchProvider)
      const defaultCredType = config.defaultCredentialType
      setValue('credentialType', defaultCredType)
    }
  }, [watchProvider, currentProvider, setValue])

  switch (step) {
    case 0:
      return <BasicInfoStep />

    case 1:
      return <CredentialsStep />

    case 2:
      return <RegionsStep />

    case 3:
      return <FeaturesStep />

    default:
      return null
  }
}
