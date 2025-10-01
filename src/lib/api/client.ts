import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios'
import { API_CONFIG, HTTP_STATUS } from './config'
import {
  ApiResponse,
  ApiClientError,
  NetworkError,
  ValidationError,
} from './types'

class ApiClient {
  private instance: AxiosInstance
  private authToken: string | null = null

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`
        }

        // Add request timestamp for logging
        config.metadata = { startTime: Date.now() }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // Log request duration
        const duration = Date.now() - response.config.metadata?.startTime
        console.debug(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)

        return response
      },
      async (error: AxiosError<ApiResponse>) => {
        // Handle different error types
        if (error.response) {
          // Server responded with error status
          const { status, data } = error.response

          switch (status) {
            case HTTP_STATUS.UNAUTHORIZED:
              // Handle token expiration
              await this.handleUnauthorized()
              break
            case HTTP_STATUS.UNPROCESSABLE_ENTITY:
              throw new ValidationError(
                data?.message || 'Validation failed',
                data?.errors || {}
              )
            default:
              throw new ApiClientError(
                status,
                data?.error || 'API_ERROR',
                data?.message || 'An error occurred',
                data
              )
          }
        } else if (error.request) {
          // Network error
          throw new NetworkError('Network error occurred', error)
        } else {
          // Other error
          throw new Error(error.message)
        }

        return Promise.reject(error)
      }
    )
  }

  private async handleUnauthorized() {
    // Clear auth token
    this.authToken = null

    // Redirect to login or refresh token
    if (typeof window !== 'undefined') {
      // Client-side: redirect to login
      window.location.href = '/login'
    }
  }

  public setAuthToken(token: string) {
    this.authToken = token
  }

  public clearAuthToken() {
    this.authToken = null
  }

  // Generic request method with retry logic
  private async request<T>(
    config: AxiosRequestConfig,
    retryCount = 0
  ): Promise<T> {
    try {
      const response = await this.instance.request<ApiResponse<T>>(config)

      if (!response.data.success) {
        throw new ApiClientError(
          response.status,
          response.data.error || 'API_ERROR',
          response.data.message || 'Request failed',
          response.data
        )
      }

      return response.data.data as T
    } catch (error) {
      // Retry logic for network errors
      if (
        error instanceof NetworkError &&
        retryCount < API_CONFIG.RETRY_ATTEMPTS
      ) {
        await this.delay(API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount))
        return this.request<T>(config, retryCount + 1)
      }

      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // HTTP methods
  public async get<T>(url: string, params?: any): Promise<T> {
    return this.request<T>({ method: 'GET', url, params })
  }

  public async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ method: 'POST', url, data })
  }

  public async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data })
  }

  public async patch<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, data })
  }

  public async delete<T>(url: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', url })
  }

  // Upload file method
  public async upload<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(progress)
        }
      },
    })
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Add declaration for axios config metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number
    }
  }
}