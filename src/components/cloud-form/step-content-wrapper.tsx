'use client'

import { useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { Provider } from '@/types/types'
import { cloudFormSchema } from '@/config/forms/cloud-form.config'
import { getProviderConfig } from './provider-configs'
import { BasicInfoStep } from './steps/basic-info-step'
import { CredentialsStep } from './steps/credentials-step'
import { FeaturesStep } from './steps/features-step'
import { RegionsStep } from './steps/regions-step'

interface StepContentWrapperProps {
  step: number
  form: UseFormReturn<z.infer<typeof cloudFormSchema>>
  currentProvider: Provider
  currentCredentialType: string
  setCurrentProvider: (provider: Provider) => void
  setCurrentCredentialType: (type: string) => void
  providerConfig: ReturnType<typeof getProviderConfig>
  credentialFields: ReturnType<typeof import('./provider-configs').getCredentialFields>
  eventSourceFields: ReturnType<typeof import('./provider-configs').getEventSourceFields>
}

export function StepContentWrapper({
  step,
  form,
  currentProvider,
  currentCredentialType,
  setCurrentProvider,
  setCurrentCredentialType,
  providerConfig,
  credentialFields,
  eventSourceFields,
}: StepContentWrapperProps) {
  const { watch, setValue } = form

  // Watch for provider and credential type changes
  const watchProvider = watch('provider') as Provider
  const watchCredentialType = watch('credentialType')

  // Handle provider changes with useEffect
  useEffect(() => {
    if (watchProvider && watchProvider !== currentProvider) {
      setCurrentProvider(watchProvider)
      const config = getProviderConfig(watchProvider)
      const defaultCredType = config.defaultCredentialType
      setValue('credentialType', defaultCredType)
      setCurrentCredentialType(defaultCredType)
    }
  }, [watchProvider, currentProvider, setValue, setCurrentProvider, setCurrentCredentialType])

  // Handle credential type changes with useEffect
  useEffect(() => {
    if (watchCredentialType && watchCredentialType !== currentCredentialType) {
      setCurrentCredentialType(watchCredentialType)
    }
  }, [watchCredentialType, currentCredentialType, setCurrentCredentialType])

  switch (step) {
    case 0:
      return <BasicInfoStep form={form} />

    case 1:
      return (
        <CredentialsStep
          form={form}
          providerConfig={providerConfig}
          credentialFields={credentialFields}
          eventSourceFields={eventSourceFields}
        />
      )

    case 2:
      return <RegionsStep form={form} currentProvider={currentProvider} />

    case 3:
      return <FeaturesStep form={form} />

    default:
      return null
  }
}
