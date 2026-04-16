const encoder = new TextEncoder()

export function createWebhookHelpers() {
  return {
    async verifySignature(
      rawBody: string,
      signature: string,
      timestamp: string,
      secret: string,
    ): Promise<boolean> {
      const expected = await computeHmac(secret, `${timestamp}.${rawBody}`)
      const expectedHex = `sha256=${expected}`
      return timingSafeEqual(expectedHex, signature)
    },

    constructEvent(
      rawBody: string,
      signature: string,
      timestamp: string,
      secret: string,
      tolerance = 300,
    ) {
      const ts = parseInt(timestamp, 10)
      if (Number.isNaN(ts)) {
        throw new Error('Invalid webhook timestamp')
      }

      const age = Math.floor(Date.now() / 1000) - ts
      if (age > tolerance) {
        throw new Error(`Webhook timestamp too old (${age}s > ${tolerance}s)`)
      }

      return {
        verified: true,
        event: JSON.parse(rawBody) as {
          id: string
          type: string
          created_at: string
          data: Record<string, unknown>
        },
      }
    },
  }
}

async function computeHmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}
