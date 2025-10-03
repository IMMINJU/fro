'use client'

import { useEffect, useState, useMemo } from 'react'
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
import { Loader2 } from 'lucide-react'
import {
  PROVIDER_CONFIGS,
  getProviderConfig,
  getCredentialFields,
  getEventSourceFields,
  createProviderSchema
} from './provider-configs'
import { DynamicField } from './dynamic-field'
import { FormSkeleton } from '@/components/loading/form-skeleton'
import { ButtonLoading } from '@/components/loading/global-loading'

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
type CloudFormData = BaseFormData & Record<string, any> // Allow dynamic fields

// Helper function to get region list for provider
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

interface CloudFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cloudId?: string
  mode: 'create' | 'edit'
}

export function CloudFormDialog({ open, onOpenChange, cloudId, mode }: CloudFormDialogProps) {
  const t = useTranslations('common')
  const tCloud = useTranslations('cloud')
  const tValidation = useTranslations('validation')

  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)

  // Dynamic schema generation based on current provider and credential type
  const [currentProvider, setCurrentProvider] = useState<Provider>('AWS')
  const [currentCredentialType, setCurrentCredentialType] = useState<string>('ACCESS_KEY')

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

  // Update current provider/credential type when form values change
  useEffect(() => {
    if (watchProvider && watchProvider !== currentProvider) {
      setCurrentProvider(watchProvider)

      // Reset credential type to default when provider changes
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

  // Get current provider configuration
  const providerConfig = useMemo(() => {
    return getProviderConfig(currentProvider)
  }, [currentProvider])

  // Get current credential and event source fields
  const credentialFields = useMemo(() => {
    return getCredentialFields(currentProvider, currentCredentialType)
  }, [currentProvider, currentCredentialType])

  const eventSourceFields = useMemo(() => {
    return getEventSourceFields(currentProvider)
  }, [currentProvider])

  // Load data for edit mode
  useEffect(() => {
    if (open && mode === 'edit' && cloudId) {
      setInitializing(true)
      cloudService.get(cloudId)
        .then((cloud) => {
          // Set provider and credential type first
          setCurrentProvider(cloud.provider)
          setCurrentCredentialType(cloud.credentialType)

          // Build dynamic form data
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

          // Add provider-specific credential fields
          const credFields = getCredentialFields(cloud.provider, cloud.credentialType)
          credFields.forEach(field => {
            if (field.key in cloud.credentials) {
              formData[field.key] = (cloud.credentials as any)[field.key] || ''
            }
          })

          // Add provider-specific event source fields
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
      // Reset to default values
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
    setLoading(true)
    try {
      // Build the payload based on provider and credential type
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

      console.log('Form payload:', payload)

      if (mode === 'create') {
        await cloudService.create(payload)
      } else if (cloudId) {
        await cloudService.update(cloudId, payload)
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setLoading(false)
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

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (initializing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <FormSkeleton />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{tCloud('name')} *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder={`${t('enter')} ${tCloud('name').toLowerCase()}`}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
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
                  <SelectItem value="AZURE">Azure</SelectItem>
                  <SelectItem value="GCP">GCP</SelectItem>
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

            {/* Features */}
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

            {/* Schedule Settings */}
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

            {/* Regions */}
            <div>
              <Label>{tCloud('regions')} *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto">
                {getRegionListForProvider(currentProvider).map((region) => (
                  <div key={region} className="flex items-center space-x-2">
                    <Checkbox
                      id={`region-${region}`}
                      checked={watch('regionList')?.includes(region) || false}
                      onCheckedChange={(checked) => {
                        const current = watch('regionList') || []
                        if (checked) {
                          setValue('regionList', [...current, region])
                        } else {
                          setValue('regionList', current.filter(r => r !== region))
                        }
                      }}
                    />
                    <Label htmlFor={`region-${region}`} className="text-xs">
                      {region}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.regionList && (
                <p className="text-sm text-red-500">{errors.regionList.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="proxyUrl">{tCloud('proxyUrl')}</Label>
              <Input
                id="proxyUrl"
                {...register('proxyUrl')}
                placeholder="https://proxy.company.com:8080"
              />
            </div>

            {/* Credential Type Selection */}
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

            {/* Dynamic Credentials Fields */}
            <div className="space-y-4 p-3 border rounded">
              <Label>{tCloud('credentials')}</Label>
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
            </div>

            {/* Dynamic Event Source Fields */}
            {eventSourceFields.length > 0 && (
              <div className="space-y-4 p-3 border rounded">
                <Label>{tCloud('eventSource')}</Label>
                <div className="space-y-3">
                  {eventSourceFields.map((field) => (
                    <DynamicField
                      key={field.key}
                      field={field}
                      register={register}
                      errors={errors}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              {t('cancel')}
            </Button>
            <ButtonLoading
              type="submit"
              isLoading={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {mode === 'create' ? t('create') : t('save')}
            </ButtonLoading>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}