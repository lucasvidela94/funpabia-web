import { z } from 'zod'

// The adoption and foster form (spec 6.2), one schema per step so the client can validate as the
// visitor moves forward and the server can validate everything again. Messages are user-facing.

const required = (message: string) => z.string({ error: message }).trim().min(1, message)

const choice = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values, { error: 'Elegí una opción.' })

export const prescreenSchema = z.object({
  isAdult: choice(['yes', 'no']),
  city: required('Contanos dónde vivís.').max(80),
  housingType: choice(['house', 'apartment']),
  housingTenure: choice(['owned', 'rented']),
  petsAllowed: choice(['yes', 'no', 'unknown']).optional(),
  fenced: choice(['yes', 'no']),
  otherPets: choice(['none', 'neutered', 'not_neutered']),
  neuterCommitment: choice(['yes', 'no']).optional(),
  acceptsFollowUp: choice(['yes', 'no']),
})

export const contactSchema = z.object({
  firstName: required('Escribí tu nombre.').max(60),
  lastName: required('Escribí tu apellido.').max(60),
  whatsapp: z
    .string({ error: 'Escribí tu WhatsApp.' })
    .trim()
    .regex(/^[\d\s()+-]{8,20}$/, 'Escribí el número con característica, por ejemplo 299 456 4530.'),
  email: z.union([z.literal(''), z.email('Revisá el email.').max(120)]),
  household: required('Contanos quiénes viven en la casa.').max(400),
  hoursAlone: choice(['under_4', '4_to_8', 'over_8']),
  vacationCare: required('Contanos quién lo cuidaría.').max(400),
})

export const motivationSchema = z.object({
  motivation: required('Contanos por qué querés adoptar o ser tránsito.').max(2000),
  experience: z.string().trim().max(2000),
  consent: z.literal(true, { error: 'Necesitamos tu consentimiento para guardar tus datos.' }),
})

const applicationTypeSchema = z.enum(['adoption', 'foster'])

export const submissionSchema = z.object({
  type: applicationTypeSchema,
  animalSlug: z.string().max(120).optional(),
  prescreen: prescreenSchema,
  contact: contactSchema,
  motivation: motivationSchema,
  // Honeypot: hidden from people, filled by bots (spec 6.2, no captchas).
  website: z.string().max(200),
})

export type ApplicationType = z.infer<typeof applicationTypeSchema>

export type Prescreen = z.infer<typeof prescreenSchema>

export type Submission = z.infer<typeof submissionSchema>
