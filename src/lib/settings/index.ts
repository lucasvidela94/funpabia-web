import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { adminMiddleware } from '@/lib/auth/session'
import { editableSettingsSchema } from './lib/editable'

// Public settings the committee edits from the panel (spec 6.13). Values are JSON in the
// `setting` table; a missing or malformed key falls back to its default.

const donationAccountSchema = z.object({
  bank: z.string(),
  alias: z.string(),
  cbu: z.string().optional(),
  holder: z.string().optional(),
})

const contactSchema = z.object({
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
})

export type DonationAccount = z.infer<typeof donationAccountSchema>

export type Contact = z.infer<typeof contactSchema>

const NO_ACCOUNTS: DonationAccount[] = []

const SETTINGS = {
  donation_accounts: { schema: z.array(donationAccountSchema), fallback: NO_ACCOUNTS },
  // The public profiles of the foundation (spec section 2). The phone is still to be confirmed as
  // WhatsApp (spec 17, question 14), so neither number is a default: the committee loads the
  // phone as a call-only number until then.
  contact: {
    schema: contactSchema,
    fallback: { instagram: 'funpabiacipolletti', facebook: 'funpabiacipolletti' },
  },
}

export type PublicSettings = { donationAccounts: DonationAccount[]; contact: Contact }

export const getPublicSettings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PublicSettings> => {
    const { selectSettings } = await import('./lib/queries')
    const values = await selectSettings(Object.keys(SETTINGS))

    return {
      donationAccounts: parse(values.get('donation_accounts'), SETTINGS.donation_accounts),
      contact: parse(values.get('contact'), SETTINGS.contact),
    }
  },
)

export { editableSettingsSchema, type EditableSettings } from './lib/editable'

// Configuración (admin only). Saving is the only write: the site reads the values on each visit.
export const saveSettings = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(editableSettingsSchema)
  .handler(async ({ data }) => {
    const { upsertSettings } = await import('./lib/queries')

    await upsertSettings([
      ['donation_accounts', JSON.stringify(data.donationAccounts)],
      ['contact', JSON.stringify(data.contact)],
    ])
  })

function parse<T>(text: string | undefined, setting: { schema: z.ZodType<T>; fallback: T }): T {
  if (text === undefined) {
    return setting.fallback
  }

  const result = setting.schema.safeParse(safeJson(text))

  return result.success ? result.data : setting.fallback
}

function safeJson(text: string): z.core.util.JSONType | undefined {
  try {
    return z.json().parse(JSON.parse(text))
  } catch {
    return undefined
  }
}
