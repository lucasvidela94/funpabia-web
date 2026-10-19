import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { userMiddleware } from '@/lib/auth/session'
import { guarded } from '@/lib/guarded'
import { AgendaError } from './lib/errors'
import { agendaInputSchema } from './lib/schema'

export { AGENDA_TYPES, ORGANIZERS, agendaInputSchema, type AgendaInput } from './lib/schema'

export const AGENDA_TYPE_LABEL = {
  neutering: 'Castración',
  vaccination: 'Vacunación antirrábica',
  deworming: 'Desparasitación',
  adoption_day: 'Jornada de adopción',
  fair: 'Feria',
  bingo: 'Bingo',
} as const

export const ORGANIZER_LABEL = {
  funpabia: 'Funpabia',
  municipality: 'Municipalidad de Cipolletti',
  zoonosis: 'Zoonosis',
  other: 'Otro organizador',
} as const

export type AgendaEvent = Awaited<ReturnType<typeof getUpcomingEvents>>[number]

export const getUpcomingEvents = createServerFn({ method: 'GET' })
  .validator(z.object({ limit: z.number().int().min(1).max(100) }))
  .handler(async ({ data }) => {
    const { selectUpcoming } = await import('./lib/queries')

    return selectUpcoming(data.limit)
  })

// Panel (spec 6.7). Any panel role can manage the agenda; the municipality user only does this.

// Ids are random UUIDs from the app; the dev seed uses readable ones ("seed-lobito").
const idSchema = z.object({ id: z.string().min(1).max(64) })

export const listAgendaEvents = createServerFn({ method: 'GET' })
  .middleware([userMiddleware])
  .handler(async () => {
    const { selectRecent } = await import('./lib/queries')

    return selectRecent(200)
  })

export const createAgendaEvent = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(agendaInputSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: AgendaError, event: 'agenda.write_failed' }, async () => ({
      id: await (await import('./lib/panel')).insertEvent(data, user.id),
    })),
  )

export const editAgendaEvent = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(z.object({ id: idSchema.shape.id, values: agendaInputSchema }))
  .handler(async ({ data }) =>
    guarded({ error: AgendaError, event: 'agenda.write_failed' }, async () =>
      (await import('./lib/panel')).updateEvent(data.id, data.values),
    ),
  )

export const removeAgendaEvent = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(idSchema)
  .handler(async ({ data }) =>
    guarded({ error: AgendaError, event: 'agenda.write_failed' }, async () =>
      (await import('./lib/panel')).discardEvent(data.id),
    ),
  )
