'use client'

import { useTranslations } from 'next-intl'
import { getRegionList } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCloudFormContext } from '../cloud-form-context'
import { RegionSelector } from '../region-selector'

export function RegionsStep() {
  const tCloud = useTranslations('cloud')
  const { form, currentProvider } = useCloudFormContext()
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
