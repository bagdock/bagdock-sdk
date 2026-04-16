import { HttpClient, type BagdockConfig } from './client'
import { createOperatorResources } from './resources/operator'
import { createMarketplaceResources } from './resources/marketplace'
import { createCustomerResources } from './resources/customer'
import { createLoyaltyResources } from './resources/loyalty'
import { createIotResources } from './resources/iot'
import { createWebhookHelpers } from './resources/webhooks'

export class Bagdock {
  private readonly client: HttpClient

  readonly operator: ReturnType<typeof createOperatorResources>
  readonly marketplace: ReturnType<typeof createMarketplaceResources>
  readonly customer: ReturnType<typeof createCustomerResources>
  readonly loyalty: ReturnType<typeof createLoyaltyResources>
  readonly iot: ReturnType<typeof createIotResources>
  readonly webhooks: ReturnType<typeof createWebhookHelpers>

  constructor(config: BagdockConfig) {
    this.client = new HttpClient(config)
    this.operator = createOperatorResources(this.client)
    this.marketplace = createMarketplaceResources(this.client)
    this.customer = createCustomerResources(this.client)
    this.loyalty = createLoyaltyResources(this.client)
    this.iot = createIotResources(this.client)
    this.webhooks = createWebhookHelpers()
  }
}

export { BagdockApiError, type BagdockConfig, type PaginatedResponse, type ApiError } from './client'
export type { Bagdock as BagdockClient }
