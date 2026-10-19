import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { adminMiddleware } from '@/lib/auth/session'
import { guarded } from '@/lib/guarded'
import { FollowUpError } from './lib/errors'
import { followUpSearchSchema } from './search'

// Follow-ups after each adoption or foster placement (spec 6.4). Committee only.

export const FOLLOW_UP_TYPE_LABEL = {
  day_7: 'A los 7 días',
  day_30: 'Al mes',
  month_6: 'A los 6 meses',
  neutering: 'Castración',
  other: 'Seguimiento',
} as const

export const RESULT_LABEL = {
  ok: 'Todo bien',
  problems: 'Con problemas',
  no_response: 'Sin respuesta',
  returned: 'Lo devolvieron',
} as const

export type FollowUp = Awaited<ReturnType<typeof listFollowUps>>['items'][number]

// How far ahead the pending view looks.
const UPCOMING_DAYS = 30

export const listFollowUps = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .validator(followUpSearchSchema)
  .handler(async ({ data }) => {
    const { selectDone, selectPending } = await import('./lib/queries')
    const { todayCalendar } = await import('@/lib/format')
    const today = todayCalendar()

    if (data.vista === 'hechos') {
      return { today, items: await selectDone(50) }
    }

    const until = new Date(`${today}T12:00:00Z`)
    until.setUTCDate(until.getUTCDate() + UPCOMING_DAYS)

    return { today, items: await selectPending(until.toISOString().slice(0, 10)) }
  })

export const recordFollowUp = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      id: z.string().min(1).max(64),
      result: z.enum(['ok', 'problems', 'no_response', 'returned']),
      notes: z.string().trim().max(2000),
    }),
  )
  .handler(async ({ data, context: { user } }) => {
    const { completeFollowUp } = await import('./lib/mutations')

    return guarded({ error: FollowUpError, event: 'follow_up.write_failed' }, () =>
      completeFollowUp(data, user.id),
    )
  })
