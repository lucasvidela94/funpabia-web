import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { auditIfChangedStatement, auditStatement } from '@/lib/audit'
import { todayCalendar } from '@/lib/format'
import { donationStatements } from '@/lib/goals/server'
import { RaffleError } from './errors'
import { selectRaffle } from './queries'
import { PAYMENT_METHODS, type RaffleStatus, type raffleInputSchema } from './schema'

// Panel writes for a raffle itself (spec 6.12). Ticket writes live in ./tickets. Admin only.

type RaffleValues = z.output<typeof raffleInputSchema>

// Which way a raffle can move. Drawn goes back to closed only to correct a mistyped winner; a
// closed raffle reopens for sale only while its proceeds are not in the goal yet.
const TRANSITIONS: Record<RaffleStatus, RaffleStatus[]> = {
  draft: ['selling'],
  selling: ['closed'],
  closed: ['selling', 'drawn'],
  drawn: ['closed'],
}

async function loadRaffle(id: string) {
  const raffle = await selectRaffle(id)

  if (!raffle) {
    throw new RaffleError('Esta rifa ya no existe.')
  }

  return raffle
}

export async function insertRaffle(values: RaffleValues, userId: string) {
  const id = crypto.randomUUID()
  const at = new Date().toISOString()

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO raffle (id, title, prizes, ticket_price, ticket_count, draw_on, draw_method, permit,
         goal_id, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      values.title,
      values.prizes,
      values.ticketPrice,
      values.ticketCount,
      values.drawOn || null,
      values.drawMethod || null,
      values.permit || null,
      values.goalId || null,
      userId,
      at,
      at,
    ),
    auditStatement({
      userId,
      entity: 'raffle',
      entityId: id,
      action: 'create',
      changes: { ticketPrice: values.ticketPrice, ticketCount: values.ticketCount },
    }),
  ])

  return id
}

// Price and size are fixed once sales start, so a sold number always means the same money.
export async function updateRaffle(id: string, values: RaffleValues, userId: string) {
  const raffle = await loadRaffle(id)

  if (raffle.status === 'drawn') {
    throw new RaffleError('La rifa ya se sorteó: no se puede editar.')
  }

  const sizeChanged =
    values.ticketPrice !== raffle.ticketPrice || values.ticketCount !== raffle.ticketCount

  if (raffle.status !== 'draft' && sizeChanged) {
    throw new RaffleError(
      'El precio y la cantidad de números quedan fijos cuando empieza la venta.',
    )
  }

  if (raffle.proceedsRecordedAt && (values.goalId || null) !== raffle.goalId) {
    throw new RaffleError('Lo recaudado ya está en la meta: la meta no se puede cambiar.')
  }

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE raffle SET title = ?, prizes = ?, ticket_price = ?, ticket_count = ?, draw_on = ?,
         draw_method = ?, permit = ?, goal_id = ?, updated_at = ?
       WHERE id = ? AND status = ?`,
    ).bind(
      values.title,
      values.prizes,
      values.ticketPrice,
      values.ticketCount,
      values.drawOn || null,
      values.drawMethod || null,
      values.permit || null,
      values.goalId || null,
      new Date().toISOString(),
      id,
      raffle.status,
    ),
    auditIfChangedStatement({
      userId,
      entity: 'raffle',
      entityId: id,
      action: 'update',
      changes: { ticketPrice: values.ticketPrice, ticketCount: values.ticketCount },
    }),
  ])
}

export async function changeStatus(
  id: string,
  next: RaffleStatus,
  winningNumber: number | null,
  userId: string,
) {
  const raffle = await loadRaffle(id)

  if (!TRANSITIONS[raffle.status].includes(next)) {
    throw new RaffleError('La rifa ya cambió de estado. Recargá la página.')
  }

  if (next === 'selling' && raffle.proceedsRecordedAt) {
    throw new RaffleError('Lo recaudado ya está en la meta: la venta no se puede reabrir.')
  }

  if (next === 'drawn' && (winningNumber === null || winningNumber >= raffle.ticketCount)) {
    throw new RaffleError('Escribí un número ganador que exista en esta rifa.')
  }

  const winner = next === 'drawn' ? winningNumber : null

  const [update] = await env.DB.batch([
    env.DB.prepare(
      'UPDATE raffle SET status = ?, winning_number = ?, updated_at = ? WHERE id = ? AND status = ?',
    ).bind(next, winner, new Date().toISOString(), id, raffle.status),
    auditIfChangedStatement({
      userId,
      entity: 'raffle',
      entityId: id,
      action: 'update',
      changes: { from: raffle.status, status: next, winningNumber: winner },
    }),
  ])

  if (update.meta.changes === 0) {
    throw new RaffleError('La rifa ya cambió de estado. Recargá la página.')
  }
}

// Only a draft can go: it never sold anything, so there is nothing to keep.
export async function removeRaffle(id: string, userId: string) {
  const [removal] = await env.DB.batch([
    env.DB.prepare(`DELETE FROM raffle WHERE id = ? AND status = 'draft'`).bind(id),
    auditIfChangedStatement({
      userId,
      entity: 'raffle',
      entityId: id,
      action: 'delete',
      changes: {},
    }),
  ])

  if (removal.meta.changes === 0) {
    throw new RaffleError('Solo se puede borrar una rifa en borrador.')
  }
}

const paidByMethodSchema = z.array(
  z.object({ payment_method: z.enum(PAYMENT_METHODS), tickets: z.number() }),
)

// The paid numbers go into the goal as one donation per payment method, so the goal says truthfully
// how the money came in. The external reference is unique across donations: a double click or two
// people at once can never count the raffle twice. From then on the tickets are frozen.
export async function recordProceeds(id: string, userId: string) {
  const raffle = await loadRaffle(id)

  if (raffle.status !== 'closed' && raffle.status !== 'drawn') {
    throw new RaffleError('Primero cerrá la venta.')
  }

  if (!raffle.goalId) {
    throw new RaffleError('Elegí la meta de la rifa antes de registrar lo recaudado.')
  }

  if (raffle.proceedsRecordedAt) {
    throw new RaffleError('Lo recaudado ya está en la meta.')
  }

  const { results } = await env.DB.prepare(
    `SELECT payment_method, COUNT(*) AS tickets FROM raffle_ticket
     WHERE raffle_id = ? AND status = 'paid' GROUP BY payment_method`,
  )
    .bind(id)
    .all()

  const byMethod = paidByMethodSchema.parse(results)

  if (byMethod.length === 0) {
    throw new RaffleError('No hay números pagados para registrar.')
  }

  const goalId = raffle.goalId
  const donatedOn = todayCalendar()
  const publicName = `Rifa ${raffle.title}`.slice(0, 40)
  const total = byMethod.reduce((sum, row) => sum + row.tickets * raffle.ticketPrice, 0)

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE raffle SET proceeds_recorded_at = ?, updated_at = ?
       WHERE id = ? AND proceeds_recorded_at IS NULL AND status IN ('closed', 'drawn')`,
    ).bind(new Date().toISOString(), new Date().toISOString(), id),
    ...byMethod.flatMap((row) =>
      donationStatements({
        goalId,
        amount: row.tickets * raffle.ticketPrice,
        donatedOn,
        method: row.payment_method,
        publicName,
        externalReference: `raffle:${id}:${row.payment_method}`,
        userId,
      }),
    ),
    auditStatement({
      userId,
      entity: 'raffle',
      entityId: id,
      action: 'update',
      changes: { proceeds: total },
    }),
  ])
}
