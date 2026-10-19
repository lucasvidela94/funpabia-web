import { z } from 'zod'

// What the committee can save from Configuración. Stricter than what the site reads back, so a
// typo never reaches the donation page. Messages are user-facing.

const optional = (schema: z.ZodType<string, string>) =>
  z
    .string()
    .trim()
    .transform((text) => (text === '' ? undefined : text))
    .pipe(schema.optional())

// "https://www.instagram.com/funpabia/", "@funpabia" or "funpabia" -> "funpabia"
const handle = z
  .string()
  .trim()
  .transform((text) =>
    text
      .replace(/^https?:\/\/(www\.)?(instagram|facebook)\.com\//i, '')
      .replace(/^@/, '')
      .replace(/\/.*$/, ''),
  )
  .transform((text) => (text === '' ? undefined : text))
  .pipe(
    z
      .string()
      .regex(/^[\w.]{2,60}$/, 'Escribí solo el usuario, sin espacios.')
      .optional(),
  )

const editableAccountSchema = z.object({
  bank: z.string().trim().min(2, 'Escribí el banco o la billetera.').max(60),
  alias: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9.\-ñ]{6,20}$/, 'El alias tiene de 6 a 20 letras, números, puntos o guiones.'),
  cbu: optional(z.string().regex(/^\d{22}$/, 'El CBU o CVU tiene 22 números.')),
  holder: optional(z.string().max(80)),
})

const phoneNumber = optional(
  z.string().regex(/^[\d\s()+-]{8,20}$/, 'Escribí el número con característica.'),
)

export const editableSettingsSchema = z.object({
  donationAccounts: z.array(editableAccountSchema).max(4, 'Hasta 4 cuentas.'),
  contact: z.object({
    phone: phoneNumber,
    whatsapp: phoneNumber,
    email: optional(z.email('Revisá el email.')),
    instagram: handle,
    facebook: handle,
  }),
})

export type EditableSettings = z.input<typeof editableSettingsSchema>
