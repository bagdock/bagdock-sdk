export interface BagdockConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
  maxRetries?: number
}

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

const DEFAULT_BASE_URL = 'https://api.bagdock.com/api/v1'
const DEFAULT_TIMEOUT = 30_000
const DEFAULT_MAX_RETRIES = 2
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])

export class HttpClient {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeout: number
  private readonly maxRetries: number

  constructor(config: BagdockConfig) {
    if (!config.apiKey) {
      throw new Error(
        'Missing API key. Pass it as `apiKey` or set the BAGDOCK_API_KEY environment variable.',
      )
    }
    this.apiKey = config.apiKey
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query, headers: extraHeaders, signal } = options

    const url = new URL(`${this.baseUrl}${path}`)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value))
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'bagdock-sdk/0.1.0',
      ...extraHeaders,
    }

    let lastError: Error | undefined
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
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

          if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < this.maxRetries) {
            const backoff = Math.min(1000 * 2 ** attempt, 8000)
            await sleep(backoff + Math.random() * 500)
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
