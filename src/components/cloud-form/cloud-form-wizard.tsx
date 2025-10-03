'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Cloud, Provider, AWSRegionList, AzureRegionList, GCPRegionList, CLOUD_GROUP_NAMES } from '@/types/types'
import { cloudService } from '@/lib/api/services'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  PROVIDER_CONFIGS,
  getProviderConfig,
  getCredentialFields,
  getEventSourceFields,
  createProviderSchema
} from './provider-configs'
import { DynamicField } from './dynamic-field'
import { RegionSelector } from './region-selector'
import { StepWizard, StepIndicator, StepContent, useStepWizard } from '@/components/ui/step-wizard'
import { FormSkeleton } from '@/components/loading/form-skeleton'
import { ButtonLoading } from '@/components/loading/global-loading'
import { useCreateCloud, useUpdateCloud } from '@/hooks/queries'
import { useState } from 'react'
import { getStepValidationStatus } from '@/lib/validation/step-validation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

// Base form schema (provider-agnostic)
const baseFormSchema = z.object({
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
})

type BaseFormData = z.infer<typeof baseFormSchema>
type CloudFormData = BaseFormData & Record<string, any>

const getRegionListForProvider = (provider: Provider) => {
  switch (provider) {
    case 'AWS':
      return AWSRegionList
    case 'AZURE':
      return AzureRegionList
    case 'GCP':
      return GCPRegionList
    default:
      return AWSRegionList
  }
}

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

  const createMutation = useCreateCloud()
  const updateMutation = useUpdateCloud()

  const dynamicSchema = useMemo(() => {
    const { credentialSchema, eventSourceSchema } = createProviderSchema(
      currentProvider,
      currentCredentialType
    )
    return baseFormSchema.merge(credentialSchema).merge(eventSourceSchema)
  }, [currentProvider, currentCredentialType])

  const form = useForm<CloudFormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      name: '',
      provider: 'AWS',
      cloudGroupName: [],
      eventProcessEnabled: false,
      userActivityEnabled: false,
      scheduleScanEnabled: false,
      regionList: [],
      credentialType: 'ACCESS_KEY',
    },
  })

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = form
  const watchProvider = watch('provider') as Provider
  const watchCredentialType = watch('credentialType')
  const watchScheduleScanEnabled = watch('scheduleScanEnabled')

  useEffect(() => {
    if (watchProvider && watchProvider !== currentProvider) {
      setCurrentProvider(watchProvider)
      const providerConfig = getProviderConfig(watchProvider)
      const defaultCredType = providerConfig.defaultCredentialType
      setValue('credentialType', defaultCredType)
      setCurrentCredentialType(defaultCredType)
    }
  }, [watchProvider, currentProvider, setValue])

  useEffect(() => {
    if (watchCredentialType && watchCredentialType !== currentCredentialType) {
      setCurrentCredentialType(watchCredentialType)
    }
  }, [watchCredentialType, currentCredentialType])

  const providerConfig = useMemo(() => {
    return getProviderConfig(currentProvider)
  }, [currentProvider])

  const credentialFields = useMemo(() => {
    return getCredentialFields(currentProvider, currentCredentialType)
  }, [currentProvider, currentCredentialType])

  const eventSourceFields = useMemo(() => {
    return getEventSourceFields(currentProvider)
  }, [currentProvider])

  useEffect(() => {
    if (open && mode === 'edit' && cloudId) {
      setInitializing(true)
      cloudService.get(cloudId)
        .then((cloud) => {
          setCurrentProvider(cloud.provider)
          setCurrentCredentialType(cloud.credentialType)

          const formData: any = {
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

          const credFields = getCredentialFields(cloud.provider, cloud.credentialType)
          credFields.forEach(field => {
            if (field.key in cloud.credentials) {
              formData[field.key] = (cloud.credentials as any)[field.key] || ''
            }
          })

          if (cloud.eventSource) {
            const eventFields = getEventSourceFields(cloud.provider)
            eventFields.forEach(field => {
              if (field.key in cloud.eventSource!) {
                formData[field.key] = (cloud.eventSource as any)[field.key] || ''
              }
            })
          }

          reset(formData)
        })
        .catch((error) => {
          console.error('Failed to load cloud data:', error)
        })
        .finally(() => {
          setInitializing(false)
        })
    } else if (open && mode === 'create') {
      const defaultProvider: Provider = 'AWS'
      const defaultCredType = getProviderConfig(defaultProvider).defaultCredentialType

      setCurrentProvider(defaultProvider)
      setCurrentCredentialType(defaultCredType)

      reset({
        name: '',
        provider: defaultProvider,
        cloudGroupName: [],
        eventProcessEnabled: false,
        userActivityEnabled: false,
        scheduleScanEnabled: false,
        regionList: [],
        credentialType: defaultCredType,
      })
    }
  }, [open, mode, cloudId, reset])

  const onSubmit = async (data: CloudFormData) => {
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
      credentials: buildCredentials(data),
      eventSource: buildEventSource(data),
    }

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload)
      } else if (cloudId) {
        await updateMutation.mutateAsync({ id: cloudId, data: payload })
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const buildCredentials = (data: CloudFormData) => {
    const credentials: any = {}
    const credFields = getCredentialFields(data.provider as Provider, data.credentialType)

    credFields.forEach(field => {
      if (data[field.key] !== undefined && data[field.key] !== '') {
        credentials[field.key] = data[field.key]
      }
    })

    return credentials
  }

  const buildEventSource = (data: CloudFormData) => {
    const eventSource: any = {}
    const eventFields = getEventSourceFields(data.provider as Provider)
    let hasEventSource = false

    eventFields.forEach(field => {
      if (data[field.key] !== undefined && data[field.key] !== '') {
        eventSource[field.key] = data[field.key]
        hasEventSource = true
      }
    })

    return hasEventSource ? eventSource : undefined
  }

  if (initializing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('loading')}</DialogTitle>
          </DialogHeader>
          <FormSkeleton />
        </DialogContent>
      </Dialog>
    )
  }

  const steps = [
    { title: tCloud('basicInfo'), description: 'Provider and identity' },
    { title: tCloud('credentials'), description: 'Authentication' },
    { title: tCloud('regions'), description: 'Region selection' },
    { title: tCloud('features'), description: 'Features and schedule' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? tCloud('create') : tCloud('edit')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? tCloud('subtitle')
              : 'Update cloud provider configuration'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <StepWizard totalSteps={4}>
            {/* Step Indicator */}
            <StepIndicator steps={steps} />

            {/* Step 1: Provider & Identity */}
            <StepContent step={0}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{tCloud('name')} *</Label>
                  <Input
                    id="name"
                    {...register('name', {
                      onBlur: () => form.trigger('name')
                    })}
                    placeholder={`${t('enter')} ${tCloud('name').toLowerCase()}`}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
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
            </StepContent>

            {/* Step 2: Credentials */}
            <StepContent step={1}>
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
            </StepContent>

            {/* Step 3: Regions */}
            <StepContent step={2}>
              <div className="space-y-4">
                <RegionSelector
                  regions={[...getRegionListForProvider(currentProvider)]}
                  selectedRegions={watch('regionList') || []}
                  onSelectionChange={(regions) => setValue('regionList', regions)}
                  error={errors.regionList?.message}
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
            </StepContent>

            {/* Step 4: Features & Schedule */}
            <StepContent step={3}>
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
            </StepContent>

            {/* Wizard Navigation */}
            <WizardFooter
              mode={mode}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onCancel={() => onOpenChange(false)}
              formData={watch()}
              errors={errors}
            />
          </StepWizard>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function WizardFooter({
  mode,
  isLoading,
  onCancel,
  formData,
  errors,
}: {
  mode: 'create' | 'edit'
  isLoading: boolean
  onCancel: () => void
  formData: Record<string, any>
  errors: any
}) {
  const t = useTranslations('common')
  const { currentStep, goToPrevious, goToNext, isFirstStep, isLastStep } = useStepWizard()
  const [showValidationError, setShowValidationError] = useState(false)

  // Get validation status for current step
  const validationStatus = getStepValidationStatus(currentStep, formData, errors)

  const handleNext = () => {
    if (!validationStatus.isValid) {
      setShowValidationError(true)
      return
    }
    setShowValidationError(false)
    goToNext()
  }

  // Reset validation error when step changes
  useEffect(() => {
    setShowValidationError(false)
  }, [currentStep])

  return (
    <>
      {/* Validation Error Alert */}
      {showValidationError && !validationStatus.isValid && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationStatus.missingFields.length > 0
              ? `Please fill in required fields: ${validationStatus.missingFields.join(', ')}`
              : 'Please fix the errors before proceeding'}
          </AlertDescription>
        </Alert>
      )}

      <DialogFooter className="mt-6">
        <div className="flex justify-between w-full">
          <Button
            type="button"
            variant="outline"
            onClick={isFirstStep ? onCancel : goToPrevious}
          >
            {isFirstStep ? t('cancel') : t('previous')}
          </Button>

          {isLastStep ? (
            <ButtonLoading
              type="submit"
              isLoading={isLoading}
              variant="default"
              className="min-w-[100px]"
            >
              {mode === 'create' ? t('create') : t('save')}
            </ButtonLoading>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              variant="default"
              className="min-w-[100px]"
              disabled={!validationStatus.isValid}
            >
              {t('next')}
            </Button>
          )}
        </div>
      </DialogFooter>
    </>
  )
}
