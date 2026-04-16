import type { HttpClient, PaginatedResponse } from '../client'

export function createIotResources(client: HttpClient) {
  return {
    get devices() {
      return {
        async list(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<unknown>> {
          return client.request('/devices', { query: params })
        },
        async get(id: string) {
          return client.request(`/devices/${id}`)
        },
        async register(data: Record<string, unknown>) {
          return client.request('/devices', { method: 'POST', body: data })
        },
        async update(id: string, data: Record<string, unknown>) {
          return client.request(`/devices/${id}`, { method: 'PUT', body: data })
        },
        async deregister(id: string) {
          return client.request(`/devices/${id}`, { method: 'DELETE' })
        },
      }
    },

    get readings() {
      return {
        async list(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<unknown>> {
          return client.request('/readings', { query: params })
        },
        async get(id: string) {
          return client.request(`/readings/${id}`)
        },
        async submit(data: { device_id: string; metric: string; value: number; unit?: string; timestamp?: string }) {
          return client.request('/readings', { method: 'POST', body: data })
        },
      }
    },

    get alerts() {
      return {
        async list(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<unknown>> {
          return client.request('/alerts', { query: params })
        },
        async get(id: string) {
          return client.request(`/alerts/${id}`)
        },
        async acknowledge(id: string, data?: { notes?: string }) {
          return client.request(`/alerts/${id}/acknowledge`, { method: 'PUT', body: data })
        },
        async resolve(id: string, data: { resolution: string; root_cause?: string }) {
          return client.request(`/alerts/${id}/resolve`, { method: 'PUT', body: data })
        },
      }
    },
  }
}
