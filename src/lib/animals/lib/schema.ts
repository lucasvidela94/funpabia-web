import { z } from 'zod'
import { statusSchema } from '@/lib/catalog'

// Inputs of the panel's animal forms. Messages are user-facing (es-AR).

const choice = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values, { error: 'Elegí una opción.' })

// Empty means "not set": the write stores it as NULL (mutations.ts, toColumnValue).
const optionalText = (max: number) => z.string().trim().max(max)

export const MAX_PHOTOS = 5

// Ids are random UUIDs from the app; the dev seed uses readable ones ("seed-lobito").
const idSchema = z.string().min(1).max(64)

// What the phone sends after uploading a photo to /api/uploads/photo.
const uploadedPhotoSchema = z.object({
  key: z.string().regex(/^animals\/[0-9a-f-]{36}\.(webp|jpg)$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

// Spec 6.3: the minimum intake. Everything else is completed later.
export const intakeSchema = z.object({
  name: z.string().trim().min(1, 'Escribí el nombre.').max(40, 'El nombre es muy largo.'),
  species: choice(['dog', 'cat', 'other']),
  sex: choice(['male', 'female', 'unknown']),
  ageCategory: choice(['baby', 'young', 'adult', 'senior']),
  size: choice(['small', 'medium', 'large']),
  photos: z
    .array(uploadedPhotoSchema)
    .min(1, 'Sumá al menos una foto.')
    .max(MAX_PHOTOS, `Hasta ${MAX_PHOTOS} fotos.`),
})

const compatibility = choice(['yes', 'no', 'unknown'])

export const animalDetailsSchema = z.object({
  id: idSchema,
  name: intakeSchema.shape.name,
  species: intakeSchema.shape.species,
  sex: intakeSchema.shape.sex,
  ageCategory: intakeSchema.shape.ageCategory,
  size: intakeSchema.shape.size,
  color: optionalText(60),
  breed: optionalText(60),
  story: optionalText(4000),
  personality: z.array(z.string().trim().min(1).max(30)).max(8),
  goodWithDogs: compatibility,
  goodWithCats: compatibility,
  goodWithKids: compatibility,
  neutered: z.boolean(),
  vaccinated: z.boolean(),
  dewormed: z.boolean(),
  intakeDate: z.iso.date().nullable(),
  intakeReason: choice(['rescue', 'raid', 'abandonment', 'surrender']).nullable(),
  location: choice(['shelter', 'foster', 'vet']).nullable(),
  specialRequirements: optionalText(400),
})

export const statusChangeSchema = z.object({ id: idSchema, status: statusSchema })

// Each call changes the flags it names; a call that names none is a mistake, not a no-op.
export const flagsSchema = z
  .object({
    id: idSchema,
    published: z.boolean().optional(),
    urgent: z.boolean().optional(),
  })
  .refine((flags) => flags.published !== undefined || flags.urgent !== undefined, {
    error: 'Indicá qué cambiar.',
  })

export const photoEditSchema = z.object({
  photoId: idSchema,
  alt: z.string().trim().min(3, 'Describí la foto en pocas palabras.').max(160).optional(),
  primary: z.literal(true).optional(),
})

export const idInputSchema = z.object({ id: idSchema })

export const photoIdInputSchema = z.object({ photoId: idSchema })

export const addPhotosSchema = z.object({
  id: idSchema,
  photos: z.array(uploadedPhotoSchema).min(1).max(MAX_PHOTOS),
})

export type Intake = z.infer<typeof intakeSchema>

export type AnimalDetails = z.infer<typeof animalDetailsSchema>

export type UploadedPhoto = z.infer<typeof uploadedPhotoSchema>
