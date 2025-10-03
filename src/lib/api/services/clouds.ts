import { apiClient } from '../client'
import { API_ENDPOINTS } from '../config'
import { ListResponse, PaginationParams, FilterParams } from '../types'
import {
  Cloud,
  CloudCreateRequest,
  CloudUpdateRequest,
} from '@/types/types'

export class CloudService {
  // Get paginated list of clouds
  async list(
    params?: PaginationParams & FilterParams
  ): Promise<ListResponse<Cloud>> {
    // For now, return mock data matching the ListResponse interface
    await this.delay()

    // Import sample data
    const { sampleCloudData } = await import('@/data/sample-data')

    const page = params?.page || 1
    const limit = params?.limit || 10
    const search = params?.search
    const provider = params?.provider

    // Filter data based on search and provider
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

    // Paginate
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
  }

  // Get single cloud by ID
  async get(id: string): Promise<Cloud> {
    // Mock delay for demonstration
    await this.delay()

    // Return mock data with masked credentials
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
    }

    return mockCloud
  }

  // Create new cloud
  async create(data: CloudCreateRequest): Promise<Cloud> {
    await this.delay()

    console.log('Creating cloud with payload:', data)

    const newCloud: Cloud = {
      ...data,
      id: `cloud-${Date.now()}`,
    }

    return newCloud
  }

  // Update existing cloud
  async update(id: string, data: Partial<CloudUpdateRequest>): Promise<Cloud> {
    await this.delay()

    console.log('Updating cloud with payload:', { id, ...data })

    const updatedCloud: Cloud = {
      ...data,
      id,
    } as Cloud

    return updatedCloud
  }


  // Private helper for mock delay
  private delay(): Promise<void> {
    return new Promise(resolve =>
      setTimeout(resolve, Math.random() * 500)
    )
  }
}

export const cloudService = new CloudService()