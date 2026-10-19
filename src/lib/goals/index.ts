import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { adminMiddleware } from '@/lib/auth/session'
import { guarded } from '@/lib/guarded'
import { GoalError } from './lib/errors'
import type { GoalRow } from './lib/queries'
import { donationInputSchema, goalInputSchema } from './lib/schema'

export {
  METHOD_LABEL,
  donationInputSchema,
  goalInputSchema,
  parsePesos,
  type GoalInput,
} from './lib/schema'

export const GOAL_STATUS_LABEL = {
  active: 'Activa',
  fulfilled: 'Cumplida',
  closed: 'Cerrada',
} as const

export type Goal = ReturnType<typeof toGoal>

function toGoal(row: GoalRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    target: row.target_amount,
    raised: row.raised,
    donations: row.donations,
    percent: Math.min(100, Math.floor((row.raised / row.target_amount) * 100)),
    deadlineOn: row.deadline_on,
    status: row.status,
    mercadoPagoUrl: row.mercado_pago_url,
    updatedAt: row.updated_at,
  }
}

export const getActiveGoals = createServerFn({ method: 'GET' }).handler(async () => {
  const { selectGoals } = await import('./lib/queries')

  return (await selectGoals('active')).map(toGoal)
})

export const getGoal = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const { selectGoal } = await import('./lib/queries')
    const { getRequestUrl } = await import('@tanstack/react-start/server')
    const row = await selectGoal(data.slug)

    if (!row) {
      throw notFound()
    }

    // Absolute link to the goal, for sharing.
    return { ...toGoal(row), url: `${getRequestUrl().origin}/dona/${row.slug}` }
  })

// Panel (admin only, spec 4: the editor sees no money).

export type GoalDetail = Awaited<ReturnType<typeof getGoalDetail>>

// Ids are random UUIDs from the app; the dev seed uses readable ones ("seed-lobito").
const idSchema = z.object({ id: z.string().min(1).max(64) })

export const listAllGoals = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    const { selectAllGoalRows } = await import('./lib/panel')

    return (await selectAllGoalRows()).map(toGoal)
  })

export const getGoalDetail = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .validator(idSchema)
  .handler(async ({ data }) => {
    const { selectGoalWithDonations } = await import('./lib/panel')
    const found = await selectGoalWithDonations(data.id)

    if (!found) {
      throw notFound()
    }

    return { goal: toGoal(found.goal), donations: found.donations }
  })

export const createGoal = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(goalInputSchema)
  .handler(async ({ data }) =>
    guarded({ error: GoalError, event: 'goal.write_failed' }, async () => ({
      id: await (await import('./lib/panel')).insertGoal(data),
    })),
  )

export const editGoal = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(goalInputSchema.extend(idSchema.shape))
  .handler(async ({ data }) =>
    guarded({ error: GoalError, event: 'goal.write_failed' }, async () =>
      (await import('./lib/panel')).updateGoal(data.id, data),
    ),
  )

export const recordDonation = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(donationInputSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: GoalError, event: 'goal.write_failed' }, async () =>
      (await import('./lib/panel')).insertDonation(data, user.id),
    ),
  )

export const deleteDonation = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(idSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: GoalError, event: 'goal.write_failed' }, async () =>
      (await import('./lib/panel')).removeDonation(data.id, user.id),
    ),
  )
