import { z } from 'zod'
import { todayCalendar } from '@/lib/format'

// Lost and found reports (spec 6.6). Messages are user-facing (es-AR).

const KINDS = ['lost', 'found'] as const

export const kindSchema = z.enum(KINDS)

export const speciesSchema = z.enum(['dog', 'cat', 'other'])

export const sexSchema = z.enum(['male', 'female', 'unknown'])

export const sizeSchema = z.enum(['small', 'medium', 'large'])

export const statusSchema = z.enum(['pending', 'active', 'reunited', 'hidden'])

export type ReportKind = z.infer<typeof kindSchema>

export type ReportSpecies = z.infer<typeof speciesSchema>

export type ReportSex = z.infer<typeof sexSchema>

export type ReportSize = z.infer<typeof sizeSchema>

export type ReportStatus = z.infer<typeof statusSchema>

// A report is listed for this long after the committee approves it (spec 6.6, [PROPUESTA]).
export const REPORT_LIFETIME_DAYS = 60

// Past events are accepted up to this far back: older than that it is no longer a search.
const MAX_AGE_DAYS = 90

const required = (message: string) => z.string({ error: message }).trim().min(1, message)

const choice = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values, { error: 'Elegí una opción.' })

// What the phone sends after uploading a photo to /api/uploads/report-photo.
const reportPhotoSchema = z.object({
  key: z.string().regex(/^reports\/[0-9a-f-]{36}\.(webp|jpg)$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

export const MAX_REPORT_PHOTOS = 3

function daysAgo(days: number) {
  return todayCalendar(Date.now() - days * 24 * 60 * 60 * 1000)
}

export const reportInputSchema = z.object({
  kind: choice(KINDS),
  species: choice(['dog', 'cat', 'other']),
  sex: choice(['male', 'female', 'unknown']),
  size: choice(['small', 'medium', 'large']),
  color: required('Contanos de qué color es.').max(60),
  marks: z.string().trim().max(120),
  eventOn: z
    .string({ error: 'Elegí la fecha.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Elegí la fecha.')
    .refine((date) => date <= todayCalendar(), 'La fecha no puede ser futura.')
    .refine((date) => date >= daysAgo(MAX_AGE_DAYS), 'Si pasó hace más de 90 días, escribinos.'),
  description: required('Contanos cómo es y qué pasó.').max(1000),
  zone: required('Elegí la zona.').max(40),
  contactName: required('Escribí tu nombre.').max(60),
  contactPhone: z
    .string({ error: 'Escribí tu WhatsApp.' })
    .trim()
    .regex(/^[\d\s()+-]{8,20}$/, 'Escribí el número con característica, por ejemplo 299 456 4530.'),
  consent: z.literal(true, { error: 'Necesitamos tu OK para publicar tu contacto.' }),
  photos: z
    .array(reportPhotoSchema)
    .min(1, 'Sumá al menos una foto.')
    .max(MAX_REPORT_PHOTOS, `Hasta ${MAX_REPORT_PHOTOS} fotos.`),
  // Honeypot: people never see it (src/components/site/report-form.tsx).
  website: z.string().max(200),
})

export type ReportInput = z.infer<typeof reportInputSchema>

// The filters of /perdidos, in the URL so a search can be shared.
export const reportSearchSchema = z.object({
  tipo: z.enum(['perdido', 'encontrado']).optional().catch(undefined),
  especie: z.enum(['perro', 'gato', 'otro']).optional().catch(undefined),
  zona: z.string().max(40).optional().catch(undefined),
  cerca: z.boolean().optional().catch(undefined),
  dias: z
    .union([z.literal(7), z.literal(30), z.literal(90)])
    .optional()
    .catch(undefined),
})

export type ReportSearch = z.infer<typeof reportSearchSchema>
