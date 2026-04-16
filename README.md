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

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | — | **Required.** Your Bagdock API key |
| `baseUrl` | `string` | `https://api.bagdock.com/api/v1` | API base URL |
| `timeout` | `number` | `30000` | Request timeout in ms |
| `maxRetries` | `number` | `2` | Max retry attempts for transient errors |

## License

MIT — see [LICENSE](LICENSE)
