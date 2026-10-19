import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { ApiError } from './errors'

// Bearer tokens for the public API (docs/spec/api-rest.md, section 5). Only the SHA-256 hash is
// stored; the value is shown once at creation and never logged. Roles that may hold a token:
// municipality (the integrator) and admin (the foundation itself).

const TOKEN_PREFIX = 'fnp_'

const TOKEN_ROLES = new Set(['municipality', 'admin', 'superadmin'])

export type VerifiedToken = { id: string; userId: string; scopes: string[] }

export function newTokenValue() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))

  const base64 = btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')

  return `${TOKEN_PREFIX}${base64}`
}

export async function hashToken(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))

  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')

  return hex
}

const rowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  scopes: z.string(),
  expires_at: z.string(),
  discarded_at: z.string().nullable(),
  user_discarded_at: z.string().nullable(),
  role: z.string(),
})

function parseScopes(raw: string) {
  try {
    return z.array(z.string()).parse(JSON.parse(raw))
  } catch {
    throw new ApiError(500, 'internal_error', 'Something went wrong.')
  }
}

export async function verifyToken(request: Request, scope: string): Promise<VerifiedToken> {
  const header = request.headers.get('authorization')
  const value = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''

  if (!value.startsWith(TOKEN_PREFIX)) {
    throw new ApiError(401, 'unauthorized', 'A valid Bearer token is required.')
  }

  const row = await env.DB.prepare(
    `SELECT t.id, t.user_id, t.scopes, t.expires_at, t.discarded_at,
       u.discarded_at AS user_discarded_at, u.role
     FROM api_token t JOIN app_user u ON u.id = t.user_id
     WHERE t.token_hash = ?`,
  )
    .bind(await hashToken(value))
    .first()

  if (!row) {
    throw new ApiError(401, 'unauthorized', 'Unknown or revoked token.')
  }

  const token = rowSchema.parse(row)

  if (token.discarded_at || token.expires_at <= new Date().toISOString()) {
    throw new ApiError(401, 'unauthorized', 'Unknown or revoked token.')
  }

  if (token.user_discarded_at) {
    throw new ApiError(401, 'unauthorized', 'Unknown or revoked token.')
  }

  if (!TOKEN_ROLES.has(token.role)) {
    throw new ApiError(403, 'forbidden', 'This token no longer has access.')
  }

  const scopes = parseScopes(token.scopes)

  if (!scopes.includes(scope)) {
    throw new ApiError(403, 'forbidden', 'This token cannot do that.')
  }

  return { id: token.id, userId: token.user_id, scopes }
}
