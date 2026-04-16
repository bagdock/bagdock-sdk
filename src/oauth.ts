const DEFAULT_ISSUER = 'https://api.bagdock.com'
const DEVICE_CODE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OAuthEndpoints {
  issuer?: string
  tokenEndpoint?: string
  authorizeEndpoint?: string
  deviceAuthorizeEndpoint?: string
  revokeEndpoint?: string
  introspectEndpoint?: string
  userinfoEndpoint?: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  id_token?: string
  scope?: string
}

export interface DeviceAuthResponse {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete?: string
  expires_in: number
  interval: number
}

export interface IntrospectionResponse {
  active: boolean
  sub?: string
  client_id?: string
  scope?: string
  exp?: number
  iat?: number
  iss?: string
  token_type?: string
}

export interface UserinfoResponse {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  preferred_username?: string
  picture?: string
  operator_id?: string
  operator_slug?: string
  scopes?: string[]
}

export interface PKCEPair {
  codeVerifier: string
  codeChallenge: string
}

export interface AuthorizeUrlParams {
  clientId: string
  redirectUri: string
  scope?: string
  state?: string
  codeChallenge: string
  codeChallengeMethod?: string
}

export interface ExchangeCodeParams {
  clientId: string
  clientSecret?: string
  code: string
  redirectUri: string
  codeVerifier: string
}

export interface RefreshTokenParams {
  clientId: string
  clientSecret?: string
  refreshToken: string
}

export interface RevokeTokenParams {
  token: string
  tokenTypeHint?: 'access_token' | 'refresh_token'
  clientId?: string
  clientSecret?: string
}

export interface IntrospectParams {
  token: string
  tokenTypeHint?: 'access_token' | 'refresh_token'
}

export interface DeviceAuthorizeParams {
  clientId: string
  scope?: string
}

export interface PollDeviceTokenParams {
  clientId: string
  clientSecret?: string
  deviceCode: string
  interval?: number
  timeout?: number
}

// ---------------------------------------------------------------------------
// Resolve endpoints from issuer (or use defaults)
// ---------------------------------------------------------------------------

function resolveEndpoints(opts?: OAuthEndpoints) {
  const issuer = (opts?.issuer ?? DEFAULT_ISSUER).replace(/\/+$/, '')
  return {
    token: opts?.tokenEndpoint ?? `${issuer}/oauth2/token`,
    authorize: opts?.authorizeEndpoint ?? `${issuer}/oauth2/authorize`,
    deviceAuthorize: opts?.deviceAuthorizeEndpoint ?? `${issuer}/oauth2/device/authorize`,
    revoke: opts?.revokeEndpoint ?? `${issuer}/oauth2/token/revoke`,
    introspect: opts?.introspectEndpoint ?? `${issuer}/oauth2/token/introspect`,
    userinfo: opts?.userinfoEndpoint ?? `${issuer}/oauth2/userinfo`,
  }
}

// ---------------------------------------------------------------------------
// PKCE helpers (RFC 7636)
// ---------------------------------------------------------------------------

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function generatePKCE(): Promise<PKCEPair> {
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  const codeVerifier = base64UrlEncode(randomBytes.buffer as ArrayBuffer)

  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier))
  const codeChallenge = base64UrlEncode(digest)

  return { codeVerifier, codeChallenge }
}

// ---------------------------------------------------------------------------
// Authorization URL builder
// ---------------------------------------------------------------------------

export function buildAuthorizeUrl(
  params: AuthorizeUrlParams,
  endpoints?: OAuthEndpoints,
): string {
  const ep = resolveEndpoints(endpoints)
  const url = new URL(ep.authorize)
  url.searchParams.set('client_id', params.clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('code_challenge', params.codeChallenge)
  url.searchParams.set('code_challenge_method', params.codeChallengeMethod ?? 'S256')
  if (params.scope) url.searchParams.set('scope', params.scope)
  if (params.state) url.searchParams.set('state', params.state)
  return url.toString()
}

// ---------------------------------------------------------------------------
// Token exchange helpers
// ---------------------------------------------------------------------------

async function postForm<T = Record<string, unknown>>(
  url: string,
  body: Record<string, string>,
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  })
  const json = (await response.json()) as Record<string, unknown>
  if (!response.ok) {
    const errMsg = (json.error_description as string) ?? (json.error as string) ?? `HTTP ${response.status}`
    throw new OAuthError(
      errMsg,
      (json.error as string) ?? 'oauth_error',
      response.status,
    )
  }
  return json as T
}

export class OAuthError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'OAuthError'
    this.code = code
    this.status = status
  }
}

export async function exchangeCode(
  params: ExchangeCodeParams,
  endpoints?: OAuthEndpoints,
): Promise<TokenResponse> {
  const ep = resolveEndpoints(endpoints)
  const body: Record<string, string> = {
    grant_type: 'authorization_code',
    client_id: params.clientId,
    code: params.code,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  }
  if (params.clientSecret) body.client_secret = params.clientSecret
  return postForm<TokenResponse>(ep.token, body)
}

