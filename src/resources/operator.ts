import type { HttpClient, PaginatedResponse } from '../client'

interface ListParams {
  page?: number
  per_page?: number
  sort?: string
  [key: string]: string | number | boolean | undefined
}

function buildResource<T>(client: HttpClient, basePath: string) {
  return {
    async list(params?: ListParams): Promise<PaginatedResponse<T>> {
      return client.request<PaginatedResponse<T>>(basePath, { query: params })
    },

    async get(id: string): Promise<T> {
      return client.request<T>(`${basePath}/${id}`)
    },

    async create(data: Partial<T>): Promise<T> {
      return client.request<T>(basePath, { method: 'POST', body: data })
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      return client.request<T>(`${basePath}/${id}`, { method: 'PATCH', body: data })
    },

    async delete(id: string): Promise<void> {
      return client.request<void>(`${basePath}/${id}`, { method: 'DELETE' })
    },
  }
}

export function createOperatorResources(client: HttpClient) {
  return {
    get facilities() { return buildResource(client, '/operator/facilities') },
    get contacts() { return buildResource(client, '/operator/contacts') },
    get companies() { return buildResource(client, '/operator/companies') },
    get listings() {
      const base = buildResource(client, '/operator/listings')
      return {
        ...base,
        async publish(id: string) {
          return client.request(`/operator/listings/${id}/publish`, { method: 'POST' })
        },
      }
    },
    get tenancies() {
      const base = buildResource(client, '/operator/tenancies')
      return {
        ...base,
        async terminate(id: string, data: { reason: string; effective_date: string }) {
          return client.request(`/operator/tenancies/${id}/terminate`, { method: 'POST', body: data })
        },
      }
    },
    get units() { return buildResource(client, '/operator/units') },
    get unitTypes() { return buildResource(client, '/operator/unit-types') },
    get invoices() {
      const base = buildResource(client, '/operator/invoices')
      return {
        ...base,
        async send(id: string) {
          return client.request(`/operator/invoices/${id}/send`, { method: 'POST' })
        },
        async markPaid(id: string, data?: { payment_method?: string; payment_reference?: string }) {
          return client.request(`/operator/invoices/${id}/mark-paid`, { method: 'POST', body: data })
        },
      }
    },
    get orders() {
      const base = buildResource(client, '/operator/orders')
      return {
        ...base,
        async fulfill(id: string) {
          return client.request(`/operator/orders/${id}/fulfill`, { method: 'POST' })
        },
      }
    },
    get payments() {
      const base = buildResource(client, '/operator/payments')
      return {
        ...base,
        async refund(id: string, data?: { amount?: number; reason: string }) {
          return client.request(`/operator/payments/${id}/refund`, { method: 'POST', body: data })
        },
      }
    },
    get subscriptions() {
      const base = buildResource(client, '/operator/subscriptions')
      return {
        ...base,
        async cancel(id: string, data?: { reason?: string; effective_date?: string; cancel_immediately?: boolean }) {
          return client.request(`/operator/subscriptions/${id}/cancel`, { method: 'POST', body: data })
        },
      }
    },
    get products() { return buildResource(client, '/operator/products') },
    get tickets() { return buildResource(client, '/operator/tickets') },
    get conversations() { return buildResource(client, '/operator/conversations') },
    get identityVerifications() { return buildResource(client, '/operator/identity-verifications') },
    get accessControl() { return buildResource(client, '/operator/access-control') },
    get moveEvents() { return buildResource(client, '/operator/move-events') },
    get pricingPlans() { return buildResource(client, '/operator/pricing-plans') },
    get images() { return buildResource(client, '/operator/images') },
    get videos() { return buildResource(client, '/operator/videos') },
  }
}
