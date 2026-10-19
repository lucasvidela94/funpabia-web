import { z } from 'zod'

// Panel inputs for goals and donations (spec 6.5). Money is whole Argentine pesos.

export const METHOD_LABEL = {
  alias: 'Alias',
  cbu: 'Transferencia (CBU)',
  mp_link: 'Link de Mercado Pago',
  mp_api: 'Mercado Pago (automático)',
  cash: 'Efectivo',
} as const

// The form turns the typed text into a number (parsePesos); NaN means it was not one.
const pesos = z
  .number({ error: 'Escribí el monto en pesos.' })
  .int('Sin centavos: el monto en pesos enteros.')
  .positive('El monto tiene que ser mayor a cero.')
  .max(1_000_000_000, 'Revisá el monto.')

export const goalInputSchema = z.object({
  title: z.string().trim().min(4, 'Escribí un título que diga para qué es.').max(80),
  description: z.string().trim().max(600),
  target: pesos,
  deadlineOn: z.union([z.literal(''), z.iso.date('Revisá la fecha.')]),
  mercadoPagoUrl: z.union([
    z.literal(''),
    z.url({ protocol: /^https$/, error: 'Pegá el link completo de Mercado Pago (https://…).' }),
  ]),
  status: z.enum(['active', 'fulfilled', 'closed']),
})

export const donationInputSchema = z.object({
  goalId: z.string().min(1).max(64),
  amount: pesos,
  donatedOn: z.iso.date('Revisá la fecha.'),
  // Manual records only: "mp_api" arrives by webhook in F2.
  method: z.enum(['alias', 'cbu', 'mp_link', 'cash'], { error: 'Elegí cómo llegó.' }),
  // Spec 6.5: at most a first name, and only with the donor's consent; empty means anonymous.
  publicName: z.string().trim().max(40),
})

// "$ 1.500.000" or "1500000" -> 1500000. es-AR uses dots for thousands.
export function parsePesos(text: string) {
  const digits = text.replaceAll(/[\s$.]/g, '').replace(',', '.')

  return digits === '' ? Number.NaN : Number(digits)
}

export type GoalInput = z.input<typeof goalInputSchema>
