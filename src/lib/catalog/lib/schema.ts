import { z } from 'zod'

// Row shapes as D1 returns them. Every query result is parsed here before it leaves the module.

const speciesSchema = z.enum(['dog', 'cat', 'other'])
const sexSchema = z.enum(['male', 'female', 'unknown'])

const ageCategorySchema = z.enum(['baby', 'young', 'adult', 'senior'])
const sizeSchema = z.enum(['small', 'medium', 'large'])

export const statusSchema = z.enum([
  'intake',
  'under_treatment',
  'available',
  'reserved',
  'adopted',
  'fostered',
  'deceased',
  'returned',
  'not_adoptable',
])

const compatibilitySchema = z.enum(['yes', 'no', 'unknown'])
const flag = z.union([z.literal(0), z.literal(1)]).transform((value) => value === 1)

export type Species = z.infer<typeof speciesSchema>

export type Sex = z.infer<typeof sexSchema>

export type AgeCategory = z.infer<typeof ageCategorySchema>

export type Size = z.infer<typeof sizeSchema>

export type AnimalStatus = z.infer<typeof statusSchema>

export const catalogRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  species: speciesSchema,
  sex: sexSchema,
  age_category: ageCategorySchema.nullable(),
  size: sizeSchema,
  status: statusSchema,
  urgent: flag,
  neutered: flag,
  vaccinated: flag,
  dewormed: flag,
  good_with_dogs: compatibilitySchema,
  good_with_cats: compatibilitySchema,
  good_with_kids: compatibilitySchema,
  photo_key: z.string().nullable(),
  photo_alt: z.string().nullable(),
  photo_width: z.number().nullable(),
  photo_height: z.number().nullable(),
})

export const profileRowSchema = catalogRowSchema.extend({
  story: z.string().nullable(),
  personality: z.string().transform((text) => z.array(z.string()).parse(JSON.parse(text))),
  color: z.string().nullable(),
  approx_breed: z.string().nullable(),
  special_requirements: z.string().nullable(),
})

export const photoRowSchema = z.object({
  r2_key: z.string(),
  alt_text: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
})

export type CatalogRow = z.infer<typeof catalogRowSchema>

export type ProfileRow = z.infer<typeof profileRowSchema>

export type PhotoRow = z.infer<typeof photoRowSchema>
