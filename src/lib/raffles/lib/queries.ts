import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { PAYMENT_METHODS, RAFFLE_STATUSES } from './schema'

// Panel reads for raffles. Admin only: buyers are personal data and the totals are money.

const raffleSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    prizes: z.string(),
    ticket_price: z.number(),
    ticket_count: z.number(),
    draw_on: z.string().nullable(),
    draw_method: z.string().nullable(),
    permit: z.string().nullable(),
    goal_id: z.string().nullable(),
    goal_title: z.string().nullable(),
    status: z.enum(RAFFLE_STATUSES),
    winning_number: z.number().nullable(),
    proceeds_recorded_at: z.string().nullable(),
    reserved: z.number(),
    paid: z.number(),
  })
  .transform((row) => ({
    id: row.id,
    title: row.title,
    prizes: row.prizes,
    ticketPrice: row.ticket_price,
    ticketCount: row.ticket_count,
    drawOn: row.draw_on,
    drawMethod: row.draw_method,
    permit: row.permit,
    goalId: row.goal_id,
    goalTitle: row.goal_title,
    status: row.status,
    winningNumber: row.winning_number,
    proceedsRecordedAt: row.proceeds_recorded_at,
    reserved: row.reserved,
    paid: row.paid,
  }))

export type Raffle = z.output<typeof raffleSchema>

const ticketSchema = z
  .object({
    number: z.number(),
    status: z.enum(['reserved', 'paid']),
    buyer_name: z.string().nullable(),
    buyer_phone: z.string().nullable(),
    seller: z.string().nullable(),
    payment_method: z.enum(PAYMENT_METHODS).nullable(),
    paid_on: z.string().nullable(),
    recorded_by_name: z.string().nullable(),
    updated_at: z.string(),
  })
  .transform((row) => ({
    number: row.number,
    status: row.status,
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    seller: row.seller,
    paymentMethod: row.payment_method,
    paidOn: row.paid_on,
    recordedBy: row.recorded_by_name,
    updatedAt: row.updated_at,
  }))

export type Ticket = z.output<typeof ticketSchema>

const RAFFLE_SELECT = `
  SELECT r.id, r.title, r.prizes, r.ticket_price, r.ticket_count, r.draw_on, r.draw_method, r.permit,
    r.goal_id, g.title AS goal_title, r.status, r.winning_number, r.proceeds_recorded_at,
    (SELECT COUNT(*) FROM raffle_ticket t WHERE t.raffle_id = r.id AND t.status = 'reserved') AS reserved,
    (SELECT COUNT(*) FROM raffle_ticket t WHERE t.raffle_id = r.id AND t.status = 'paid') AS paid
  FROM raffle r LEFT JOIN goal g ON g.id = r.goal_id`

// Open raffles first, then the newest.
export async function selectRaffles() {
  const { results } = await env.DB.prepare(
    `${RAFFLE_SELECT} ORDER BY r.status = 'drawn', r.status = 'closed', r.created_at DESC LIMIT 100`,
  ).all()

  return z.array(raffleSchema).parse(results)
}

export async function selectRaffle(id: string) {
  const row = await env.DB.prepare(`${RAFFLE_SELECT} WHERE r.id = ?`).bind(id).first()

  return row ? raffleSchema.parse(row) : null
}

export async function selectTickets(raffleId: string) {
  const { results } = await env.DB.prepare(
    `SELECT t.number, t.status, t.buyer_name, t.buyer_phone, t.seller, t.payment_method, t.paid_on,
       u.name AS recorded_by_name, t.updated_at
     FROM raffle_ticket t LEFT JOIN app_user u ON u.id = t.recorded_by
     WHERE t.raffle_id = ? ORDER BY t.number`,
  )
    .bind(raffleId)
    .all()

  return z.array(ticketSchema).parse(results)
}

// Goals a raffle can raise money for: the open ones, plus the one it already points at.
export async function selectGoalOptions(currentGoalId: string | null) {
  const { results } = await env.DB.prepare(
    `SELECT id, title FROM goal WHERE status IN ('active', 'fulfilled') OR id = ?
     ORDER BY status <> 'active', created_at DESC LIMIT 100`,
  )
    .bind(currentGoalId)
    .all()

  return z.array(z.object({ id: z.string(), title: z.string() })).parse(results)
}
