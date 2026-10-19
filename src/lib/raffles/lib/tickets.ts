import { env } from 'cloudflare:workers'
import { auditIfChangedStatement } from '@/lib/audit'
import { RaffleError } from './errors'
import { selectRaffle } from './queries'
import { formatTicket, type TicketInput } from './schema'

// Marking one number (spec 6.12). Two volunteers can be marking at the same time, so every write
// says what it expected to find: nothing (the number looked free) or the row as it was last read
// (its updated_at). If someone else got there first the write changes nothing and the panel reloads
// to show what is stored, instead of silently replacing a sale.

type Write = {
  raffleId: string
  number: number
  ticket: TicketInput
  // The number's updated_at when the panel read it; null if it looked free.
  expected: string | null
  userId: string
}

const STILL_SELLING = `EXISTS (SELECT 1 FROM raffle WHERE id = ? AND status = 'selling')`

export async function saveTicket(write: Write) {
  const raffle = await selectRaffle(write.raffleId)

  if (!raffle) {
    throw new RaffleError('Esta rifa ya no existe.')
  }

  if (raffle.status !== 'selling') {
    throw new RaffleError(
      raffle.status === 'draft'
        ? 'Abrí la venta antes de marcar números.'
        : 'La venta está cerrada: los números ya no se pueden cambiar.',
    )
  }

  if (write.number >= raffle.ticketCount) {
    throw new RaffleError('Ese número no existe en esta rifa.')
  }

  const label = formatTicket(write.number, raffle.ticketCount)

  const conflict = new RaffleError(
    `Alguien más cambió el número ${label} recién. Te mostramos cómo quedó.`,
  )

  const audit = auditIfChangedStatement({
    userId: write.userId,
    entity: 'raffle',
    entityId: write.raffleId,
    action: 'update',
    changes: { number: write.number, status: write.ticket.status },
  })

  const statement = buildStatement(write)

  // Already free and still free: nothing to write.
  if (!statement) {
    return
  }

  try {
    const [result] = await env.DB.batch([statement, audit])

    if (result.meta.changes === 0) {
      throw conflict
    }
  } catch (caught) {
    // Inserting a number someone else already took breaks the primary key.
    if (
      caught instanceof Error &&
      /CONSTRAINT_PRIMARYKEY|UNIQUE constraint/i.test(caught.message)
    ) {
      throw conflict
    }

    throw caught
  }
}

function buildStatement({ raffleId, number, ticket, expected, userId }: Write) {
  const at = new Date().toISOString()

  if (ticket.status === 'free') {
    return expected === null
      ? null
      : env.DB.prepare(
          `DELETE FROM raffle_ticket
           WHERE raffle_id = ? AND number = ? AND updated_at = ? AND ${STILL_SELLING}`,
        ).bind(raffleId, number, expected, raffleId)
  }

  const paid = ticket.status === 'paid'

  const fields = [
    ticket.status,
    ticket.buyerName || null,
    ticket.buyerPhone || null,
    ticket.seller || null,
    paid ? ticket.paymentMethod : null,
    paid ? ticket.paidOn : null,
    userId,
  ]

  if (expected === null) {
    return env.DB.prepare(
      `INSERT INTO raffle_ticket (raffle_id, number, status, buyer_name, buyer_phone, seller,
         payment_method, paid_on, recorded_by, created_at, updated_at)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
       FROM raffle WHERE id = ? AND status = 'selling' AND ? < ticket_count`,
    ).bind(raffleId, number, ...fields, at, at, raffleId, number)
  }

  return env.DB.prepare(
    `UPDATE raffle_ticket SET status = ?, buyer_name = ?, buyer_phone = ?, seller = ?,
       payment_method = ?, paid_on = ?, recorded_by = ?, updated_at = ?
     WHERE raffle_id = ? AND number = ? AND updated_at = ? AND ${STILL_SELLING}`,
  ).bind(...fields, at, raffleId, number, expected, raffleId)
}
