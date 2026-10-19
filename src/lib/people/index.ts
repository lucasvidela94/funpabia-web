import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { adminMiddleware } from '@/lib/auth/session'
import { guarded } from '@/lib/guarded'
import { logger } from '@/lib/logger'
import { PersonError } from './lib/errors'
import { peopleSearchSchema } from './search'

// People who left their data through the site (spec 7, Persona). Committee only (spec 4).

export const TAG_LABEL = {
  adopter: 'Adoptante',
  foster: 'Transitante',
  volunteer: 'Voluntaria',
  member: 'Socia',
  donor: 'Donante',
} as const

export type PersonDetail = Awaited<ReturnType<typeof getPerson>>

// Ids are random UUIDs from the app; the dev seed uses readable ones ("seed-lobito").
const idSchema = z.object({ id: z.string().min(1).max(64) })

export const listPeople = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .validator(peopleSearchSchema)
  .handler(async ({ data }) => {
    const { selectPeople } = await import('./lib/queries')

    return selectPeople(data.q || undefined)
  })

export const getPerson = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .validator(idSchema)
  .handler(async ({ data }) => {
    const { selectPerson } = await import('./lib/queries')
    const found = await selectPerson(data.id)

    if (!found) {
      throw notFound()
    }

    return found
  })

export const savePersonNotes = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(idSchema.extend({ notes: z.string().trim().max(4000) }))
  .handler(async ({ data }) =>
    guarded({ error: PersonError, event: 'person.write_failed' }, async () =>
      (await import('./lib/queries')).updateNotes(data.id, data.notes),
    ),
  )

// Logged without any personal data: only that it happened.
export const anonymizePerson = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(idSchema)
  .handler(async ({ data }) => {
    await guarded({ error: PersonError, event: 'person.write_failed' }, async () =>
      (await import('./lib/queries')).anonymize(data.id),
    )
    logger.info('person.anonymized')
  })
