'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Cloud, Provider } from '@/types/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Shield,
  Activity,
  Calendar,
  Globe
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslations } from 'next-intl'

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

// 크리덴셜 타입 표시
const getCredentialTypeBadge = (credentialType: string) => {
  const isActive = credentialType === 'ACCESS_KEY' || credentialType === 'APPLICATION' || credentialType === 'JSON_TEXT'
  return (
    <Badge variant={isActive ? 'default' : 'secondary'}>
      {credentialType}
    </Badge>
  )
}

// 마스킹된 크리덴셜 표시
const renderMaskedCredentials = (credentials: Cloud['credentials']) => {
  if ('accessKeyId' in credentials) {
    return (
      <div className="text-xs text-gray-600">
        <div>Access Key: {credentials.accessKeyId}</div>
        <div>Secret: {credentials.secretAccessKey}</div>
      </div>
    )
  }
  if ('tenantId' in credentials) {
    return (
      <div className="text-xs text-gray-600">
        <div>Tenant: {credentials.tenantId}</div>
        <div>App ID: {credentials.applicationId}</div>
      </div>
    )
  }
  if ('jsonText' in credentials) {
    return (
      <div className="text-xs text-gray-600">
        <div>Project: {credentials.projectId || 'N/A'}</div>
        <div>JSON: ***</div>
      </div>
    )
  }
  return <span className="text-gray-400">-</span>
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
    accessorKey: 'credentialType',
    header: 'Credential Type',
    cell: ({ row }) => {
      const credentialType = row.getValue('credentialType') as string
      return getCredentialTypeBadge(credentialType)
    },
  },
  {
    accessorKey: 'credentials',
    header: 'Credentials',
    cell: ({ row }) => {
      const credentials = row.getValue('credentials') as Cloud['credentials']
      return renderMaskedCredentials(credentials)
    },
  },
  {
    accessorKey: 'regionList',
    header: 'Regions',
    cell: ({ row }) => {
      const regions = row.getValue('regionList') as string[]
      return (
        <div className="flex items-center gap-1">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{regions.length} regions</span>
        </div>
      )
    },
  },
  {
    id: 'features',
    header: 'Features',
    cell: ({ row }) => {
      const cloud = row.original
      return (
        <div className="flex gap-2">
          {cloud.eventProcessEnabled && (
            <Badge variant="outline" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Events
            </Badge>
          )}
          {cloud.userActivityEnabled && (
            <Badge variant="outline" className="text-xs">
              <Activity className="w-3 h-3 mr-1" />
              Activity
            </Badge>
          )}
          {cloud.scheduleScanEnabled && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              Schedule
            </Badge>
          )}
        </div>
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
    id: 'schedule',
    header: 'Schedule',
    cell: ({ row }) => {
      const cloud = row.original
      if (!cloud.scheduleScanEnabled || !cloud.scheduleScanSetting) {
        return <span className="text-gray-400">-</span>
      }

      const { frequency, hour, minute, weekday, date } = cloud.scheduleScanSetting
      let scheduleText = frequency

      if (frequency === 'DAY' && hour && minute) {
        scheduleText = `Daily at ${hour}:${minute}`
      } else if (frequency === 'WEEK' && weekday && hour && minute) {
        scheduleText = `${weekday} at ${hour}:${minute}`
      } else if (frequency === 'MONTH' && date && hour && minute) {
        scheduleText = `${date}th at ${hour}:${minute}`
      } else if (frequency === 'HOUR' && minute) {
        scheduleText = `Every hour at :${minute}`
      }

      return (
        <div className="text-sm text-gray-600">
          {scheduleText}
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
        } else {
          console.log('Edit cloud:', cloud.id)
        }
      }

      const handleView = () => {
        console.log('View cloud:', cloud.id)
        // TODO: Navigate to details page or open details modal
      }

      const handleDelete = () => {
        console.log('Delete cloud:', cloud.id)
        // TODO: Show confirmation dialog and delete
      }

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="h-8"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(cloud.id)}
              >
                Copy Cloud ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleView}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]