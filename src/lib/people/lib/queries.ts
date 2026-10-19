import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { PersonError } from './errors'

// People who left their data: adopters, fosters, donors (spec 7). Committee only.

const tags = z.string().transform((text) => z.array(z.string()).catch([]).parse(JSON.parse(text)))

const listSchema = z
  .object({
    id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    city: z.string().nullable(),
    whatsapp_phone: z.string().nullable(),
    tags,
    created_at: z.string(),
    discarded_at: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    city: row.city,
    whatsapp: row.whatsapp_phone,
    tags: row.tags,
    createdAt: row.created_at,
    anonymized: row.discarded_at !== null,
  }))

// Search by name, WhatsApp digits or email.
export async function selectPeople(query: string | undefined) {
  const like = query ? `%${query}%` : null
  const digits = query?.replaceAll(/\D/g, '') ?? ''

  const { results } = await env.DB.prepare(
    `SELECT id, first_name, last_name, city, whatsapp_phone, tags, created_at, discarded_at FROM person
     WHERE ?1 IS NULL
        OR first_name || ' ' || last_name LIKE ?1
        OR email LIKE ?1
        OR (?2 <> '' AND replace(replace(replace(whatsapp_phone, ' ', ''), '-', ''), '+', '') LIKE '%' || ?2 || '%')
     ORDER BY discarded_at IS NOT NULL, created_at DESC
     LIMIT 200`,
  )
    .bind(like, digits.length >= 4 ? digits : '')
    .all()

  return z.array(listSchema).parse(results)
}

const detailSchema = z
  .object({
    id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    whatsapp_phone: z.string().nullable(),
    email: z.string().nullable(),
    city: z.string().nullable(),
    neighborhood: z.string().nullable(),
    data_consent_at: z.string(),
    data_consent_version: z.string(),
    internal_notes: z.string().nullable(),
    tags,
    created_at: z.string(),
    discarded_at: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    firstName: row.first_name,
    name: `${row.first_name} ${row.last_name}`.trim(),
    whatsapp: row.whatsapp_phone,
    email: row.email,
    city: row.city,
    neighborhood: row.neighborhood,
    consent: { at: row.data_consent_at, version: row.data_consent_version },
    notes: row.internal_notes ?? '',
    tags: row.tags,
    createdAt: row.created_at,
    anonymizedAt: row.discarded_at,
  }))

const linkSchema = z.object({
  kind: z.enum(['application', 'adoption', 'foster']),
  id: z.string(),
  animal_name: z.string().nullable(),
  label: z.string(),
  at: z.string(),
})

export async function selectPerson(id: string) {
  const row = await env.DB.prepare(
    `SELECT id, first_name, last_name, whatsapp_phone, email, city, neighborhood, data_consent_at,
       data_consent_version, internal_notes, tags, created_at, discarded_at
     FROM person WHERE id = ?`,
  )
    .bind(id)
    .first()

  if (!row) {
    return null
  }

  // Everything that hangs from this person, newest first.
  const { results } = await env.DB.prepare(
    `SELECT 'application' AS kind, a.id, an.name AS animal_name, a.type || ':' || a.stage AS label, a.created_at AS at
       FROM application a LEFT JOIN animal an ON an.id = a.animal_id WHERE a.person_id = ?1
     UNION ALL
     SELECT 'adoption', ad.application_id, an.name, CASE ad.returned WHEN 1 THEN 'returned' ELSE 'adopted' END, ad.delivered_on
       FROM adoption ad JOIN animal an ON an.id = ad.animal_id WHERE ad.person_id = ?1
     UNION ALL
     SELECT 'foster', fp.id, an.name, COALESCE(fp.ended_on, 'open'), fp.started_on
       FROM foster_placement fp JOIN animal an ON an.id = fp.animal_id WHERE fp.person_id = ?1
     ORDER BY at DESC`,
  )
    .bind(id)
    .all()

  return { person: detailSchema.parse(row), links: z.array(linkSchema).parse(results) }
}

export async function updateNotes(id: string, notes: string) {
  const result = await env.DB.prepare(
    'UPDATE person SET internal_notes = ?, updated_at = ? WHERE id = ? AND discarded_at IS NULL',
  )
    .bind(notes === '' ? null : notes, new Date().toISOString(), id)
    .run()

  if (result.meta.changes === 0) {
    throw new PersonError('Esta persona ya no existe o fue anonimizada.')
  }
}

// Ley 25.326, right to deletion (spec 9: "anonimizar persona"). Personal data and free-text
// answers are erased; adoptions, placements and donations stay as anonymous records so the
// foundation's numbers and the animals' histories still add up. It cannot be undone.
export async function anonymize(id: string) {
  const at = new Date().toISOString()

  const [result] = await env.DB.batch([
    env.DB.prepare(
      `UPDATE person SET first_name = 'Persona', last_name = 'anonimizada', whatsapp_phone = NULL, email = NULL,
         city = NULL, neighborhood = NULL, address = NULL, national_id = NULL, internal_notes = NULL,
         preferred_channel = NULL, discarded_at = ?, updated_at = ?
       WHERE id = ? AND discarded_at IS NULL`,
    ).bind(at, at, id),
    env.DB.prepare(
      "UPDATE application SET answers = '{}', internal_notes = NULL, updated_at = ? WHERE person_id = ?",
    ).bind(at, id),
    env.DB.prepare('UPDATE foster_placement SET notes = NULL WHERE person_id = ?').bind(id),
    // Follow-up notes often describe the household.
    env.DB.prepare(
      `UPDATE follow_up SET notes = NULL
       WHERE adoption_id IN (SELECT id FROM adoption WHERE person_id = ?1)
          OR foster_placement_id IN (SELECT id FROM foster_placement WHERE person_id = ?1)`,
    ).bind(id),
    // TODO when contracts can be uploaded (spec 6.4): delete adoption.contract_r2_key from R2 here,
    // it carries the national id.
    env.DB.prepare(
      'UPDATE donation SET public_name = NULL, anonymous = 1, donor_person_id = NULL WHERE donor_person_id = ?',
    ).bind(id),
  ])

  if (result?.meta.changes === 0) {
    throw new PersonError('Esta persona ya fue anonimizada.')
  }
}
