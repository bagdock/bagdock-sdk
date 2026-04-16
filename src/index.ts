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

export {
  BagdockApiError,
  isApiKeyAuth,
  isAccessTokenAuth,
  isClientCredentialsAuth,
  type BagdockConfig,
  type ApiKeyAuth,
  type AccessTokenAuth,
  type ClientCredentialsAuth,
  type BaseConfig,
  type PaginatedResponse,
  type ApiError,
} from './client'

export {
  generatePKCE,
  buildAuthorizeUrl,
  exchangeCode,
  refreshToken,
  revokeToken,
  introspectToken,
  getUserinfo,
  deviceAuthorize,
  pollDeviceToken,
  OAuthError,
  OAuthTokenManager,
  type OAuthEndpoints,
  type TokenResponse,
  type DeviceAuthResponse,
  type IntrospectionResponse,
  type UserinfoResponse,
  type PKCEPair,
  type AuthorizeUrlParams,
  type ExchangeCodeParams,
  type RefreshTokenParams,
  type RevokeTokenParams,
  type IntrospectParams,
  type DeviceAuthorizeParams,
  type PollDeviceTokenParams,
  type ClientCredentialsConfig,
} from './oauth'

export type { Bagdock as BagdockClient }
