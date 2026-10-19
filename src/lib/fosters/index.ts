import { createServerFn } from '@tanstack/react-start'
import { adminMiddleware } from '@/lib/auth/session'
import { guarded } from '@/lib/guarded'
import { FosterError } from './lib/errors'
import { assignPlacementSchema, endPlacementSchema } from './lib/schema'

export { assignPlacementSchema, type AssignPlacement } from './lib/schema'

// Foster placements (spec 6.4): which animal is in which home, since when. Committee only.
// Placements also arrive from approved foster requests (src/lib/applications); these are the
// direct assignments and endings from the panel.

export type Placement = Awaited<ReturnType<typeof listPlacements>>[number]

export const listPlacements = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    const { selectPlacements } = await import('./lib/queries')

    return selectPlacements(200)
  })

export const assignFoster = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(assignPlacementSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: FosterError, event: 'foster.write_failed' }, async () => ({
      id: await (await import('./lib/panel')).assignPlacement(data, user.id),
    })),
  )

export const endFoster = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(endPlacementSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: FosterError, event: 'foster.write_failed' }, async () =>
      (await import('./lib/panel')).endPlacement(data.id, data.endedOn, user.id),
    ),
  )
