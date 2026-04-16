import type { HttpClient, PaginatedResponse } from '../client'

interface SearchParams {
  city?: string
  size?: string
  price_min?: number
  price_max?: number
  features?: string[]
  sort?: string
  page?: number
  per_page?: number
  [key: string]: string | number | boolean | string[] | undefined
}

export function createMarketplaceResources(client: HttpClient) {
  return {
    get locations() {
      return {
        async search(params?: SearchParams): Promise<PaginatedResponse<unknown>> {
          const query: Record<string, string | number | boolean | undefined> = {}
          if (params) {
            for (const [key, value] of Object.entries(params)) {
              if (value === undefined) continue
              query[key] = Array.isArray(value) ? value.join(',') : value as string | number | boolean
            }
          }
          return client.request('/marketplace/locations', { query })
        },
        async get(id: string) {
          return client.request(`/marketplace/locations/${id}`)
        },
      }
    },

    get listings() {
      return {
        async list(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<unknown>> {
          return client.request('/marketplace/listings', { query: params })
        },
        async get(id: string) {
          return client.request(`/marketplace/listings/${id}`)
        },
      }
    },

    get vendors() {
      return {
        async list(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<unknown>> {
          return client.request('/marketplace/vendors', { query: params })
        },
        async get(id: string) {
          return client.request(`/marketplace/vendors/${id}`)
        },
        async register(data: Record<string, unknown>) {
          return client.request('/marketplace/vendors', { method: 'POST', body: data })
        },
      }
    },

    get rentals() {
      return {
        async list(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<unknown>> {
          return client.request('/marketplace/rentals', { query: params })
        },
        async get(id: string) {
          return client.request(`/marketplace/rentals/${id}`)
        },
        async create(data: Record<string, unknown>) {
          return client.request('/marketplace/rentals', { method: 'POST', body: data })
        },
      }
    },

    get search() {
      return {
        async query(params: SearchParams): Promise<PaginatedResponse<unknown>> {
          const query: Record<string, string | number | boolean | undefined> = {}
          for (const [key, value] of Object.entries(params)) {
            if (value === undefined) continue
            query[key] = Array.isArray(value) ? value.join(',') : value as string | number | boolean
          }
          return client.request('/marketplace/search', { query })
        },
      }
    },

    get availability() {
      return {
        async check(params: { facility_id?: string; unit_type_id?: string; date?: string }) {
          return client.request('/marketplace/availability', { query: params })
        },
      }
    },

    get sync() {
      return {
        async trigger(data: { operator_id: string; scope?: string }) {
          return client.request('/marketplace/sync', { method: 'POST', body: data })
        },
        async status(syncId: string) {
          return client.request(`/marketplace/sync/${syncId}`)
        },
      }
    },
  }
}
