import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { toPhoto, type Photo } from '@/lib/photos'
import type { CatalogRow } from './lib/schema'
import { catalogSearchSchema, toFilters } from './lib/search'

export {
  AGE_LABEL,
  SEX_LABEL,
  SIZE_LABEL,
  SPECIES_LABEL,
  STATUS_LABEL,
  adoptVerb,
  gendered,
} from './lib/labels'

export { catalogSearchSchema, type CatalogSearch } from './lib/search'

export { statusSchema, type AnimalStatus, type Sex, type Species } from './lib/schema'

export type CatalogAnimal = ReturnType<typeof toCatalogAnimal>

export type AnimalProfile = CatalogAnimal & {
  story: string | null
  personality: string[]
  color: string | null
  breed: string | null
  specialRequirements: string | null
  photos: Photo[]
  // Absolute link to this profile, for sharing and OG tags.
  url: string
  origin: string
}

function toCatalogAnimal(row: CatalogRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    species: row.species,
    sex: row.sex,
    ageCategory: row.age_category,
    size: row.size,
    status: row.status,
    urgent: row.urgent,
    neutered: row.neutered,
    vaccinated: row.vaccinated,
    dewormed: row.dewormed,
    goodWithDogs: row.good_with_dogs,
    goodWithCats: row.good_with_cats,
    goodWithKids: row.good_with_kids,
    photo: row.photo_key
      ? toPhoto(row.photo_key, row.photo_alt ?? row.name, row.photo_width, row.photo_height)
      : null,
  }
}

const CATALOG_PAGE = 60

export const getCatalog = createServerFn({ method: 'GET' })
  .validator(catalogSearchSchema)
  .handler(async ({ data }) => {
    const { selectCatalog, countCatalog } = await import('./lib/queries')

    const [rows, total] = await Promise.all([
      selectCatalog(toFilters(data), CATALOG_PAGE),
      countCatalog(),
    ])

    return { animals: rows.map(toCatalogAnimal), total }
  })

// The home page shows a short strip of the catalog, urgent first.
export const getCatalogPreview = createServerFn({ method: 'GET' }).handler(async () => {
  const { selectCatalog, countCatalog } = await import('./lib/queries')
  const [rows, total] = await Promise.all([selectCatalog(toFilters({}), 4), countCatalog()])

  return { animals: rows.map(toCatalogAnimal), total }
})

export const getAnimalProfile = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }): Promise<AnimalProfile> => {
    const { selectProfile } = await import('./lib/queries')
    const { getRequestUrl } = await import('@tanstack/react-start/server')
    const found = await selectProfile(data.slug)

    if (!found) {
      throw notFound()
    }

    const { animal, photos } = found
    const { origin } = getRequestUrl()

    return {
      ...toCatalogAnimal(animal),
      story: animal.story,
      personality: animal.personality,
      color: animal.color,
      breed: animal.approx_breed,
      specialRequirements: animal.special_requirements,
      photos: photos.map((photo) =>
        toPhoto(photo.r2_key, photo.alt_text, photo.width, photo.height),
      ),
      url: `${origin}/adopta/${animal.slug}`,
      origin,
    }
  })
