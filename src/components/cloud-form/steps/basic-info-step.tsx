'use client'

import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { Provider, CLOUD_GROUP_NAMES } from '@/types/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cloudFormSchema } from '@/features/clouds/config/cloud-form.config'

interface BasicInfoStepProps {
  form: UseFormReturn<z.infer<typeof cloudFormSchema>>
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const t = useTranslations('common')
  const tCloud = useTranslations('cloud')
  const { watch, setValue, register, formState: { errors } } = form

  const watchProvider = watch('provider') as Provider

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
}
