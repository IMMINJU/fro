'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Cloud, Provider } from '@/types/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'

// 프로바이더별 색상 매핑
const getProviderColor = (provider: Provider) => {
  switch (provider) {
    case 'AWS':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200'
    case 'AZURE':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    case 'GCP':
      return 'bg-green-100 text-green-800 hover:bg-green-200'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
}

export const createColumns = (onEditCloud?: (cloudId: string) => void): ColumnDef<Cloud>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const cloud = row.original
      return (
        <div className="flex flex-col">
          <div className="font-medium">{cloud.name}</div>
          <div className="text-sm text-gray-500">{cloud.id}</div>
        </div>
      )
    },
  },
  {
    accessorKey: 'provider',
    header: 'Provider',
    cell: ({ row }) => {
      const provider = row.getValue('provider') as Provider
      return (
        <Badge className={getProviderColor(provider)}>
          {provider}
        </Badge>
      )
    },
  },
  {
    id: 'cloudGroup',
    header: 'Cloud Group',
    cell: ({ row }) => {
      const cloudGroupName = row.original.cloudGroupName
      if (!cloudGroupName || cloudGroupName.length === 0) {
        return <span className="text-gray-400">-</span>
      }
      return (
        <div className="flex flex-wrap gap-1">
          {cloudGroupName.map((group, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {group}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const cloud = row.original

      const handleEdit = () => {
        if (onEditCloud) {
          onEditCloud(cloud.id)
        }
      }

      return (
        <Button
          variant="outline"
          size="sm"
          onClick={handleEdit}
          className="h-8"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      )
    },
  },
]