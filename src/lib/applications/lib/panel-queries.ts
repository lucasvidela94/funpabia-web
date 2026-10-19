import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { toPhoto } from '@/lib/photos'
import { STAGES, readAnswers } from './labels'

// Reads for the committee (admin only). Personal data stays inside the panel.

const stage = z.enum(STAGES)
const type = z.enum(['adoption', 'foster'])
const prescreen = z.enum(['eligible', 'review', 'ineligible']).nullable()

const listRowSchema = z
  .object({
    id: z.string(),
    type,
    stage,
    prescreen_result: prescreen,
    created_at: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    city: z.string().nullable(),
    animal_name: z.string().nullable(),
    photo_key: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    type: row.type,
    stage: row.stage,
    prescreen: row.prescreen_result,
    createdAt: row.created_at,
    person: `${row.first_name} ${row.last_name}`,
    city: row.city,
    animal: row.animal_name,
    photo: row.photo_key ? toPhoto(row.photo_key, '', null, null) : null,
  }))

// Open requests oldest first: the one waiting longest gets answered first (spec 3, response time).
export async function selectApplications(filter: {
  stage?: string
  type?: string
  closed: boolean
}) {
  const where = ['a.discarded_at IS NULL']
  const params: string[] = []

  where.push(
    filter.closed
      ? "a.stage IN ('delivered', 'rejected', 'withdrawn')"
      : "a.stage NOT IN ('delivered', 'rejected', 'withdrawn')",
  )

  if (filter.stage) {
    where.push('a.stage = ?')
    params.push(filter.stage)
  }

  if (filter.type) {
    where.push('a.type = ?')
    params.push(filter.type)
  }

  const { results } = await env.DB.prepare(
    `SELECT a.id, a.type, a.stage, a.prescreen_result, a.created_at, p.first_name, p.last_name, p.city,
       an.name AS animal_name, ph.r2_key AS photo_key
     FROM application a
     JOIN person p ON p.id = a.person_id
     LEFT JOIN animal an ON an.id = a.animal_id
     LEFT JOIN photo ph ON ph.animal_id = an.id AND ph.is_primary = 1
     WHERE ${where.join(' AND ')}
     ORDER BY a.created_at ${filter.closed ? 'DESC' : 'ASC'}
     LIMIT 300`,
  )
    .bind(...params)
    .all()

  return z.array(listRowSchema).parse(results)
}

const detailSchema = z
  .object({
    id: z.string(),
    type,
    stage,
    prescreen_result: prescreen,
    answers: z.string(),
    rejection_reason: z.string().nullable(),
    internal_notes: z.string().nullable(),
    created_at: z.string(),
    person_id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    whatsapp_phone: z.string().nullable(),
    email: z.string().nullable(),
    city: z.string().nullable(),
    animal_id: z.string().nullable(),
    animal_name: z.string().nullable(),
    animal_slug: z.string().nullable(),
    animal_status: z.string().nullable(),
    animal_sex: z.enum(['male', 'female', 'unknown']).nullable(),
  })
  .transform((row) => ({
    id: row.id,
    type: row.type,
    stage: row.stage,
    prescreen: row.prescreen_result,
    answers: readAnswers(row.answers),
    rejectionReason: row.rejection_reason,
    notes: row.internal_notes ?? '',
    createdAt: row.created_at,
    person: {
      id: row.person_id,
      firstName: row.first_name,
      name: `${row.first_name} ${row.last_name}`,
      whatsapp: row.whatsapp_phone,
      email: row.email,
      city: row.city,
    },
    animal:
      row.animal_id && row.animal_name && row.animal_slug
        ? {
            id: row.animal_id,
            name: row.animal_name,
            slug: row.animal_slug,
            status: row.animal_status,
            sex: row.animal_sex,
          }
        : null,
  }))

const historySchema = z
  .object({ stage, created_at: z.string(), user_name: z.string().nullable() })
  .transform((row) => ({ stage: row.stage, at: row.created_at, by: row.user_name }))

const siblingSchema = z
  .object({ id: z.string(), stage, first_name: z.string(), last_name: z.string() })
  .transform((row) => ({
    id: row.id,
    stage: row.stage,
    person: `${row.first_name} ${row.last_name}`,
  }))

export async function selectApplication(id: string) {
  const row = await env.DB.prepare(
    `SELECT a.id, a.type, a.stage, a.prescreen_result, a.answers, a.rejection_reason, a.internal_notes,
       a.created_at, p.id AS person_id, p.first_name, p.last_name, p.whatsapp_phone, p.email, p.city,
       an.id AS animal_id, an.name AS animal_name, an.slug AS animal_slug, an.status AS animal_status,
       an.sex AS animal_sex
     FROM application a
     JOIN person p ON p.id = a.person_id
     LEFT JOIN animal an ON an.id = a.animal_id
     WHERE a.id = ? AND a.discarded_at IS NULL`,
  )
    .bind(id)
    .first()

  if (!row) {
    return null
  }

  const application = detailSchema.parse(row)

  const [history, siblings] = await Promise.all([
    env.DB.prepare(
      `SELECT h.stage, h.created_at, u.name AS user_name FROM application_stage_history h
       LEFT JOIN app_user u ON u.id = h.user_id WHERE h.application_id = ? ORDER BY h.created_at DESC`,
    )
      .bind(id)
      .all(),
    // Spec 8.1, step 7: when one is approved, the others for the same animal get a kind message.
    application.animal
      ? env.DB.prepare(
          `SELECT a.id, a.stage, p.first_name, p.last_name FROM application a JOIN person p ON p.id = a.person_id
           WHERE a.animal_id = ? AND a.id <> ? AND a.discarded_at IS NULL ORDER BY a.created_at`,
        )
          .bind(application.animal.id, id)
          .all()
      : Promise.resolve({ results: [] }),
  ])

  return {
    ...application,
    history: z.array(historySchema).parse(history.results),
    siblings: z.array(siblingSchema).parse(siblings.results),
  }
}

// Animals a request without one can be assigned to.
export async function selectAssignableAnimals() {
  const { results } = await env.DB.prepare(
    "SELECT id, name FROM animal WHERE status IN ('available', 'reserved', 'intake', 'under_treatment') AND discarded_at IS NULL ORDER BY name",
  ).all()

  return z.array(z.object({ id: z.string(), name: z.string() })).parse(results)
}
