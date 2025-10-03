'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface RegionSelectorProps {
  regions: string[]
  selectedRegions: string[]
  onSelectionChange: (regions: string[]) => void
  error?: string
}

export function RegionSelector({
  regions,
  selectedRegions,
  onSelectionChange,
  error,
}: RegionSelectorProps) {
  const t = useTranslations('common')
  const tCloud = useTranslations('cloud')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter regions based on search
  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) return regions
    const query = searchQuery.toLowerCase()
    return regions.filter((region) => region.toLowerCase().includes(query))
  }, [regions, searchQuery])

  const allSelected = filteredRegions.every((region) =>
    selectedRegions.includes(region)
  )
  const someSelected =
    filteredRegions.some((region) => selectedRegions.includes(region)) &&
    !allSelected

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all filtered regions
      onSelectionChange(
        selectedRegions.filter((region) => !filteredRegions.includes(region))
      )
    } else {
      // Select all filtered regions
      const newSelection = [
        ...selectedRegions.filter((region) => !filteredRegions.includes(region)),
        ...filteredRegions.filter((region) => !selectedRegions.includes(region)),
      ]
      onSelectionChange(newSelection)
    }
  }

  const handleToggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      onSelectionChange(selectedRegions.filter((r) => r !== region))
    } else {
      onSelectionChange([...selectedRegions, region])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">
          {tCloud('regions')} *
        </Label>
        <span className="text-xs text-muted-foreground">
          {selectedRegions.length} selected
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`${t('search')} ${tCloud('regions').toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Select All */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={handleSelectAll}
          />
          <Label htmlFor="select-all" className="text-sm font-medium">
            {allSelected ? t('deselectAll') : t('selectAll')}
            {searchQuery && ` (${filteredRegions.length} filtered)`}
          </Label>
        </div>
        {selectedRegions.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
            className="text-xs"
          >
            {t('clear')}
          </Button>
        )}
      </div>

      {/* Region List */}
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
        {filteredRegions.length > 0 ? (
          filteredRegions.map((region) => (
            <div key={region} className="flex items-center space-x-2">
              <Checkbox
                id={`region-${region}`}
                checked={selectedRegions.includes(region)}
                onCheckedChange={() => handleToggleRegion(region)}
              />
              <Label
                htmlFor={`region-${region}`}
                className="text-xs cursor-pointer"
              >
                {region}
              </Label>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center text-sm text-muted-foreground py-4">
            {t('noResults')}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
