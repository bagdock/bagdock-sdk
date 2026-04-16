```
  ----++                                ----++                    ---+++     
  ---+++                                ---++                     ---++      
 ----+---     -----     ---------  --------++ ------     -----   ----++----- 
 ---------+ --------++----------++--------+++--------+ --------++---++---++++
 ---+++---++ ++++---++---+++---++---+++---++---+++---++---++---++------++++  
----++ ---++--------++---++----++---++ ---++---++ ---+---++     -------++    
----+----+---+++---++---++----++---++----++---++---+++--++ --------+---++   
---------++--------+++--------+++--------++ -------+++ -------++---++----++  
 +++++++++   +++++++++- +++---++   ++++++++    ++++++    ++++++  ++++  ++++  
                     --------+++                                             
                       +++++++                                               
```

# @bagdock/sdk

The official TypeScript SDK for the Bagdock API — manage facilities, contacts, tenancies, invoices, marketplace listings, loyalty programs, and IoT devices from any Node.js, Deno, Bun, or Cloudflare Workers environment.

[![npm version](https://img.shields.io/npm/v/@bagdock/sdk.svg)](https://www.npmjs.com/package/@bagdock/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Install

```bash
npm install @bagdock/sdk
```

```bash
yarn add @bagdock/sdk
```

```bash
pnpm add @bagdock/sdk
```

```bash
bun add @bagdock/sdk
```

## Quick start

```typescript
import { Bagdock } from '@bagdock/sdk'

const bagdock = new Bagdock({
  apiKey: process.env.BAGDOCK_API_KEY!,
})

// List operator facilities
const facilities = await bagdock.operator.facilities.list({
  page: 1,
  per_page: 20,
})

// Create a contact
const contact = await bagdock.operator.contacts.create({
  email: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Doe',
})

// Search marketplace locations
const locations = await bagdock.marketplace.locations.search({
  city: 'London',
  size: 'medium',
})
```

## API reference

### `bagdock.operator`

| Method | Description |
|--------|-------------|
| `facilities.list(params?)` | List facilities |
| `facilities.get(id)` | Get a facility |
| `facilities.create(data)` | Create a facility |
| `contacts.list(params?)` | List contacts |
| `contacts.get(id)` | Get a contact |
| `contacts.create(data)` | Create a contact |
| `companies.list(params?)` | List companies |
| `listings.list(params?)` | List listings |
| `listings.publish(id)` | Publish a listing |
| `tenancies.list(params?)` | List tenancies |
| `tenancies.terminate(id, data)` | Terminate a tenancy |
| `units.list(params?)` | List units |
| `invoices.list(params?)` | List invoices |
| `invoices.send(id)` | Send an invoice |
| `invoices.markPaid(id, data?)` | Mark an invoice as paid |
| `payments.list(params?)` | List payments |
| `payments.refund(id, data?)` | Refund a payment |
| `subscriptions.list(params?)` | List subscriptions |
| `subscriptions.cancel(id, data?)` | Cancel a subscription |
| `orders.list(params?)` | List orders |
| `orders.fulfill(id)` | Fulfill an order |

### `bagdock.marketplace`

| Method | Description |
|--------|-------------|
| `locations.search(params?)` | Search locations by city, size, features |
| `locations.get(id)` | Get a location |
| `listings.list(params?)` | List marketplace listings |
| `vendors.list(params?)` | List vendors |
| `vendors.register(data)` | Register a vendor |
| `rentals.create(data)` | Create a rental |
| `rentals.get(id)` | Get a rental |
| `availability.check(params)` | Check unit availability |
| `sync.trigger(data)` | Trigger a marketplace sync |

### `bagdock.loyalty`

| Method | Description |
|--------|-------------|
| `members.create(data)` | Create a loyalty member |
| `members.get(id)` | Get a member |
| `points.balance(memberId)` | Get points balance |
| `points.award(data)` | Award points |
| `points.redeem(data)` | Redeem points |
| `rewards.list(params?)` | List rewards |
| `rewards.claim(data)` | Claim a reward |
| `referrals.create(data)` | Create a referral |

### `bagdock.iot`

| Method | Description |
|--------|-------------|
| `devices.list(params?)` | List IoT devices |
| `devices.register(data)` | Register a device |
| `readings.list(params?)` | List sensor readings |
| `readings.submit(data)` | Submit a reading |
| `alerts.list(params?)` | List alerts |
| `alerts.acknowledge(id)` | Acknowledge an alert |

### `bagdock.webhooks`

| Method | Description |
|--------|-------------|
| `verifySignature(body, sig, ts, secret)` | Verify a webhook HMAC signature |
| `constructEvent(body, sig, ts, secret)` | Parse and verify a webhook event |

## Error handling

```typescript
import { Bagdock, BagdockApiError } from '@bagdock/sdk'

try {
  await bagdock.operator.contacts.get('con_nonexistent')
} catch (err) {
  if (err instanceof BagdockApiError) {
    console.error(`API error ${err.status}: ${err.code} — ${err.message}`)
    console.error(`Request ID: ${err.requestId}`)
  }
}
```

## Authentication

The SDK supports three authentication modes: API keys, OAuth access tokens, and OAuth2 client credentials.

### API key

The simplest approach for server-side applications. Create an API key in the Bagdock developer dashboard.

```typescript
const bagdock = new Bagdock({
  apiKey: process.env.BAGDOCK_API_KEY!,
})
```

### OAuth access token

Use an access token obtained from an external OAuth2 flow — ideal for connect webviews, MCP integrations, and apps where users authorize access to their Bagdock data.

```typescript
const bagdock = new Bagdock({
  accessToken: 'eyJhbGciOiJSUzI1NiIs...',
})
```

### Client credentials

For machine-to-machine integrations (CI/CD, AI agents, cron jobs, access control systems). The SDK automatically fetches, caches, and refreshes the access token.

```typescript
const bagdock = new Bagdock({
  clientId: 'oac_your_client_id',
  clientSecret: 'bdok_secret_your_secret',
  scopes: ['facilities:read', 'contacts:read'],
})
```

### OAuth2 helpers

The SDK exports standalone OAuth2/OIDC helpers for building authorization flows — useful for connect webviews that integrate external access control, security, or insurance platforms.

```typescript
import {
  generatePKCE,
  buildAuthorizeUrl,
  exchangeCode,
  refreshToken,
  revokeToken,
  deviceAuthorize,
  pollDeviceToken,
} from '@bagdock/sdk'

// Authorization Code + PKCE flow
const pkce = await generatePKCE()

const authorizeUrl = buildAuthorizeUrl({
  clientId: 'oac_your_client_id',
  redirectUri: 'https://your-app.com/callback',
  codeChallenge: pkce.codeChallenge,
  scope: 'openid contacts:read facilities:read',
  state: 'random-state-value',
})

// After redirect, exchange the code for tokens
const tokens = await exchangeCode({
  clientId: 'oac_your_client_id',
  clientSecret: 'bdok_secret_your_secret',
  code: 'authorization_code_from_callback',
  redirectUri: 'https://your-app.com/callback',
  codeVerifier: pkce.codeVerifier,
})

// Refresh an expired token
const newTokens = await refreshToken({
  clientId: 'oac_your_client_id',
  refreshToken: tokens.refresh_token!,
})

// Device code flow (CLI / IoT)
const device = await deviceAuthorize({
  clientId: 'bagdock-cli',
  scope: 'developer:read developer:write',
})
console.log(`Open ${device.verification_uri} and enter: ${device.user_code}`)
const deviceTokens = await pollDeviceToken({
  clientId: 'bagdock-cli',
  deviceCode: device.device_code,
  interval: device.interval,
})
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | — | API key authentication |
| `accessToken` | `string` | — | OAuth access token authentication |
| `clientId` | `string` | — | OAuth2 client ID (requires `clientSecret`) |
| `clientSecret` | `string` | — | OAuth2 client secret |
| `scopes` | `string[]` | — | Scopes for client credentials grant |
| `baseUrl` | `string` | `https://api.bagdock.com/api/v1` | API base URL |
| `timeout` | `number` | `30000` | Request timeout in ms |
| `maxRetries` | `number` | `3` | Max retry attempts for transient errors (capped at 5) |

### Retries

The SDK automatically retries failed requests on network errors and 5xx responses using exponential backoff with jitter:

```
delay = min(1000 × 2^attempt, 8000) + random(0–500ms)
```

| Attempt | Base delay | Max total delay |
|---------|-----------|-----------------|
| 1st retry | ~1 000 ms | ~1 500 ms |
| 2nd retry | ~2 000 ms | ~2 500 ms |
| 3rd retry | ~4 000 ms | ~4 500 ms |
| 4th retry | ~8 000 ms | ~8 500 ms |

**Defaults by resource type:**

| Resource | Default `maxRetries` |
|----------|---------------------|
| All resources | 3 |
| IoT / Agent API (`bagdock.iot.*`) | 4 — sensor and gateway connections are inherently flaky |

**Rate limits:** 429 responses are retried and respect the `Retry-After` header when present. Each 429 retry counts against your retry budget.

**Hard cap:** `maxRetries` is clamped to **5** regardless of the configured value. This prevents misconfigured clients from accidentally hammering the API.

**Override per-client:**

```typescript
const bagdock = new Bagdock({
  apiKey: process.env.BAGDOCK_API_KEY!,
  maxRetries: 0, // disable retries entirely
})
```

**Override per-request:**

```typescript
await bagdock.iot.devices.list(params, {
  maxRetries: 5,
})
```

To disable retries for a specific request without changing the client default:

```typescript
await bagdock.operator.invoices.send(id, {
  maxRetries: 0,
})
```

## Real-time subscriptions

> **Coming soon** — WebSocket-based real-time subscriptions for live dashboards, occupancy tracking, and IoT event streams. See [`@bagdock/types`](https://www.npmjs.com/package/@bagdock/types) for the shared type contracts that will power real-time payloads.

## Documentation

- [Full documentation](https://bagdock.com/docs)
- [TypeScript SDK quickstart](https://bagdock.com/docs/sdks/typescript)
- [API reference](https://bagdock.com/docs/api)
- [OAuth2 / OIDC guide](https://bagdock.com/docs/auth/oauth2)

## License

MIT — see [LICENSE](LICENSE)
