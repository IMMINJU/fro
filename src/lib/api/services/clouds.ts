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
    const response = await apiClient.get<ListResponse<Cloud>>(
      API_ENDPOINTS.CLOUDS.LIST,
      params
    )
    return response
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

  // Delete cloud
  async delete(id: string): Promise<void> {
    await this.delay()

    console.log('Deleting cloud:', id)
  }

  // Bulk operations
  async bulkDelete(ids: string[]): Promise<void> {
    await this.delay()

    console.log('Bulk deleting clouds:', ids)
  }

  async bulkUpdate(
    ids: string[],
    data: Partial<CloudUpdateRequest>
  ): Promise<Cloud[]> {
    await this.delay()

    console.log('Bulk updating clouds:', { ids, data })

    return ids.map(id => ({ ...data, id } as Cloud))
  }

  // Validation methods
  async validateCredentials(
    provider: string,
    credentials: any
  ): Promise<{ valid: boolean; message?: string }> {
    await this.delay()

    console.log('Validating credentials for provider:', provider, credentials)

    return { valid: true }
  }

  async testConnection(id: string): Promise<{ success: boolean; message?: string }> {
    await this.delay()

    console.log('Testing connection for cloud:', id)

    return { success: true, message: 'Connection successful' }
  }

  // Private helper for mock delay
  private delay(): Promise<void> {
    return new Promise(resolve =>
      setTimeout(resolve, Math.random() * 500)
    )
  }
}

export const cloudService = new CloudService()