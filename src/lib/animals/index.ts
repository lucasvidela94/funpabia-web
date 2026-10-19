import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { userMiddleware } from '@/lib/auth/session'
import { guarded } from '@/lib/guarded'
import { AnimalError } from './lib/errors'
import {
  addPhotosSchema,
  animalDetailsSchema,
  flagsSchema,
  idInputSchema,
  intakeSchema,
  photoEditSchema,
  photoIdInputSchema,
  statusChangeSchema,
} from './lib/schema'
import { animalListSearchSchema } from './search'

// Animals as the panel manages them: every status, published or not. The public catalog lives in
// @/lib/catalog. Editors and admins can both manage animals (spec 4).

export { MAX_PHOTOS, animalDetailsSchema, intakeSchema } from './lib/schema'

export type AnimalDetail = Awaited<ReturnType<typeof getAnimalDetail>>

export type AnimalListItem = Awaited<ReturnType<typeof listAnimals>>[number]

export const listAnimals = createServerFn({ method: 'GET' })
  .middleware([userMiddleware])
  .validator(animalListSearchSchema)
  .handler(async ({ data }) => {
    const { selectAnimals } = await import('./lib/queries')

    return selectAnimals(data.estado, data.q, data.archivados ?? false)
  })

export const getAnimalDetail = createServerFn({ method: 'GET' })
  .middleware([userMiddleware])
  .validator(idInputSchema)
  .handler(async ({ data }) => {
    const { selectAnimalDetail } = await import('./lib/detail')
    const detail = await selectAnimalDetail(data.id)

    if (!detail) {
      throw notFound()
    }

    return detail
  })

export const createAnimal = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(intakeSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: AnimalError, event: 'animal.write_failed' }, async () => {
      const { insertIntake } = await import('./lib/mutations')

      return { id: await insertIntake(data, user.id) }
    }),
  )

export const updateAnimal = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(animalDetailsSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: AnimalError, event: 'animal.write_failed' }, async () =>
      (await import('./lib/mutations')).updateDetails(data, user.id),
    ),
  )

export const setAnimalStatus = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(statusChangeSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: AnimalError, event: 'animal.write_failed' }, async () =>
      (await import('./lib/mutations')).changeStatus(data.id, data.status, user.id),
    ),
  )

export const setAnimalFlags = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(flagsSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: AnimalError, event: 'animal.write_failed' }, async () =>
      (await import('./lib/mutations')).setFlags(data.id, data, user.id),
    ),
  )

export const archiveAnimal = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(idInputSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: AnimalError, event: 'animal.write_failed' }, async () =>
      (await import('./lib/removal')).archiveAnimal(data.id, user.id),
    ),
  )

export const unarchiveAnimal = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(idInputSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: AnimalError, event: 'animal.write_failed' }, async () =>
      (await import('./lib/removal')).unarchiveAnimal(data.id, user.id),
    ),
  )

export const deleteAnimal = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(idInputSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: AnimalError, event: 'animal.write_failed' }, async () =>
      (await import('./lib/removal')).deleteAnimal(data.id, user.id),
    ),
  )

export const addAnimalPhotos = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(addPhotosSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: AnimalError, event: 'animal.write_failed' }, async () =>
      (await import('./lib/mutations')).appendPhotos(data.id, data.photos, user.id),
    ),
  )

export const editAnimalPhoto = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(photoEditSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: AnimalError, event: 'animal.write_failed' }, async () =>
      (await import('./lib/photo-mutations')).editPhoto(data, user.id),
    ),
  )

export const deleteAnimalPhoto = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(photoIdInputSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: AnimalError, event: 'animal.write_failed' }, async () =>
      (await import('./lib/photo-mutations')).removePhoto(data.photoId, user.id),
    ),
  )