export async function refreshToken(
  params: RefreshTokenParams,
  endpoints?: OAuthEndpoints,
): Promise<TokenResponse> {
  const ep = resolveEndpoints(endpoints)
  const body: Record<string, string> = {
    grant_type: 'refresh_token',
    client_id: params.clientId,
    refresh_token: params.refreshToken,
  }
  if (params.clientSecret) body.client_secret = params.clientSecret
  return postForm<TokenResponse>(ep.token, body)
}

export async function revokeToken(
  params: RevokeTokenParams,
  endpoints?: OAuthEndpoints,
): Promise<void> {
  const ep = resolveEndpoints(endpoints)
  const body: Record<string, string> = { token: params.token }
  if (params.tokenTypeHint) body.token_type_hint = params.tokenTypeHint
  if (params.clientId) body.client_id = params.clientId
  if (params.clientSecret) body.client_secret = params.clientSecret

  const response = await fetch(ep.revoke, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  })
  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>
    throw new OAuthError(
      (json.error_description as string) ?? 'Revocation failed',
      (json.error as string) ?? 'revocation_error',
      response.status,
    )
  }
}

export async function introspectToken(
  params: IntrospectParams,
  endpoints?: OAuthEndpoints,
): Promise<IntrospectionResponse> {
  const ep = resolveEndpoints(endpoints)
  const body: Record<string, string> = { token: params.token }
  if (params.tokenTypeHint) body.token_type_hint = params.tokenTypeHint
  return postForm<IntrospectionResponse>(ep.introspect, body)
}

export async function getUserinfo(
  accessToken: string,
  endpoints?: OAuthEndpoints,
): Promise<UserinfoResponse> {
  const ep = resolveEndpoints(endpoints)
  const response = await fetch(ep.userinfo, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    throw new OAuthError('Failed to fetch userinfo', 'userinfo_error', response.status)
  }
  return response.json() as Promise<UserinfoResponse>
}

// ---------------------------------------------------------------------------
// Device Authorization Grant (RFC 8628)
// ---------------------------------------------------------------------------

export async function deviceAuthorize(
  params: DeviceAuthorizeParams,
  endpoints?: OAuthEndpoints,
): Promise<DeviceAuthResponse> {
  const ep = resolveEndpoints(endpoints)
  const body: Record<string, string> = { client_id: params.clientId }
  if (params.scope) body.scope = params.scope
  return postForm<DeviceAuthResponse>(ep.deviceAuthorize, body)
}

export async function pollDeviceToken(
  params: PollDeviceTokenParams,
  endpoints?: OAuthEndpoints,
): Promise<TokenResponse> {
  const ep = resolveEndpoints(endpoints)
  const interval = (params.interval ?? 5) * 1000
  const deadline = Date.now() + (params.timeout ?? 600) * 1000

  while (Date.now() < deadline) {
    await new Promise<void>((r) => setTimeout(r, interval))
    try {
      const body: Record<string, string> = {
        grant_type: DEVICE_CODE_GRANT_TYPE,
        client_id: params.clientId,
        device_code: params.deviceCode,
      }
      if (params.clientSecret) body.client_secret = params.clientSecret
      return await postForm<TokenResponse>(ep.token, body)
    } catch (err) {
      if (err instanceof OAuthError) {
        if (err.code === 'authorization_pending') continue
        if (err.code === 'slow_down') {
          await new Promise<void>((r) => setTimeout(r, 5000))
          continue
        }
      }
      throw err
    }
  }

  throw new OAuthError('Device authorization timed out', 'expired_token', 408)
}

// ---------------------------------------------------------------------------
// Client Credentials token manager (used internally by HttpClient)
// ---------------------------------------------------------------------------

export interface ClientCredentialsConfig {
  clientId: string
  clientSecret: string
  scopes?: string[]
  endpoints?: OAuthEndpoints
}

export class OAuthTokenManager {
  private readonly config: ClientCredentialsConfig
  private readonly tokenUrl: string
  private accessToken: string | null = null
  private expiresAt = 0

  constructor(config: ClientCredentialsConfig) {
    this.config = config
    this.tokenUrl = resolveEndpoints(config.endpoints).token
  }

  async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAt) {
      return this.accessToken
    }
    return this.fetchToken()
  }

  invalidate(): void {
    this.accessToken = null
    this.expiresAt = 0
  }

  private async fetchToken(): Promise<string> {
    const body: Record<string, string> = {
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    }
    if (this.config.scopes?.length) {
      body.scope = this.config.scopes.join(' ')
    }

    const data = await postForm<TokenResponse>(this.tokenUrl, body)
    this.accessToken = data.access_token
    // Refresh 60 seconds before actual expiry
    this.expiresAt = Date.now() + (data.expires_in - 60) * 1000
    return this.accessToken
  }
}
