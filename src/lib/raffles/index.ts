import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { adminMiddleware } from '@/lib/auth/session'
import { guarded } from '@/lib/guarded'
import { RaffleError } from './lib/errors'
import { RAFFLE_STATUSES, raffleInputSchema, ticketInputSchema } from './lib/schema'

// Raffles (spec 6.12): the committee's ledger of who has each number. Nothing is sold, paid or drawn
// through the site. Admin only (spec 4: the editor sees no money and no personal data).

export {
  MAX_TICKETS,
  RAFFLE_STATUS_LABEL,
  TICKET_STATUS_LABEL,
  formatTicket,
  raffleInputSchema,
  ticketInputSchema,
  type RaffleInput,
  type RaffleStatus,
  type TicketInput,
} from './lib/schema'

export type { Raffle, Ticket } from './lib/queries'

export type RaffleDetail = Awaited<ReturnType<typeof getRaffle>>

// Ids are random UUIDs from the app; the dev seed uses readable ones ("seed-lobito").
const idSchema = z.string().min(1).max(64)

const event = { error: RaffleError, event: 'raffle.write_failed' }

export const listRaffles = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => (await import('./lib/queries')).selectRaffles())

export const getRaffle = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .validator(z.object({ id: idSchema }))
  .handler(async ({ data }) => {
    const { selectGoalOptions, selectRaffle, selectTickets } = await import('./lib/queries')
    const raffle = await selectRaffle(data.id)

    if (!raffle) {
      throw notFound()
    }

    const [tickets, goals] = await Promise.all([
      selectTickets(raffle.id),
      selectGoalOptions(raffle.goalId),
    ])

    return { raffle, tickets, goals }
  })

// Goals to choose from when creating a raffle.
export const getRaffleGoalOptions = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => (await import('./lib/queries')).selectGoalOptions(null))

export const createRaffle = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(raffleInputSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded(event, async () => ({
      id: await (await import('./lib/panel')).insertRaffle(data, user.id),
    })),
  )

export const editRaffle = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ id: idSchema, values: raffleInputSchema }))
  .handler(async ({ data, context: { user } }) =>
    guarded(event, async () =>
      (await import('./lib/panel')).updateRaffle(data.id, data.values, user.id),
    ),
  )

export const setRaffleStatus = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      id: idSchema,
      status: z.enum(RAFFLE_STATUSES),
      winningNumber: z.number().int().min(0).nullable(),
    }),
  )
  .handler(async ({ data, context: { user } }) =>
    guarded(event, async () =>
      (await import('./lib/panel')).changeStatus(data.id, data.status, data.winningNumber, user.id),
    ),
  )

export const deleteRaffle = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ id: idSchema }))
  .handler(async ({ data, context: { user } }) =>
    guarded(event, async () => (await import('./lib/panel')).removeRaffle(data.id, user.id)),
  )

export const saveRaffleTicket = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      raffleId: idSchema,
      number: z.number().int().min(0),
      ticket: ticketInputSchema,
      expected: z.string().max(40).nullable(),
    }),
  )
  .handler(async ({ data, context: { user } }) =>
    guarded(event, async () =>
      (await import('./lib/tickets')).saveTicket({ ...data, userId: user.id }),
    ),
  )

export const recordRaffleProceeds = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ id: idSchema }))
  .handler(async ({ data, context: { user } }) =>
    guarded(event, async () => (await import('./lib/panel')).recordProceeds(data.id, user.id)),
  )
