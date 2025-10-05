'use client'

import { ReactNode } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  OnChangeFn,
} from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
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

/**
 * Generic Data Table Props
 * @template TData - The type of data in the table
 */
export interface GenericDataTableProps<TData> {
  /** Table columns definition */
  columns: ColumnDef<TData>[]

  /** Table data */
  data: TData[]

  /** Loading state */
  isLoading?: boolean

  /** Translation namespace (e.g., 'cloud', 'user', 'policy') */
  translationKey?: string

  /** Custom empty state message */
  emptyMessage?: string

  /** Show create button */
  showCreate?: boolean

  /** Create button text override */
  createButtonText?: string

  /** Create button click handler */
  onCreateClick?: () => void

  /** Enable pagination */
  enablePagination?: boolean

  /** Pagination state (controlled) */
  pagination?: PaginationState

  /** Pagination change handler */
  onPaginationChange?: OnChangeFn<PaginationState>

  /** Enable sorting */
  enableSorting?: boolean

  /** Sorting state (controlled) */
  sorting?: SortingState

  /** Sorting change handler */
  onSortingChange?: OnChangeFn<SortingState>

  /** Enable filtering */
  enableFiltering?: boolean

  /** Column filters state (controlled) */
  columnFilters?: ColumnFiltersState

  /** Column filters change handler */
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>

  /** Custom header actions (e.g., filters, search) */
  headerActions?: ReactNode

  /** Custom footer */
  footer?: ReactNode

  /** Table container className */
  className?: string

  /** Skeleton rows count when loading */
  skeletonRows?: number
}

/**
 * Generic Data Table Component
 *
 * A reusable table component that can be used for any entity type.
 * Supports pagination, sorting, filtering, and custom actions.
 *
 * @example
 * ```typescript
 * // Basic usage
 * <GenericDataTable
 *   columns={cloudColumns}
 *   data={clouds}
 *   translationKey="cloud"
 *   showCreate
 *   onCreateClick={() => setIsCreateOpen(true)}
 * />
 *
 * // With pagination
 * <GenericDataTable
 *   columns={userColumns}
 *   data={users}
 *   translationKey="user"
 *   enablePagination
 *   pagination={pagination}
 *   onPaginationChange={setPagination}
 * />
 * ```
 */
export function GenericDataTable<TData>({
  columns,
  data,
  isLoading = false,
  translationKey = 'common',
  emptyMessage,
  showCreate = true,
  createButtonText,
  onCreateClick,
  enablePagination = false,
  pagination,
  onPaginationChange,
  enableSorting = false,
  sorting,
  onSortingChange,
  enableFiltering = false,
  columnFilters,
  onColumnFiltersChange,
  headerActions,
  footer,
  className,
  skeletonRows = 5,
}: GenericDataTableProps<TData>) {
  const t = useTranslations(translationKey)
  const tCommon = useTranslations('common')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && {
      getSortedRowModel: getSortedRowModel(),
      onSortingChange,
      state: { sorting },
    }),
    ...(enableFiltering && {
      getFilteredRowModel: getFilteredRowModel(),
      onColumnFiltersChange,
      state: { columnFilters },
    }),
    ...(enablePagination && {
      getPaginationRowModel: getPaginationRowModel(),
      onPaginationChange,
      state: { pagination },
    }),
  })

  if (isLoading) {
    return <TableSkeleton rows={skeletonRows} columns={columns.length} />
  }

  const displayEmptyMessage =
    emptyMessage || t('messages.noResults') || tCommon('noResults')
  const displayCreateText = createButtonText || t('create') || tCommon('create')

  return (
    <div className={className || 'w-full space-y-4'}>
      {/* Header with actions */}
      {(showCreate || headerActions) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">{headerActions}</div>
          {showCreate && onCreateClick && (
            <Button onClick={onCreateClick} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              {displayCreateText}
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {displayEmptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer (e.g., pagination) */}
      {footer}
    </div>
  )
}
