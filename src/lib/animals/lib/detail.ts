import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { statusSchema } from '@/lib/catalog'
import { toPhoto } from '@/lib/photos'
import { countHistory } from './removal'

// Everything the panel's animal page shows: the full record, its photos and its status history.

const flag = z.union([z.literal(0), z.literal(1)]).transform((value) => value === 1)
const compatibility = z.enum(['yes', 'no', 'unknown'])

const animalSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    species: z.enum(['dog', 'cat', 'other']),
    sex: z.enum(['male', 'female', 'unknown']),
    age_category: z.enum(['baby', 'young', 'adult', 'senior']).nullable(),
    size: z.enum(['small', 'medium', 'large']),
    color: z.string().nullable(),
    approx_breed: z.string().nullable(),
    story: z.string().nullable(),
    personality: z.string().transform((text) => z.array(z.string()).parse(JSON.parse(text))),
    good_with_dogs: compatibility,
    good_with_cats: compatibility,
    good_with_kids: compatibility,
    neutered: flag,
    vaccinated: flag,
    dewormed: flag,
    status: statusSchema,
    urgent: flag,
    published: flag,
    intake_date: z.string().nullable(),
    intake_reason: z.enum(['rescue', 'raid', 'abandonment', 'surrender']).nullable(),
    current_location: z.enum(['shelter', 'foster', 'vet']).nullable(),
    special_requirements: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    species: row.species,
    sex: row.sex,
    ageCategory: row.age_category,
    size: row.size,
    color: row.color,
    breed: row.approx_breed,
    story: row.story,
    personality: row.personality,
    goodWithDogs: row.good_with_dogs,
    goodWithCats: row.good_with_cats,
    goodWithKids: row.good_with_kids,
    neutered: row.neutered,
    vaccinated: row.vaccinated,
    dewormed: row.dewormed,
    status: row.status,
    urgent: row.urgent,
    published: row.published,
    intakeDate: row.intake_date,
    intakeReason: row.intake_reason,
    location: row.current_location,
    specialRequirements: row.special_requirements,
  }))

const photoSchema = z
  .object({
    id: z.string(),
    r2_key: z.string(),
    alt_text: z.string(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    is_primary: flag,
  })
  .transform((row) => ({
    id: row.id,
    primary: row.is_primary,
    ...toPhoto(row.r2_key, row.alt_text, row.width, row.height),
  }))

const historySchema = z
  .object({ new_status: statusSchema, created_at: z.string(), user_name: z.string().nullable() })
  .transform((row) => ({ status: row.new_status, at: row.created_at, by: row.user_name }))

export async function selectAnimalDetail(id: string) {
  const row = await env.DB.prepare(
    `SELECT id, name, slug, species, sex, age_category, size, color, approx_breed, story, personality,
       good_with_dogs, good_with_cats, good_with_kids, neutered, vaccinated, dewormed, status, urgent,
       published, intake_date, intake_reason, current_location, special_requirements
     FROM animal WHERE id = ? AND discarded_at IS NULL`,
  )
    .bind(id)
    .first()

  if (!row) {
    return null
  }

  const [photos, history, linked] = await Promise.all([
    env.DB.prepare(
      'SELECT id, r2_key, alt_text, width, height, is_primary FROM photo WHERE animal_id = ? ORDER BY is_primary DESC, position',
    )
      .bind(id)
      .all(),
    env.DB.prepare(
      `SELECT h.new_status, h.created_at, u.name AS user_name
       FROM animal_status_history h LEFT JOIN app_user u ON u.id = h.user_id
       WHERE h.animal_id = ? ORDER BY h.created_at DESC LIMIT 20`,
    )
      .bind(id)
      .all(),
    countHistory(id),
  ])

  return {
    animal: animalSchema.parse(row),
    photos: z.array(photoSchema).parse(photos.results),
    history: z.array(historySchema).parse(history.results),
    // Nothing refers to the animal: it can be deleted for good, not only archived.
    deletable: linked === 0,
  }
}
