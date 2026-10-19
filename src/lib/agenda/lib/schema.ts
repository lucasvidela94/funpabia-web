import { z } from 'zod'

// Agenda event input (spec 6.7), shared by the panel and the public API. Dates carry an offset
// ("2026-11-03T09:00:00-03:00") and are stored in UTC, so they sort as text.

export const AGENDA_TYPES = [
  'neutering',
  'vaccination',
  'deworming',
  'adoption_day',
  'fair',
  'bingo',
] as const

export const ORGANIZERS = ['funpabia', 'municipality', 'zoonosis', 'other'] as const

const instant = z.iso
  .datetime({ offset: true, error: 'Revisá la fecha y la hora.' })
  .transform((value) => new Date(value).toISOString())

// Optional text: empty means "not set".
const optionalText = (max: number) => z.string().trim().max(max)

export const agendaInputSchema = z
  .object({
    type: z.enum(AGENDA_TYPES, { error: 'Elegí qué tipo de evento es.' }),
    title: z.string().trim().min(4, 'Escribí un título que diga qué es.').max(100),
    startsAt: instant,
    endsAt: z.union([z.literal(''), instant]),
    venue: optionalText(120),
    address: optionalText(160),
    neighborhood: optionalText(80),
    organizer: z.enum(ORGANIZERS, { error: 'Elegí quién lo organiza.' }),
    requirements: optionalText(400),
    appointmentUrl: z.union([
      z.literal(''),
      z.url({ protocol: /^https?$/, error: 'Pegá el link completo (https://…).' }),
    ]),
    appointmentPhone: optionalText(40),
    source: optionalText(120),
  })
  .refine((value) => value.endsAt === '' || value.endsAt >= value.startsAt, {
    path: ['endsAt'],
    message: 'El fin tiene que ser después del inicio.',
  })

// What the forms and the API hand to the module, already validated and with dates in UTC.
export type AgendaInput = z.output<typeof agendaInputSchema>
