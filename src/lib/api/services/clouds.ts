import { ListResponse, PaginationParams, FilterParams } from '../types'
import {
  Cloud,
  CloudCreateRequest,
  CloudUpdateRequest,
} from '@/types/types'
import { createCrudService } from './create-crud-service'

/**
 * Cloud Service (Mock Data Only)
 * Simplified service for development with local sample data
 */
export const cloudService = createCrudService<Cloud, CloudCreateRequest, CloudUpdateRequest>(
  {
    /**
     * Get paginated list of clouds
     */
    list: async (params?: PaginationParams & FilterParams): Promise<ListResponse<Cloud>> => {
      const { sampleCloudData } = await import('@/data/sample-data')

      const page = params?.page || 1
      const limit = params?.limit || 10
      const search = params?.search
      const provider = params?.provider

      let filteredData = sampleCloudData

      if (search) {
        filteredData = filteredData.filter(cloud =>
          cloud.name.toLowerCase().includes(search.toLowerCase()) ||
          cloud.id.toLowerCase().includes(search.toLowerCase())
        )
      }

      if (provider) {
        filteredData = filteredData.filter(cloud =>
          cloud.provider === provider
        )
      }

      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedData = filteredData.slice(startIndex, endIndex)

      return {
        items: paginatedData,
        total: filteredData.length,
        page,
        limit,
        hasNext: endIndex < filteredData.length,
        hasPrev: page > 1,
      }
    },

    /**
     * Get single cloud by ID
     */
    get: async (id: string): Promise<Cloud> => {
      const { sampleCloudData } = await import('@/data/sample-data')

      // Find cloud in sample data
      const cloud = sampleCloudData.find(c => c.id === id)

      if (cloud) {
        return cloud
      }

      // Fallback: return mock data if not found
      const mockCloud: Cloud = {
        id,
        provider: 'AWS',
        name: `Cloud ${id}`,
        cloudGroupName: ['Production'],
        eventProcessEnabled: true,
        userActivityEnabled: false,
        scheduleScanEnabled: true,
        scheduleScanSetting: {
          frequency: 'DAY',
          hour: '02',
          minute: '00',
        },
        regionList: ['us-east-1', 'us-west-2'],
        proxyUrl: 'https://proxy.company.com:8080',
        credentials: {
          accessKeyId: 'AKIA********18',
          secretAccessKey: 'jZd1********0n',
        },
        credentialType: 'ACCESS_KEY',
        eventSource: {
          cloudTrailName: 'production-cloudtrail',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return mockCloud
    },

    /**
     * Create new cloud
     */
    create: async (data: CloudCreateRequest): Promise<Cloud> => {
      console.log('Creating cloud with payload:', data)

      const newCloud: Cloud = {
        ...data,
        id: `cloud-${Date.now()}`,
      }

      return newCloud
    },

    /**
     * Update existing cloud
     */
    update: async (id: string, data: Partial<CloudUpdateRequest>): Promise<Cloud> => {
      console.log('Updating cloud with payload:', { id, ...data })

      const updatedCloud: Cloud = {
        ...data,
        id,
      } as Cloud

      return updatedCloud
    },

    /**
     * Delete cloud
     */
    delete: async (id: string): Promise<void> => {
      console.log('Deleting cloud:', id)
    },
  },
  {
    enableDelay: true, // Mock delay for development
  }
)
