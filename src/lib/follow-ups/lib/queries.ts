import { env } from 'cloudflare:workers'
import { z } from 'zod'

// Follow-ups after adoptions and foster placements (spec 6.4). Admin only: they carry contact data.

const TYPES = ['day_7', 'day_30', 'month_6', 'neutering', 'other'] as const
const RESULTS = ['ok', 'problems', 'no_response', 'returned'] as const

const rowSchema = z
  .object({
    id: z.string(),
    type: z.enum(TYPES),
    scheduled_on: z.string(),
    completed_on: z.string().nullable(),
    result: z.enum(RESULTS).nullable(),
    notes: z.string().nullable(),
    adoption_id: z.string().nullable(),
    application_id: z.string().nullable(),
    animal_id: z.string(),
    animal_name: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    whatsapp_phone: z.string().nullable(),
    completed_by_name: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    type: row.type,
    scheduledOn: row.scheduled_on,
    completedOn: row.completed_on,
    result: row.result,
    notes: row.notes ?? '',
    kind: row.adoption_id ? ('adoption' as const) : ('foster' as const),
    applicationId: row.application_id,
    animal: { id: row.animal_id, name: row.animal_name },
    person: {
      firstName: row.first_name,
      name: `${row.first_name} ${row.last_name}`,
      whatsapp: row.whatsapp_phone,
    },
    completedBy: row.completed_by_name,
  }))

// One follow-up hangs from an adoption or a foster placement, never both (schema CHECK).
const SELECT = `
  SELECT f.id, f.type, f.scheduled_on, f.completed_on, f.result, f.notes, f.adoption_id,
    ad.application_id, an.id AS animal_id, an.name AS animal_name, p.first_name, p.last_name,
    p.whatsapp_phone, u.name AS completed_by_name
  FROM follow_up f
  LEFT JOIN adoption ad ON ad.id = f.adoption_id
  LEFT JOIN foster_placement fp ON fp.id = f.foster_placement_id
  JOIN animal an ON an.id = COALESCE(ad.animal_id, fp.animal_id)
  JOIN person p ON p.id = COALESCE(ad.person_id, fp.person_id)
  LEFT JOIN app_user u ON u.id = f.completed_by`

// Overdue and the next `days` days, soonest first.
export async function selectPending(until: string) {
  const { results } = await env.DB.prepare(
    `${SELECT} WHERE f.completed_on IS NULL AND f.scheduled_on <= ? ORDER BY f.scheduled_on`,
  )
    .bind(until)
    .all()

  return z.array(rowSchema).parse(results)
}

export async function selectDone(limit: number) {
  const { results } = await env.DB.prepare(
    `${SELECT} WHERE f.completed_on IS NOT NULL ORDER BY f.completed_on DESC, f.created_at DESC LIMIT ?`,
  )
    .bind(limit)
    .all()

  return z.array(rowSchema).parse(results)
}
