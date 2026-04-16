import { OAuthTokenManager, type OAuthEndpoints } from './oauth'

// ---------------------------------------------------------------------------
// Config — three auth modes
// ---------------------------------------------------------------------------

export interface BaseConfig {
  baseUrl?: string
  timeout?: number
  maxRetries?: number
}

export interface ApiKeyAuth extends BaseConfig {
  apiKey: string
}

export interface AccessTokenAuth extends BaseConfig {
  accessToken: string
}

export interface ClientCredentialsAuth extends BaseConfig {
  clientId: string
  clientSecret: string
  scopes?: string[]
  oauthEndpoints?: OAuthEndpoints
}

export type BagdockConfig = ApiKeyAuth | AccessTokenAuth | ClientCredentialsAuth

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isApiKeyAuth(c: BagdockConfig): c is ApiKeyAuth {
  return 'apiKey' in c && typeof (c as ApiKeyAuth).apiKey === 'string'
}

export function isAccessTokenAuth(c: BagdockConfig): c is AccessTokenAuth {
  return 'accessToken' in c && typeof (c as AccessTokenAuth).accessToken === 'string'
}

export function isClientCredentialsAuth(c: BagdockConfig): c is ClientCredentialsAuth {
  return 'clientId' in c && 'clientSecret' in c
}

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
  signal?: AbortSignal
}

export interface PaginatedResponse<T> {
  object: 'list'
  data: T[]
  has_more: boolean
  total_count?: number
}

export interface ApiError {
  status: number
  code: string
  message: string
  request_id?: string
}

export class BagdockApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId?: string

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'BagdockApiError'
    this.status = error.status
    this.code = error.code
    this.requestId = error.request_id
  }
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'https://api.bagdock.com/api/v1'
const DEFAULT_TIMEOUT = 30_000
const DEFAULT_MAX_RETRIES = 3
const MAX_RETRY_CAP = 5
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])

// ---------------------------------------------------------------------------
// HTTP Client
// ---------------------------------------------------------------------------

export class HttpClient {
  private readonly baseUrl: string
  private readonly timeout: number
  private readonly maxRetries: number
  private readonly authMode: 'api_key' | 'access_token' | 'client_credentials'
  private readonly staticToken: string | null
  private readonly tokenManager: OAuthTokenManager | null

  constructor(config: BagdockConfig) {
    if (isApiKeyAuth(config)) {
      if (!config.apiKey) {
        throw new Error(
          'Missing API key. Pass it as `apiKey` or set the BAGDOCK_API_KEY environment variable.',
        )
      }
      this.authMode = 'api_key'
      this.staticToken = config.apiKey
      this.tokenManager = null
    } else if (isAccessTokenAuth(config)) {
      if (!config.accessToken) {
        throw new Error('Missing access token. Pass it as `accessToken`.')
      }
      this.authMode = 'access_token'
      this.staticToken = config.accessToken
      this.tokenManager = null
    } else if (isClientCredentialsAuth(config)) {
      if (!config.clientId || !config.clientSecret) {
        throw new Error('Missing clientId or clientSecret for client credentials auth.')
      }
      this.authMode = 'client_credentials'
      this.staticToken = null
      this.tokenManager = new OAuthTokenManager({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        scopes: config.scopes,
        endpoints: config.oauthEndpoints,
      })
    } else {
      throw new Error(
        'Invalid config. Provide one of: apiKey, accessToken, or clientId + clientSecret.',
      )
    }

    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT
    this.maxRetries = Math.min(config.maxRetries ?? DEFAULT_MAX_RETRIES, MAX_RETRY_CAP)
  }

  private async resolveToken(): Promise<string> {
    if (this.staticToken) return this.staticToken
    return this.tokenManager!.getToken()
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query, headers: extraHeaders, signal } = options

    const url = new URL(`${this.baseUrl}${path}`)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value))
      }
    }

    let lastError: Error | undefined
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const token = await this.resolveToken()
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'bagdock-sdk/0.1.0',
          ...extraHeaders,
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        const response = await fetch(url.toString(), {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: signal ?? controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>
          const apiError: ApiError = {
            status: response.status,
            code: (errorBody.code as string) ?? 'unknown_error',
            message: (errorBody.message as string) ?? `Request failed with status ${response.status}`,
            request_id: (errorBody.request_id as string) ?? response.headers.get('x-request-id') ?? undefined,
          }

          // On 401 with client credentials, invalidate cached token and retry once
          if (response.status === 401 && this.tokenManager && attempt < this.maxRetries) {
            this.tokenManager.invalidate()
            continue
          }

          if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < this.maxRetries) {
            let backoff = Math.min(1000 * 2 ** attempt, 8000) + Math.random() * 500
            if (response.status === 429) {
              const retryAfter = response.headers.get('retry-after')
              if (retryAfter) {
                const seconds = Number(retryAfter)
                if (!Number.isNaN(seconds)) backoff = seconds * 1000
              }
            }
            await sleep(backoff)
            lastError = new BagdockApiError(apiError)
            continue
          }

          throw new BagdockApiError(apiError)
        }

        if (response.status === 204) return undefined as T

        return (await response.json()) as T
      } catch (err) {
        if (err instanceof BagdockApiError) throw err
        lastError = err as Error
        if (attempt < this.maxRetries) {
          const backoff = Math.min(1000 * 2 ** attempt, 8000)
          await sleep(backoff + Math.random() * 500)
          continue
        }
      }
    }

    throw lastError ?? new Error('Request failed after retries')
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
