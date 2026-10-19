import { env } from 'cloudflare:workers'
import { z } from 'zod'

// Fixed-window counters in the shared `rate_limit` table, the same one Better Auth and the
// public forms use. Keys here start with "api:" so they never meet other counters. `last_request`
// holds the start of the current window.

const counterSchema = z.object({ count: z.number(), last_request: z.number() })

export async function checkRateLimit(key: string, max: number, windowSeconds: number) {
  const now = Math.floor(Date.now() / 1000)

  const row = await env.DB.prepare(
    `INSERT INTO rate_limit (id, key, count, last_request) VALUES (?, ?, 1, ?)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN ?3 - last_request >= ?4 THEN 1 ELSE count + 1 END,
       last_request = CASE WHEN ?3 - last_request >= ?4 THEN ?3 ELSE last_request END
     RETURNING count, last_request`,
  )
    .bind(crypto.randomUUID(), `api:${key}`, now, windowSeconds)
    .first()

  const counter = counterSchema.parse(row)

  return {
    limited: counter.count > max,
    retryAfter: Math.max(1, windowSeconds - (now - counter.last_request)),
  }
}
