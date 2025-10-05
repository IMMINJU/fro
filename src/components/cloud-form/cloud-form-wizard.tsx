'use client'

import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { Provider } from '@/types/types'
import { createFormValidation } from '@/lib/validation/generic-validation'
import { getStepValidationStatus } from '@/lib/validation/step-validation'
import { GenericFormWizard } from '@/components/forms/generic-form-wizard'
import { FormSkeleton } from '@/components/loading/form-skeleton'
import { cloudFormSchema, cloudFormSteps, cloudFieldTranslationMap } from '@/features/clouds/config/cloud-form.config'
import { useCloudFormData } from '@/features/clouds/hooks/use-cloud-form-data'
import { useCreateCloud, useUpdateCloud } from '@/features/clouds/hooks/use-cloud-queries'
import { buildCloudPayload } from '@/features/clouds/utils/cloud-payload'
import { CloudFormProvider } from './cloud-form-context'
import { getProviderConfig, getCredentialFields, getEventSourceFields } from './provider-configs'
import { StepContentWrapper } from './step-content-wrapper'

// Extract CloudKeys from IntlMessages (next-intl official type)
type CloudKeys = keyof IntlMessages['cloud']

interface CloudFormWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cloudId?: string
  mode: 'create' | 'edit'
}

export function CloudFormWizard({ open, onOpenChange, cloudId, mode }: CloudFormWizardProps) {
  const tCloud = useTranslations('cloud')

  const createMutation = useCreateCloud()
  const updateMutation = useUpdateCloud()

  // Load data for edit mode
  const { formDefaults, initializing } = useCloudFormData({
    open,
    mode,
    cloudId,
  })

  // Validation system (simplified - no cloudFormConfig.fields needed)
  const validateStepFields = (step: number, formData: Record<string, unknown>, errors: unknown) => {
    if (step === 1) {
      return getStepValidationStatus(step, formData, errors as any)
    }

    const stepValidation = {
      0: { requiredFields: ['name', 'provider'] },
      1: { requiredFields: ['credentialType'] },
      2: { requiredFields: ['regionList'] },
      3: { requiredFields: [] },
    }

    const validation = createFormValidation(stepValidation, [])
    return validation.validateStep(step, formData, errors as any)
  }


  // Render step content with a wrapper component to handle hooks
  const renderStep = (step: number, form: UseFormReturn<z.infer<typeof cloudFormSchema>>) => {
    // Get current provider and credentialType from form
    const currentProvider = form.watch('provider') as Provider || 'AWS'
    const currentCredentialType = form.watch('credentialType') || 'ACCESS_KEY'

    // Calculate provider-based data (no useMemo in render function)
    const providerConfig = getProviderConfig(currentProvider)
    const credentialFields = getCredentialFields(currentProvider, currentCredentialType)
    const eventSourceFields = getEventSourceFields(currentProvider)

    return (
      <CloudFormProvider
        value={{
          form,
          currentProvider,
          currentCredentialType,
          providerConfig,
          credentialFields,
          eventSourceFields,
        }}
      >
        <StepContentWrapper step={step} />
      </CloudFormProvider>
    )
  }

  // Handle form submission
  const handleSubmit = async (data: z.infer<typeof cloudFormSchema>) => {
    const currentProvider = data.provider as Provider
    const currentCredentialType = data.credentialType
    const payload = buildCloudPayload(data, currentProvider, currentCredentialType)

    if (mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (cloudId) {
      await updateMutation.mutateAsync({ id: cloudId, data: payload })
    }
  }

  return (
    <GenericFormWizard<typeof cloudFormSchema, CloudKeys>
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? tCloud('create') : tCloud('edit')}
      description={mode === 'create' ? tCloud('subtitle') : tCloud('updateSubtitle')}
      steps={cloudFormSteps}
      schema={cloudFormSchema}
      defaultValues={formDefaults}
      validateStep={validateStepFields}
      renderStep={renderStep}
      onSubmit={handleSubmit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      mode={mode}
      isLoading={!!initializing}
      loadingContent={<FormSkeleton />}
      fieldTranslationMap={cloudFieldTranslationMap}
      translationNamespace="cloud"
    />
  )
}
