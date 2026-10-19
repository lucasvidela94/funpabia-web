import { z } from 'zod'
import { todayCalendar } from '@/lib/format'

// Foster placement input (spec 6.4): an animal with a foster home, with start and optional end
// dates. Calendar dates ('YYYY-MM-DD'), like the base stores them.

const calendarDate = z.iso.date({ error: 'Revisá la fecha.' })

// Ids are random UUIDs from the app; the dev seed uses readable ones ("seed-lobito").
const idSchema = z.string().min(1).max(64)

export const assignPlacementSchema = z
  .object({
    animalId: idSchema,
    personId: idSchema,
    startedOn: calendarDate,
    endedOn: z.union([z.literal(''), calendarDate]),
    notes: z.string().trim().max(2000),
  })
  .refine((value) => value.startedOn <= todayCalendar(), {
    path: ['startedOn'],
    message: 'La fecha de inicio no puede ser futura.',
  })
  .refine((value) => value.endedOn === '' || value.endedOn >= value.startedOn, {
    path: ['endedOn'],
    message: 'El fin tiene que ser después del inicio.',
  })

export const endPlacementSchema = z.object({
  id: idSchema,
  endedOn: calendarDate,
})

export type AssignPlacement = z.output<typeof assignPlacementSchema>
