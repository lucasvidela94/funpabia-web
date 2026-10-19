import { env } from 'cloudflare:workers'
import { z } from 'zod'

// Foster placement reads (spec 6.4): who holds which animal, since when. Active first, then the
// most recently ended.

const placementSchema = z
  .object({
    id: z.string(),
    animal_id: z.string(),
    animal_name: z.string().nullable(),
    person_id: z.string(),
    person_name: z.string(),
    started_on: z.string(),
    ended_on: z.string().nullable(),
    notes: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    animalId: row.animal_id,
    animalName: row.animal_name ?? 'Sin nombre',
    personId: row.person_id,
    personName: row.person_name,
    startedOn: row.started_on,
    endedOn: row.ended_on,
    notes: row.notes ?? '',
  }))

export async function selectPlacements(limit: number) {
  const { results } = await env.DB.prepare(
    `SELECT fp.id, fp.animal_id, an.name AS animal_name, fp.person_id,
       p.first_name || ' ' || p.last_name AS person_name,
       fp.started_on, fp.ended_on, fp.notes
     FROM foster_placement fp
     JOIN animal an ON an.id = fp.animal_id
     JOIN person p ON p.id = fp.person_id
     ORDER BY fp.ended_on IS NOT NULL, COALESCE(fp.ended_on, fp.started_on) DESC
     LIMIT ?`,
  )
    .bind(limit)
    .all()

  return z.array(placementSchema).parse(results)
}
