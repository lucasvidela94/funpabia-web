import { z } from 'zod'

// Panel inputs for raffles (spec 6.12). Money is whole Argentine pesos.

export const RAFFLE_STATUSES = ['draft', 'selling', 'closed', 'drawn'] as const

export type RaffleStatus = (typeof RAFFLE_STATUSES)[number]

export const RAFFLE_STATUS_LABEL = {
  draft: 'Borrador',
  selling: 'En venta',
  closed: 'Cerrada',
  drawn: 'Sorteada',
} as const satisfies Record<RaffleStatus, string>

export const PAYMENT_METHODS = ['alias', 'cbu', 'mp_link', 'cash'] as const

export const TICKET_STATUS_LABEL = {
  free: 'Libre',
  reserved: 'Reservado',
  paid: 'Pagado',
} as const

export const MAX_TICKETS = 1000

const optionalText = (max: number) => z.string().trim().max(max)

export const raffleInputSchema = z.object({
  title: z.string().trim().min(4, 'Escribí un título: Rifa de primavera.').max(80),
  prizes: z.string().trim().min(3, 'Escribí al menos un premio.').max(1000),
  ticketPrice: z
    .number({ error: 'Escribí el precio en pesos.' })
    .int('Sin centavos: el precio en pesos enteros.')
    .positive('El precio tiene que ser mayor a cero.')
    .max(10_000_000, 'Revisá el precio.'),
  ticketCount: z
    .number({ error: 'Escribí cuántos números tiene.' })
    .int('Un número entero.')
    .min(10, 'Al menos 10 números.')
    .max(MAX_TICKETS, `Hasta ${MAX_TICKETS} números (000 a 999).`),
  drawOn: z.union([z.literal(''), z.iso.date('Revisá la fecha.')]),
  drawMethod: optionalText(120),
  permit: optionalText(80),
  goalId: z.union([z.literal(''), z.string().min(1).max(64)]),
})

export type RaffleInput = z.input<typeof raffleInputSchema>

// One number, as the committee marks it. A free number has no row: releasing deletes it.
export const ticketInputSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('free'),
  }),
  z.object({
    status: z.literal('reserved'),
    buyerName: optionalText(80),
    buyerPhone: optionalText(30),
    seller: optionalText(60),
  }),
  z.object({
    status: z.literal('paid'),
    buyerName: optionalText(80),
    buyerPhone: optionalText(30),
    seller: optionalText(60),
    paymentMethod: z.enum(PAYMENT_METHODS, { error: 'Elegí cómo pagó.' }),
    paidOn: z.iso.date('Revisá la fecha.'),
  }),
])

export type TicketInput = z.infer<typeof ticketInputSchema>

// "047" in a raffle of 1000 numbers, "07" in one of 100 or of 10: never a bare digit, as on a stub.
export function formatTicket(number: number, ticketCount: number) {
  return String(number).padStart(Math.max(2, String(ticketCount - 1).length), '0')
}
