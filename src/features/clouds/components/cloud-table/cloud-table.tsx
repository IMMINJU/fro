'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Plus, FileX } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Cloud } from '@/types/types'
import { TableSkeleton } from '@/components/loading/table-skeleton'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface CloudTableProps {
  data: Cloud[]
  columns: ColumnDef<Cloud>[]
  onCreateCloud?: () => void
  isLoading?: boolean
}

/**
 * Cloud Table Component
 * Direct implementation with TanStack Table
 */
export function CloudTable({ data, columns, onCreateCloud, isLoading = false }: CloudTableProps) {
  const t = useTranslations('cloud')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return <TableSkeleton rows={5} columns={columns.length} />
  }

  return (
    <div className="w-full space-y-4">
      {/* Header with create button */}
      {onCreateCloud && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 sm:gap-0">
          <Button onClick={onCreateCloud} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('create')}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64">
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <FileX className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      {t('messages.noResults')}
                    </h3>
                    {onCreateCloud && (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t('emptyStateMessage', { item: 'cloud' })}
                        </p>
                        <Button onClick={onCreateCloud} size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          {t('create')}
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
