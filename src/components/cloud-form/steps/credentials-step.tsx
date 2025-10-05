'use client'

import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DynamicField } from '../dynamic-field'
import { useCloudFormContext } from '../cloud-form-context'

export function CredentialsStep() {
  const t = useTranslations('common')
  const tCloud = useTranslations('cloud')
  const { form, providerConfig, credentialFields, eventSourceFields } = useCloudFormContext()
  const { watch, setValue, register, formState: { errors } } = form

  const watchCredentialType = watch('credentialType')

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
}
