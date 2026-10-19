import { z } from 'zod'

// Spanish copy for the panel (docs/glossary.md) and the stored answers read back as questions.

export const STAGES = [
  'new',
  'in_review',
  'interview',
  'approved',
  'delivered',
  'rejected',
  'withdrawn',
] as const

export type Stage = (typeof STAGES)[number]

// The board columns, in the order a request moves (spec 6.4). The rest are closed.
export const OPEN_STAGES = [
  'new',
  'in_review',
  'interview',
  'approved',
] as const satisfies readonly Stage[]

export const STAGE_LABEL = {
  new: 'Nueva',
  in_review: 'En revisión',
  interview: 'Entrevista',
  approved: 'Aprobada',
  delivered: 'Entregado',
  rejected: 'Rechazada',
  withdrawn: 'Retirada',
} satisfies Record<Stage, string>

export const PRESCREEN_LABEL = {
  eligible: 'Apta',
  review: 'A revisar',
  ineligible: 'Excluida',
} as const

export const TYPE_LABEL = { adoption: 'Adopción', foster: 'Tránsito' } as const

const YES_NO = { yes: 'Sí', no: 'No' }

const QUESTIONS = [
  { key: 'isAdult', label: '¿Mayor de 18?', values: YES_NO },
  { key: 'city', label: 'Localidad' },
  { key: 'housingType', label: 'Vivienda', values: { house: 'Casa', apartment: 'Departamento' } },
  {
    key: 'housingTenure',
    label: 'Propia o alquilada',
    values: { owned: 'Propia', rented: 'Alquilada' },
  },
  {
    key: 'petsAllowed',
    label: '¿El contrato permite animales?',
    values: { ...YES_NO, unknown: 'No sabe' },
  },
  { key: 'fenced', label: '¿Patio o espacio cerrado?', values: YES_NO },
  {
    key: 'otherPets',
    label: 'Otros animales',
    values: { none: 'No', neutered: 'Sí, castrados', not_neutered: 'Sí, sin castrar' },
  },
  { key: 'neuterCommitment', label: 'Castración si es cachorro', values: YES_NO },
  { key: 'acceptsFollowUp', label: '¿Acepta el seguimiento?', values: YES_NO },
] as const

const HOURS_ALONE = new Map([
  ['under_4', 'Menos de 4'],
  ['4_to_8', 'De 4 a 8'],
  ['over_8', 'Más de 8'],
])

const storedAnswersSchema = z.object({
  prescreen: z.record(z.string(), z.string()).catch({}),
  household: z.string().catch(''),
  hoursAlone: z.string().catch(''),
  vacationCare: z.string().catch(''),
  motivation: z.string().catch(''),
  experience: z.string().catch(''),
})

type AnswerRow = { label: string; value: string; flagged: boolean }

// Values that the pre-screen sends to review, so the committee sees why at a glance.
const FLAGGED = new Set([
  'fenced:no',
  'otherPets:not_neutered',
  'petsAllowed:unknown',
  'petsAllowed:no',
])

// Turns the stored JSON into readable rows. Unknown or missing answers are skipped, never thrown.
export function readAnswers(json: string) {
  const parsed = storedAnswersSchema.safeParse(JSON.parse(json))
  const answers = parsed.success ? parsed.data : storedAnswersSchema.parse({})
  const prescreen = new Map(Object.entries(answers.prescreen))

  const rows: AnswerRow[] = QUESTIONS.flatMap((question) => {
    const raw = prescreen.get(question.key)

    if (raw === undefined) {
      return []
    }

    const values = new Map(Object.entries('values' in question ? question.values : {}))

    return [
      {
        label: question.label,
        value: values.get(raw) ?? raw,
        flagged: FLAGGED.has(`${question.key}:${raw}`),
      },
    ]
  })

  return {
    prescreen: rows,
    household: answers.household,
    hoursAlone: HOURS_ALONE.get(answers.hoursAlone) ?? answers.hoursAlone,
    vacationCare: answers.vacationCare,
    motivation: answers.motivation,
    experience: answers.experience,
  }
}
