'use client'

import { useState, useEffect, useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { GenericFormWizard } from '@/components/forms/generic-form-wizard'
import { cloudFormConfig, cloudFormSchema } from '@/config/forms/cloud-form.config'
import { createFormValidation } from '@/lib/validation/generic-validation'
import { getStepValidationStatus } from '@/lib/validation/step-validation'
import { useCreateCloud, useUpdateCloud } from '@/hooks/queries/use-cloud-queries'
import { cloudService } from '@/lib/api/services'
import { FormSkeleton } from '@/components/loading/form-skeleton'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DynamicField } from './dynamic-field'
import { RegionSelector } from './region-selector'
import {
  getProviderConfig,
  getCredentialFields,
  getEventSourceFields
} from './provider-configs'
import { Provider, CLOUD_GROUP_NAMES, AWSRegionList, AzureRegionList, GCPRegionList } from '@/types/types'
import { useTranslations } from 'next-intl'
import { z } from 'zod'

interface CloudFormWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cloudId?: string
  mode: 'create' | 'edit'
}

export function CloudFormWizard({ open, onOpenChange, cloudId, mode }: CloudFormWizardProps) {
  const t = useTranslations('common')
  const tCloud = useTranslations('cloud')

  const [initializing, setInitializing] = useState(false)
  const [currentProvider, setCurrentProvider] = useState<Provider>('AWS')
  const [currentCredentialType, setCurrentCredentialType] = useState<string>('ACCESS_KEY')
  const [formDefaults, setFormDefaults] = useState(cloudFormConfig.defaultValues)

  const createMutation = useCreateCloud()
  const updateMutation = useUpdateCloud()

  // Load data for edit mode
  useEffect(() => {
    if (open && mode === 'edit' && cloudId) {
      setInitializing(true)
      cloudService.get(cloudId)
        .then((cloud) => {
          setCurrentProvider(cloud.provider)
          setCurrentCredentialType(cloud.credentialType)

          const formData: any = {
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
              formData[field.key] = (cloud.credentials as any)[field.key] || ''
            }
          })

          // Add event source fields
          if (cloud.eventSource) {
            const eventFields = getEventSourceFields(cloud.provider)
            eventFields.forEach(field => {
              if (field.key in cloud.eventSource!) {
                formData[field.key] = (cloud.eventSource as any)[field.key] || ''
              }
            })
          }

          setFormDefaults(formData)
        })
        .catch((error) => {
          console.error('Failed to load cloud data:', error)
        })
        .finally(() => {
          setInitializing(false)
        })
    } else if (open && mode === 'create') {
      setFormDefaults(cloudFormConfig.defaultValues)
      setCurrentProvider('AWS')
      setCurrentCredentialType('ACCESS_KEY')
    }
  }, [open, mode, cloudId])

  // Validation system
  const validation = createFormValidation(
    {
      0: { requiredFields: ['name', 'provider'] },
      1: { requiredFields: ['credentialType'] },
      2: { requiredFields: ['regionList'] },
      3: { requiredFields: [] },
    },
    cloudFormConfig.fields
  )

  // Custom validation for step 2 (credentials with dynamic fields)
  const validateStep = (step: number, formData: Record<string, any>, errors: any) => {
    if (step === 1) {
      return getStepValidationStatus(step, formData, errors)
    }
    return validation.validateStep(step, formData, errors)
  }

  // Render step content
  const renderStep = (step: number, form: UseFormReturn<z.infer<typeof cloudFormSchema>>) => {
    const { watch, setValue, register, formState: { errors } } = form

    // Watch for provider and credential type changes
    const watchProvider = watch('provider') as Provider
    const watchCredentialType = watch('credentialType')
    const watchScheduleScanEnabled = watch('scheduleScanEnabled')

    // Update current provider when changed
    useEffect(() => {
      if (watchProvider && watchProvider !== currentProvider) {
        setCurrentProvider(watchProvider)
        const providerConfig = getProviderConfig(watchProvider)
        const defaultCredType = providerConfig.defaultCredentialType
        setValue('credentialType', defaultCredType)
        setCurrentCredentialType(defaultCredType)
      }
    }, [watchProvider])

    // Update current credential type when changed
    useEffect(() => {
      if (watchCredentialType && watchCredentialType !== currentCredentialType) {
        setCurrentCredentialType(watchCredentialType)
      }
    }, [watchCredentialType])

    const providerConfig = useMemo(() => getProviderConfig(currentProvider), [currentProvider])
    const credentialFields = useMemo(
      () => getCredentialFields(currentProvider, currentCredentialType),
      [currentProvider, currentCredentialType]
    )
    const eventSourceFields = useMemo(() => getEventSourceFields(currentProvider), [currentProvider])

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

  // Handle form submission
  const handleSubmit = async (data: z.infer<typeof cloudFormSchema>) => {
    const credentialFields = getCredentialFields(currentProvider, currentCredentialType)
    const eventFields = getEventSourceFields(currentProvider)

    const credentials: any = {}
    credentialFields.forEach(field => {
      if ((data as any)[field.key] !== undefined && (data as any)[field.key] !== '') {
        credentials[field.key] = (data as any)[field.key]
      }
    })

    const eventSource: any = {}
    let hasEventSource = false
    eventFields.forEach(field => {
      if ((data as any)[field.key] !== undefined && (data as any)[field.key] !== '') {
        eventSource[field.key] = (data as any)[field.key]
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
      credentials,
      eventSource: hasEventSource ? eventSource : undefined,
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
      isLoading={initializing}
      loadingContent={<FormSkeleton />}
    />
  )
}
