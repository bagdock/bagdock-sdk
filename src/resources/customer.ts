import type { HttpClient, PaginatedResponse } from '../client'

export function createCustomerResources(client: HttpClient) {
  return {
    get rentals() {
      return {
        async list(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<unknown>> {
          return client.request('/customer/rentals', { query: params })
        },
        async get(id: string) {
          return client.request(`/customer/rentals/${id}`)
        },
        async create(data: Record<string, unknown>) {
          return client.request('/customer/rentals', { method: 'POST', body: data })
        },
      }
    },

    get sessions() {
      return {
        async create(data: Record<string, unknown>) {
          return client.request('/checkout/sessions', { method: 'POST', body: data })
        },
        async list(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<unknown>> {
          return client.request('/checkout/sessions', { query: params })
        },
        async get(id: string) {
          return client.request(`/checkout/sessions/${id}`)
        },
      }
    },
  }
}
