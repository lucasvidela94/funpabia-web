import { env } from 'cloudflare:workers'
import { getRequestHeader } from '@tanstack/react-start/server'
import { z } from 'zod'

// Fixed-window limits per client for public forms (spec 6.2: "límite de envíos por IP", no
// captchas). Server only. Counts live in D1 in the `rate_limit` table that Better Auth also uses
// for sign-in; keys here start with "form:" so they never meet its keys. For these rows,
// `last_request` holds the start of the current window.
//
// The IP is hashed before it is stored: an IP address is personal data (Ley 25.326) and the
// counter only needs to tell clients apart.

async function clientKey(scope: string) {
  const ip = getRequestHeader('cf-connecting-ip') ?? 'unknown'
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${scope}|${ip}`))
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')

  return `form:${scope}:${hex}`
}

// True when this request is within the limit. Counting and checking happen in one statement, so
// two requests at the same time cannot both slip under it.
export async function allowRequest(scope: string, max: number, windowSeconds: number) {
  const key = await clientKey(scope)
  const now = Math.floor(Date.now() / 1000)

  const row = await env.DB.prepare(
    `INSERT INTO rate_limit (id, key, count, last_request) VALUES (?, ?, 1, ?)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN ?3 - last_request >= ?4 THEN 1 ELSE count + 1 END,
       last_request = CASE WHEN ?3 - last_request >= ?4 THEN ?3 ELSE last_request END
     RETURNING count`,
  )
    .bind(crypto.randomUUID(), key, now, windowSeconds)
    .first()

  return z.object({ count: z.number() }).parse(row).count <= max
}
