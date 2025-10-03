'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { Provider, CLOUD_GROUP_NAMES, AWSRegionList, AzureRegionList, GCPRegionList } from '@/types/types'
import { cloudService } from '@/lib/api/services'
import { createFormValidation } from '@/lib/validation/generic-validation'
import { getStepValidationStatus } from '@/lib/validation/step-validation'
import { useCreateCloud, useUpdateCloud } from '@/hooks/queries/use-cloud-queries'
import { GenericFormWizard } from '@/components/forms/generic-form-wizard'
import { FormSkeleton } from '@/components/loading/form-skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cloudFormConfig, cloudFormSchema } from '@/config/forms/cloud-form.config'
import { DynamicField } from './dynamic-field'
import {
  getProviderConfig,
  getCredentialFields,
  getEventSourceFields,
} from './provider-configs'
import { RegionSelector } from './region-selector'

interface CloudFormWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cloudId?: string
  mode: 'create' | 'edit'
}

export function CloudFormWizard({ open, onOpenChange, cloudId, mode }: CloudFormWizardProps) {
  const t = useTranslations('common')
  const tCloud = useTranslations('cloud')

  const [loadedData, setLoadedData] = useState<any>(null)
  const [loadError, setLoadError] = useState<Error | null>(null)
  const [currentProvider, setCurrentProvider] = useState<Provider>('AWS')
  const [currentCredentialType, setCurrentCredentialType] = useState<string>('ACCESS_KEY')

  const createMutation = useCreateCloud()
  const updateMutation = useUpdateCloud()

  // Load data for edit mode
  useEffect(() => {
    if (!open || mode !== 'edit' || !cloudId) {
      return
    }

    let cancelled = false

    cloudService.get(cloudId)
      .then((cloud) => {
        if (cancelled) {return}

        setCurrentProvider(cloud.provider)
        setCurrentCredentialType(cloud.credentialType)

        const formData: Record<string, unknown> = {
          ...cloudFormConfig.defaultValues,
          name: cloud.name,
          provider: cloud.provider,
          cloudGroupName: cloud.cloudGroupName || [],
          eventProcessEnabled: cloud.eventProcessEnabled,
          userActivityEnabled: cloud.userActivityEnabled,
          scheduleScanEnabled: cloud.scheduleScanEnabled,
          scheduleScanSetting: cloud.scheduleScanSetting,
          regionList: cloud.regionList,
          proxyUrl: cloud.proxyUrl || '',
          credentialType: cloud.credentialType,
        }

        // Add credential fields
        const credFields = getCredentialFields(cloud.provider, cloud.credentialType)
        credFields.forEach(field => {
          if (field.key in cloud.credentials) {
            formData[field.key] = (cloud.credentials as unknown as Record<string, unknown>)[field.key] || ''
          }
        })

        // Add event source fields
        if (cloud.eventSource) {
          const eventFields = getEventSourceFields(cloud.provider)
          eventFields.forEach(field => {
            if (field.key in cloud.eventSource!) {
              formData[field.key] = (cloud.eventSource as unknown as Record<string, unknown>)[field.key] || ''
            }
          })
        }

        setLoadedData(formData)
      })
      .catch((error) => {
        if (cancelled) {return}
        console.error('Failed to load cloud data:', error)
        setLoadError(error)
      })

    return () => {
      cancelled = true
    }
  }, [open, mode, cloudId])

  // Compute form defaults and loading state
  const formDefaults = mode === 'create'
    ? cloudFormConfig.defaultValues
    : (loadedData || cloudFormConfig.defaultValues)
  const initializing = open && mode === 'edit' && cloudId && !loadedData && !loadError

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
  const eventSourceFields = useMemo(() =>
    getEventSourceFields(currentProvider), [currentProvider])

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
        t={t}
        tCloud={tCloud}
      />
    )
  }

  // Handle form submission
  const handleSubmit = async (data: z.infer<typeof cloudFormSchema>) => {
    const credFields = getCredentialFields(currentProvider, currentCredentialType)
    const eventFields = getEventSourceFields(currentProvider)

    const credentials: Record<string, string> = {}
    credFields.forEach(field => {
      const value = (data as Record<string, unknown>)[field.key]
      if (value !== undefined && value !== '') {
        credentials[field.key] = value as string
      }
    })

    const eventSource: Record<string, string> = {}
    let hasEventSource = false
    eventFields.forEach(field => {
      const value = (data as Record<string, unknown>)[field.key]
      if (value !== undefined && value !== '') {
        eventSource[field.key] = value as string
        hasEventSource = true
      }
    })

    const payload = {
      name: data.name,
      provider: data.provider,
      cloudGroupName: data.cloudGroupName,
      eventProcessEnabled: data.eventProcessEnabled,
      userActivityEnabled: data.userActivityEnabled,
      scheduleScanEnabled: data.scheduleScanEnabled,
      scheduleScanSetting: data.scheduleScanEnabled ? data.scheduleScanSetting : undefined,
      regionList: data.regionList,
      proxyUrl: data.proxyUrl || undefined,
      credentialType: data.credentialType as any,
      credentials: credentials as any,
      eventSource: hasEventSource ? (eventSource as any) : undefined,
    }

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
      defaultValues={formDefaults}
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

// Separate component to handle hooks properly
function StepContentWrapper({
  step,
  form,
  currentProvider,
  currentCredentialType,
  setCurrentProvider,
  setCurrentCredentialType,
  providerConfig,
  credentialFields,
  eventSourceFields,
  t,
  tCloud,
}: {
  step: number
  form: UseFormReturn<z.infer<typeof cloudFormSchema>>
  currentProvider: Provider
  currentCredentialType: string
  setCurrentProvider: (provider: Provider) => void
  setCurrentCredentialType: (type: string) => void
  providerConfig: ReturnType<typeof getProviderConfig>
  credentialFields: ReturnType<typeof getCredentialFields>
  eventSourceFields: ReturnType<typeof getEventSourceFields>
  t: ReturnType<typeof useTranslations>
  tCloud: ReturnType<typeof useTranslations>
}) {
  const { watch, setValue, register, formState: { errors } } = form

  // Watch for provider and credential type changes
  const watchProvider = watch('provider') as Provider
  const watchCredentialType = watch('credentialType')
  const watchScheduleScanEnabled = watch('scheduleScanEnabled')

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

  const getRegionList = (provider: Provider) => {
    switch (provider) {
      case 'AWS': return AWSRegionList
      case 'AZURE': return AzureRegionList
      case 'GCP': return GCPRegionList
      default: return AWSRegionList
    }
  }

  switch (step) {
    case 0: // Basic Info
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{tCloud('name')} *</Label>
            <Input
              id="name"
              {...register('name', { onBlur: () => form.trigger('name') })}
              placeholder={`${t('enter')} ${tCloud('name').toLowerCase()}`}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message as string}</p>
            )}
          </div>

          <div>
            <Label htmlFor="provider">{tCloud('provider')} *</Label>
            <Select
              value={watchProvider}
              onValueChange={(value) => setValue('provider', value as Provider)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`${t('select')} ${tCloud('provider').toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AWS">AWS</SelectItem>
                <SelectItem value="AZURE" disabled>Azure (Coming Soon)</SelectItem>
                <SelectItem value="GCP" disabled>GCP (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cloudGroupName">{tCloud('cloudGroup')}</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {CLOUD_GROUP_NAMES.map((group) => (
                <div key={group} className="flex items-center space-x-2">
                  <Checkbox
                    id={`group-${group}`}
                    checked={watch('cloudGroupName')?.includes(group) || false}
                    onCheckedChange={(checked) => {
                      const current = watch('cloudGroupName') || []
                      if (checked) {
                        setValue('cloudGroupName', [...current, group])
                      } else {
                        setValue('cloudGroupName', current.filter(g => g !== group))
                      }
                    }}
                  />
                  <Label htmlFor={`group-${group}`}>{group}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 1: // Credentials
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="credentialType">{tCloud('credentialType')} *</Label>
            <Select
              value={watchCredentialType}
              onValueChange={(value) => setValue('credentialType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`${t('select')} ${tCloud('credentialType').toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {providerConfig.credentialTypes.map((credType) => (
                  <SelectItem key={credType.value} value={credType.value}>
                    {credType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {credentialFields.map((field) => (
              <DynamicField
                key={field.key}
                field={field}
                register={register}
                errors={errors}
              />
            ))}
          </div>

          {eventSourceFields.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <Label>{tCloud('eventSource')}</Label>
              {eventSourceFields.map((field) => (
                <DynamicField
                  key={field.key}
                  field={field}
                  register={register}
                  errors={errors}
                />
              ))}
            </div>
          )}
        </div>
      )

    case 2: // Regions
      return (
        <div className="space-y-4">
          <RegionSelector
            regions={[...getRegionList(currentProvider)]}
            selectedRegions={watch('regionList') || []}
            onSelectionChange={(regions) => setValue('regionList', regions)}
            error={errors.regionList?.message as string}
          />

          <div>
            <Label htmlFor="proxyUrl">{tCloud('proxyUrl')}</Label>
            <Input
              id="proxyUrl"
              {...register('proxyUrl')}
              placeholder="https://proxy.company.com:8080"
            />
          </div>
        </div>
      )

    case 3: // Features
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{tCloud('features')}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="eventProcessEnabled"
                  {...register('eventProcessEnabled')}
                />
                <Label htmlFor="eventProcessEnabled">{tCloud('eventProcessing')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="userActivityEnabled"
                  {...register('userActivityEnabled')}
                />
                <Label htmlFor="userActivityEnabled">{tCloud('userActivity')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scheduleScanEnabled"
                  {...register('scheduleScanEnabled')}
                />
                <Label htmlFor="scheduleScanEnabled">{tCloud('scheduleScan')}</Label>
              </div>
            </div>
          </div>

          {watchScheduleScanEnabled && (
            <div className="space-y-2 p-3 border rounded">
              <Label>{tCloud('scheduleSettings')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="frequency">{tCloud('frequency')}</Label>
                  <Select
                    value={watch('scheduleScanSetting.frequency')}
                    onValueChange={(value) => setValue('scheduleScanSetting.frequency', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`${t('select')} ${tCloud('frequency').toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOUR">{tCloud('hourly')}</SelectItem>
                      <SelectItem value="DAY">{tCloud('daily')}</SelectItem>
                      <SelectItem value="WEEK">{tCloud('weekly')}</SelectItem>
                      <SelectItem value="MONTH">{tCloud('monthly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="minute">{tCloud('minute')}</Label>
                  <Input
                    id="minute"
                    {...register('scheduleScanSetting.minute')}
                    placeholder="0-59"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )

    default:
      return null
  }
}
