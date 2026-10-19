import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { TokenError } from './errors'
import { hashToken, newTokenValue } from './token'

// Token management for the panel screen (docs/spec/api-rest.md, section 5). Tokens belong to a
// municipality or admin user; the value leaves the server only in the creation response.

// Roles that may hold a token: the integrator (municipality) and the foundation itself (admin).
const ELIGIBLE_ROLES = new Set(['municipality', 'admin'])

const listSchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    owner_name: z.string(),
    owner_email: z.string(),
    name: z.string(),
    scopes: z.string(),
    expires_at: z.string(),
    discarded_at: z.string().nullable(),
    created_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    userId: row.user_id,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    name: row.name,
    scopes: row.scopes,
    expiresAt: row.expires_at,
    revoked: row.discarded_at !== null,
    createdAt: row.created_at,
  }))

export async function selectTokens() {
  const { results } = await env.DB.prepare(
    `SELECT t.id, t.user_id, u.name AS owner_name, u.email AS owner_email,
       t.name, t.scopes, t.expires_at, t.discarded_at, t.created_at
     FROM api_token t JOIN app_user u ON u.id = t.user_id
     ORDER BY t.discarded_at IS NOT NULL, t.created_at DESC`,
  ).all()

  return z.array(listSchema).parse(results)
}

const ownerSchema = z.object({ role: z.string(), discarded_at: z.string().nullable() })

// Tokens expire 12 months after creation (docs/spec/api-rest.md [SUPUESTO]).
export async function insertToken(input: { userId: string; name: string }) {
  const owner = await env.DB.prepare('SELECT role, discarded_at FROM app_user WHERE id = ?')
    .bind(input.userId)
    .first()

  if (!owner) {
    throw new TokenError('Esa usuaria ya no existe.')
  }

  const parsed = ownerSchema.parse(owner)

  if (parsed.discarded_at) {
    throw new TokenError('Esa usuaria está dada de baja.')
  }

  if (!ELIGIBLE_ROLES.has(parsed.role)) {
    throw new TokenError('El token es para el Municipio o para la comisión.')
  }

  const value = newTokenValue()
  const id = crypto.randomUUID()
  const at = new Date().toISOString()
  const expires = new Date(at)

  expires.setUTCFullYear(expires.getUTCFullYear() + 1)

  await env.DB.prepare(
    `INSERT INTO api_token (id, user_id, name, token_hash, scopes, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, '["agenda-events:write"]', ?, ?, ?)`,
  )
    .bind(
      id,
      input.userId,
      input.name.trim(),
      await hashToken(value),
      expires.toISOString(),
      at,
      at,
    )
    .run()

  return { id, value, expiresAt: expires.toISOString() }
}

export async function revokeToken(id: string) {
  const at = new Date().toISOString()

  const result = await env.DB.prepare(
    'UPDATE api_token SET discarded_at = ?, updated_at = ? WHERE id = ? AND discarded_at IS NULL',
  )
    .bind(at, at, id)
    .run()

  if (result.meta.changes === 0) {
    throw new TokenError('Ese token ya no existe o ya fue revocado.')
  }
}
