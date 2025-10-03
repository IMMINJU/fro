'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Cloud } from '@/types/types'
import { GenericDataTable } from '@/components/tables/generic-data-table'

interface CloudTableProps {
  data: Cloud[]
  columns: ColumnDef<Cloud>[]
  onCreateCloud?: () => void
  isLoading?: boolean
}

/**
 * Cloud Table Component
 * Specialized wrapper around GenericDataTable for Cloud entities
 */
export function CloudTable({ data, columns, onCreateCloud, isLoading = false }: CloudTableProps) {
  return (
    <GenericDataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      translationKey="cloud"
      showCreate
      onCreateClick={onCreateCloud}
    />
  )
}
