'use client'

import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cloudFormSchema } from '@/features/clouds/config/cloud-form.config'

interface FeaturesStepProps {
  form: UseFormReturn<z.infer<typeof cloudFormSchema>>
}

export function FeaturesStep({ form }: FeaturesStepProps) {
  const t = useTranslations('common')
  const tCloud = useTranslations('cloud')
  const { watch, setValue, register } = form

  const watchScheduleScanEnabled = watch('scheduleScanEnabled')

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
}
