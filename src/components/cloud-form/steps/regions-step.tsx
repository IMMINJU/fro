'use client'

import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { Provider } from '@/types/types'
import { getRegionList } from '@/lib/utils/region-utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cloudFormSchema } from '@/config/forms/cloud-form.config'
import { RegionSelector } from '../region-selector'

interface RegionsStepProps {
  form: UseFormReturn<z.infer<typeof cloudFormSchema>>
  currentProvider: Provider
}

export function RegionsStep({ form, currentProvider }: RegionsStepProps) {
  const tCloud = useTranslations('cloud')
  const { watch, setValue, register, formState: { errors } } = form

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
}
