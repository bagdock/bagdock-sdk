import type { HttpClient, PaginatedResponse } from '../client'

export function createLoyaltyResources(client: HttpClient) {
  return {
    get members() {
      return {
        async create(data: { email: string; name: string; [key: string]: unknown }) {
          return client.request('/loyalty/members', { method: 'POST', body: data })
        },
        async get(id: string) {
          return client.request(`/loyalty/members/${id}`)
        },
        async list(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<unknown>> {
          return client.request('/loyalty/members', { query: params })
        },
      }
    },

    get points() {
      return {
        async balance(memberId: string) {
          return client.request('/loyalty/points/balance', { query: { member_id: memberId } })
        },
        async award(data: { member_id: string; points: number; reason: string; reference_id?: string }) {
          return client.request('/loyalty/points/award', { method: 'POST', body: data })
        },
        async redeem(data: { member_id: string; points: number; reward_id?: string }) {
          return client.request('/loyalty/points/redeem', { method: 'POST', body: data })
        },
        async history(memberId: string, params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<unknown>> {
          return client.request('/loyalty/points/history', { query: { member_id: memberId, ...params } })
        },
      }
    },

    get rewards() {
      return {
        async list(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<unknown>> {
          return client.request('/loyalty/rewards', { query: params })
        },
        async get(id: string) {
          return client.request(`/loyalty/rewards/${id}`)
        },
        async claim(data: { member_id: string; reward_id: string }) {
          return client.request('/loyalty/rewards/claim', { method: 'POST', body: data })
        },
      }
    },

    get referrals() {
      return {
        async create(data: { referrer_id: string; referee_email: string; message?: string }) {
          return client.request('/loyalty/referrals', { method: 'POST', body: data })
        },
        async list(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<unknown>> {
          return client.request('/loyalty/referrals', { query: params })
        },
        async get(id: string) {
          return client.request(`/loyalty/referrals/${id}`)
        },
      }
    },

    get links() {
      return {
        async create(data: { memberId: string; campaignId: string }) {
          return client.request('/loyalty/links', { method: 'POST', body: data })
        },
      }
    },
  }
}
