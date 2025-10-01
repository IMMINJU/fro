'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CloudTable } from '@/components/cloud-table/cloud-table'
import { createColumns } from '@/components/cloud-table/columns'
import { sampleCloudData } from '@/data/sample-data'
import { CloudFormDialog } from '@/components/cloud-form/cloud-form-dialog'

export default function HomePage() {
  const t = useTranslations('cloud')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedCloudId, setSelectedCloudId] = useState<string | undefined>()

  const handleCreateCloud = () => {
    setDialogMode('create')
    setSelectedCloudId(undefined)
    setDialogOpen(true)
  }

  const handleEditCloud = (cloudId: string) => {
    setDialogMode('edit')
    setSelectedCloudId(cloudId)
    setDialogOpen(true)
  }

  return (
    <main className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <CloudTable
          data={sampleCloudData}
          columns={createColumns(handleEditCloud)}
          onCreateCloud={handleCreateCloud}
          onEditCloud={handleEditCloud}
        />

        <CloudFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          cloudId={selectedCloudId}
        />
      </div>
    </main>
  )
}