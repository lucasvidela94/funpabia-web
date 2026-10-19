import { env } from 'cloudflare:workers'
import { z } from 'zod'

const eventSchema = z
  .object({
    id: z.string(),
    type: z.enum(['neutering', 'vaccination', 'deworming', 'adoption_day', 'fair', 'bingo']),
    title: z.string(),
    starts_at: z.string(),
    ends_at: z.string().nullable(),
    venue_name: z.string().nullable(),
    public_address: z.string().nullable(),
    neighborhood: z.string().nullable(),
    organizer: z.enum(['funpabia', 'municipality', 'zoonosis', 'other']),
    requirements: z.string().nullable(),
    appointment_url: z.string().nullable(),
    appointment_phone: z.string().nullable(),
    source: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    venue: row.venue_name,
    address: row.public_address,
    neighborhood: row.neighborhood,
    organizer: row.organizer,
    requirements: row.requirements,
    appointmentUrl: row.appointment_url,
    appointmentPhone: row.appointment_phone,
    source: row.source,
  }))

const COLUMNS = `id, type, title, starts_at, ends_at, venue_name, public_address, neighborhood,
  organizer, requirements, appointment_url, appointment_phone, source`

// Events that have not ended yet, soonest first.
export async function selectUpcoming(limit: number) {
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM agenda_event
     WHERE discarded_at IS NULL
       AND COALESCE(ends_at, starts_at) >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     ORDER BY starts_at
     LIMIT ?`,
  )
    .bind(limit)
    .all()

  return z.array(eventSchema).parse(results)
}

// Panel list: upcoming first, then the most recent past ones.
export async function selectRecent(limit: number) {
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM agenda_event
     WHERE discarded_at IS NULL
     ORDER BY starts_at DESC
     LIMIT ?`,
  )
    .bind(limit)
    .all()

  return z.array(eventSchema).parse(results)
}

export async function selectEvent(id: string) {
  const row = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM agenda_event WHERE id = ? AND discarded_at IS NULL`,
  )
    .bind(id)
    .first()

  return row ? eventSchema.parse(row) : null
}
