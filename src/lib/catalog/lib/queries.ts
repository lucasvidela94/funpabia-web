import { env } from 'cloudflare:workers'
import { z } from 'zod'
import {
  catalogRowSchema,
  photoRowSchema,
  profileRowSchema,
  type CatalogRow,
  type PhotoRow,
  type ProfileRow,
} from './schema'
import type { CatalogFilters } from './search'

const CARD_COLUMNS = `
  a.id, a.name, a.slug, a.species, a.sex, a.age_category, a.size, a.status, a.urgent,
  a.neutered, a.vaccinated, a.dewormed, a.good_with_dogs, a.good_with_cats, a.good_with_kids,
  p.r2_key AS photo_key, p.alt_text AS photo_alt, p.width AS photo_width, p.height AS photo_height`

const PRIMARY_PHOTO = 'LEFT JOIN photo p ON p.animal_id = a.id AND p.is_primary = 1'

// Spec 6.1: only published animals that are available or reserved, urgent first, then the ones
// waiting the longest.
export async function selectCatalog(filters: CatalogFilters, limit: number): Promise<CatalogRow[]> {
  const where = ['a.published = 1', "a.status IN ('available', 'reserved')"]
  const params: (string | number)[] = []

  if (filters.species) {
    where.push('a.species = ?')
    params.push(filters.species)
  }

  if (filters.sex) {
    where.push('a.sex = ?')
    params.push(filters.sex)
  }

  if (filters.ageCategory) {
    where.push('a.age_category = ?')
    params.push(filters.ageCategory)
  }

  if (filters.size) {
    where.push('a.size = ?')
    params.push(filters.size)
  }

  if (filters.goodWithDogs) {
    where.push("a.good_with_dogs = 'yes'")
  }

  if (filters.goodWithCats) {
    where.push("a.good_with_cats = 'yes'")
  }

  if (filters.goodWithKids) {
    where.push("a.good_with_kids = 'yes'")
  }

  const { results } = await env.DB.prepare(
    `SELECT ${CARD_COLUMNS} FROM animal a ${PRIMARY_PHOTO}
     WHERE ${where.join(' AND ')}
     ORDER BY a.urgent DESC, a.intake_date IS NULL, a.intake_date, a.created_at
     LIMIT ?`,
  )
    .bind(...params, limit)
    .all()

  return z.array(catalogRowSchema).parse(results)
}

export async function countCatalog(): Promise<number> {
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS total FROM animal WHERE published = 1 AND status IN ('available', 'reserved')",
  ).first()

  return z.object({ total: z.number() }).parse(row).total
}

// Any published animal, adopted ones included: their profile stays up as a happy story (spec 6.1).
export async function selectProfile(
  slug: string,
): Promise<{ animal: ProfileRow; photos: PhotoRow[] } | null> {
  const row = await env.DB.prepare(
    `SELECT ${CARD_COLUMNS}, a.story, a.personality, a.color, a.approx_breed, a.special_requirements
     FROM animal a ${PRIMARY_PHOTO}
     WHERE a.slug = ? AND a.published = 1`,
  )
    .bind(slug)
    .first()

  if (!row) {
    return null
  }

  const animal = profileRowSchema.parse(row)

  const { results } = await env.DB.prepare(
    'SELECT r2_key, alt_text, width, height FROM photo WHERE animal_id = ? ORDER BY is_primary DESC, position',
  )
    .bind(animal.id)
    .all()

  return { animal, photos: z.array(photoRowSchema).parse(results) }
}
