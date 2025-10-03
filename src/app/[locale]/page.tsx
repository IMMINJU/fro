'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CloudTable } from '@/components/cloud-table/cloud-table'
import { createColumns } from '@/components/cloud-table/columns'
import { CloudFormWizard } from '@/components/cloud-form/cloud-form-wizard'
import { useCloudList } from '@/hooks/queries'
import { ErrorBoundary } from '@/components/error/error-boundary'
import { Suspense } from 'react'

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

        <ErrorBoundary>
          <Suspense fallback={<CloudTableSkeleton />}>
            <CloudTableWithData
              onCreateCloud={handleCreateCloud}
              onEditCloud={handleEditCloud}
            />
          </Suspense>
        </ErrorBoundary>

        <CloudFormWizard
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          cloudId={selectedCloudId}
        />
      </div>
    </main>
  )
}

function CloudTableWithData({
  onCreateCloud,
  onEditCloud,
}: {
  onCreateCloud: () => void
  onEditCloud: (cloudId: string) => void
}) {
  const {
    data: cloudList,
    isLoading,
    error,
  } = useCloudList({
    page: 1,
    limit: 50,
  })

  if (error) {
    throw error // Will be caught by ErrorBoundary
  }

  return (
    <CloudTable
      data={cloudList?.items || []}
      columns={createColumns(onEditCloud)}
      onCreateCloud={onCreateCloud}
      onEditCloud={onEditCloud}
      isLoading={isLoading}
    />
  )
}

function CloudTableSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end">
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="rounded-md border">
        <div className="space-y-3 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}