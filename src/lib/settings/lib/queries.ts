import { env } from 'cloudflare:workers'
import { z } from 'zod'

export async function selectSettings(keys: string[]): Promise<Map<string, string>> {
  const { results } = await env.DB.prepare(
    `SELECT key, value FROM setting WHERE key IN (${keys.map(() => '?').join(', ')})`,
  )
    .bind(...keys)
    .all()

  const rows = z.array(z.object({ key: z.string(), value: z.string() })).parse(results)

  return new Map(rows.map((row) => [row.key, row.value]))
}

export async function upsertSettings(values: [key: string, value: string][]) {
  const at = new Date().toISOString()

  await env.DB.batch(
    values.map(([key, value]) =>
      env.DB.prepare(
        'INSERT INTO setting (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      ).bind(key, value, at),
    ),
  )
}
