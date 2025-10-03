'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { Provider } from '@/types/types'
import { createFormValidation } from '@/lib/validation/generic-validation'
import { getStepValidationStatus } from '@/lib/validation/step-validation'
import { GenericFormWizard } from '@/components/forms/generic-form-wizard'
import { FormSkeleton } from '@/components/loading/form-skeleton'
import { cloudFormConfig, cloudFormSchema } from '@/features/clouds/config/cloud-form.config'
import { useCloudFormData } from '@/features/clouds/hooks/use-cloud-form-data'
import { useCreateCloud, useUpdateCloud } from '@/features/clouds/hooks/use-cloud-queries'
import { buildCloudPayload } from '@/features/clouds/utils/cloud-payload'
import { getProviderConfig, getCredentialFields, getEventSourceFields } from './provider-configs'
import { StepContentWrapper } from './step-content-wrapper'

interface CloudFormWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cloudId?: string
  mode: 'create' | 'edit'
}

export function CloudFormWizard({ open, onOpenChange, cloudId, mode }: CloudFormWizardProps) {
  const tCloud = useTranslations('cloud')

  const [currentProvider, setCurrentProvider] = useState<Provider>('AWS')
  const [currentCredentialType, setCurrentCredentialType] = useState<string>('ACCESS_KEY')

  const createMutation = useCreateCloud()
  const updateMutation = useUpdateCloud()

  // Load data for edit mode
  const { formDefaults, initializing } = useCloudFormData({
    open,
    mode,
    cloudId,
    onProviderChange: setCurrentProvider,
    onCredentialTypeChange: setCurrentCredentialType,
  })

  // Validation system
  const validation = createFormValidation(
    {
      0: { requiredFields: ['name', 'provider'] },
      1: { requiredFields: ['credentialType'] },
      2: { requiredFields: ['regionList'] },
      3: { requiredFields: [] },
    },
    cloudFormConfig.fields,
  )

  // Custom validation for step 2 (credentials with dynamic fields)
  const validateStep = (step: number, formData: Record<string, unknown>, errors: unknown) => {
    if (step === 1) {
      return getStepValidationStatus(step, formData, errors as any)
    }
    return validation.validateStep(step, formData, errors as any)
  }

  // Memoize provider-based data at component level
  const providerConfig = useMemo(() => getProviderConfig(currentProvider), [currentProvider])
  const credentialFields = useMemo(
    () => getCredentialFields(currentProvider, currentCredentialType),
    [currentProvider, currentCredentialType],
  )
  const eventSourceFields = useMemo(
    () => getEventSourceFields(currentProvider),
    [currentProvider],
  )

  // Render step content with a wrapper component to handle hooks
  const renderStep = (step: number, form: UseFormReturn<z.infer<typeof cloudFormSchema>>) => {
    return (
      <StepContentWrapper
        step={step}
        form={form}
        currentProvider={currentProvider}
        currentCredentialType={currentCredentialType}
        setCurrentProvider={setCurrentProvider}
        setCurrentCredentialType={setCurrentCredentialType}
        providerConfig={providerConfig}
        credentialFields={credentialFields}
        eventSourceFields={eventSourceFields}
      />
    )
  }

  // Handle form submission
  const handleSubmit = async (data: z.infer<typeof cloudFormSchema>) => {
    const payload = buildCloudPayload(data, currentProvider, currentCredentialType)

    if (mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (cloudId) {
      await updateMutation.mutateAsync({ id: cloudId, data: payload })
    }
  }

  return (
    <GenericFormWizard
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? tCloud('create') : tCloud('edit')}
      description={mode === 'create' ? tCloud('subtitle') : 'Update cloud provider configuration'}
      steps={cloudFormConfig.steps.map(s => ({
        title: s.title,
        description: s.description,
        requiredFields: s.validation.requiredFields,
      }))}
      schema={cloudFormSchema}
      defaultValues={formDefaults as any}
      validateStep={validateStep}
      renderStep={renderStep}
      onSubmit={handleSubmit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      mode={mode}
      isLoading={!!initializing}
      loadingContent={<FormSkeleton />}
    />
  )
}
