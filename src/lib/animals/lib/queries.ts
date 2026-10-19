import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { statusSchema } from '@/lib/catalog'
import { toPhoto } from '@/lib/photos'

const rowSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    species: z.enum(['dog', 'cat', 'other']),
    status: statusSchema,
    urgent: z.number(),
    published: z.number(),
    current_location: z.enum(['shelter', 'foster', 'vet']).nullable(),
    intake_date: z.string().nullable(),
    photo_key: z.string().nullable(),
    history: z.number(),
  })
  .transform((row) => ({
    // Requests, adoptions and placements: with any, the animal can be archived but not deleted.
    deletable: row.history === 0,
    id: row.id,
    name: row.name,
    species: row.species,
    status: row.status,
    urgent: row.urgent === 1,
    published: row.published === 1,
    location: row.current_location,
    intakeDate: row.intake_date,
    // Decorative in the list: the name sits right next to it.
    photo: row.photo_key ? toPhoto(row.photo_key, '', null, null) : null,
  }))

// Urgent first, then the newest intake: what the committee looks at first.
export async function selectAnimals(
  status: string | undefined,
  query: string | undefined,
  archived: boolean,
) {
  const where = [archived ? 'a.discarded_at IS NOT NULL' : 'a.discarded_at IS NULL']
  const params: string[] = []

  if (status) {
    where.push('a.status = ?')
    params.push(status)
  }

  if (query) {
    where.push('a.name LIKE ?')
    params.push(`%${query}%`)
  }

  const { results } = await env.DB.prepare(
    `SELECT a.id, a.name, a.species, a.status, a.urgent, a.published, a.current_location, a.intake_date,
       p.r2_key AS photo_key,
       (SELECT COUNT(*) FROM application WHERE animal_id = a.id)
         + (SELECT COUNT(*) FROM adoption WHERE animal_id = a.id)
         + (SELECT COUNT(*) FROM foster_placement WHERE animal_id = a.id) AS history
     FROM animal a LEFT JOIN photo p ON p.animal_id = a.id AND p.is_primary = 1
     WHERE ${where.join(' AND ')}
     ORDER BY a.urgent DESC, a.intake_date DESC
     LIMIT 200`,
  )
    .bind(...params)
    .all()

  return z.array(rowSchema).parse(results)
}
