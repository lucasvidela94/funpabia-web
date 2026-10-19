import { createFileRoute } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { TextField } from '@/components/shared/form-fields'
import { PanelHeader } from '@/components/panel/panel-page'
import { useAction } from '@/components/panel/use-action'
import { Button } from '@/components/ui/button'
import {
  editableSettingsSchema,
  getPublicSettings,
  saveSettings,
  type EditableSettings,
} from '@/lib/settings'

// Spec 6.5 and 6.13: the alias and CBU shown on Doná, and the contact data of the site.
export const Route = createFileRoute('/_private/panel/_admin/configuracion')({
  loader: () => getPublicSettings(),
  component: Settings,
})

type Account = EditableSettings['donationAccounts'][number]

const EMPTY_ACCOUNT: Account = { bank: '', alias: '', cbu: '', holder: '' }

function Settings() {
  const saved = Route.useLoaderData()

  const [accounts, setAccounts] = useState<Account[]>(() =>
    saved.donationAccounts.map((account) => ({
      ...account,
      cbu: account.cbu ?? '',
      holder: account.holder ?? '',
    })),
  )

  const [contact, setContact] = useState(() => ({
    phone: saved.contact.phone ?? '',
    whatsapp: saved.contact.whatsapp ?? '',
    email: saved.contact.email ?? '',
    instagram: saved.contact.instagram ?? '',
    facebook: saved.contact.facebook ?? '',
  }))

  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const save = useAction()

  function setAccount(index: number, field: keyof Account, value: string) {
    setAccounts((current) =>
      current.map((account, at) => (at === index ? { ...account, [field]: value } : account)),
    )
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = { donationAccounts: accounts, contact }
    const parsed = editableSettingsSchema.safeParse(input)

    if (!parsed.success) {
      setErrors(new Map(parsed.error.issues.map((issue) => [issue.path.join('.'), issue.message])))

      return
    }

    setErrors(new Map())
    await save.run(() => saveSettings({ data: input }))
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl">
      <PanelHeader
        title="Configuración"
        help="configuracion"
        description="Lo que se muestra en el sitio. Los cambios se ven al instante."
      />

      <section aria-labelledby="cuentas" className="mt-8 rounded-lg border bg-card p-5">
        <h2 id="cuentas" className="font-heading text-xl font-bold">
          Cuentas para donar
        </h2>
        <p className="mt-1 text-sm text-ink-2">
          Aparecen en Doná y en cada meta, con botón para copiar. Conviene que estén a nombre de la
          fundación.
        </p>

        <ul className="mt-4 flex flex-col gap-4">
          {accounts.map((account, index) => (
            <li key={index} className="rounded-md border p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Banco o billetera"
                  value={account.bank}
                  onChange={(event) => setAccount(index, 'bank', event.target.value)}
                  error={errors.get(`donationAccounts.${index}.bank`)}
                />
                <TextField
                  label="Alias"
                  value={account.alias}
                  onChange={(event) => setAccount(index, 'alias', event.target.value)}
                  error={errors.get(`donationAccounts.${index}.alias`)}
                  autoCapitalize="none"
                />
                <TextField
                  label="CBU o CVU (opcional)"
                  inputMode="numeric"
                  value={account.cbu ?? ''}
                  onChange={(event) => setAccount(index, 'cbu', event.target.value)}
                  error={errors.get(`donationAccounts.${index}.cbu`)}
                />
                <TextField
                  label="Titular (opcional)"
                  value={account.holder ?? ''}
                  onChange={(event) => setAccount(index, 'holder', event.target.value)}
                  error={errors.get(`donationAccounts.${index}.holder`)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                className="mt-3 h-11 px-3 text-lost"
                onClick={() => setAccounts((current) => current.filter((_, at) => at !== index))}
              >
                <Trash2 aria-hidden="true" />
                Quitar esta cuenta
              </Button>
            </li>
          ))}
        </ul>

        {accounts.length < 4 ? (
          <Button
            type="button"
            variant="outline"
            className="mt-4 h-11 px-4 font-semibold"
            onClick={() => setAccounts((current) => [...current, { ...EMPTY_ACCOUNT }])}
          >
            <Plus aria-hidden="true" />
            Sumar una cuenta
          </Button>
        ) : null}
      </section>

      <section aria-labelledby="contacto" className="mt-6 rounded-lg border bg-card p-5">
        <h2 id="contacto" className="font-heading text-xl font-bold">
          Contacto
        </h2>
        <p className="mt-1 text-sm text-ink-2">
          Se muestra en Contacto y en el pie de todas las páginas.
        </p>
        {/* Fields side by side share the same kind of one-line hint, so their inputs line up. */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            label="Teléfono"
            hint="Para llamadas."
            type="tel"
            inputMode="tel"
            value={contact.phone}
            onChange={(event) => setContact({ ...contact, phone: event.target.value })}
            error={errors.get('contact.phone')}
          />
          <TextField
            label="WhatsApp"
            hint="Si atienden por WhatsApp."
            type="tel"
            inputMode="tel"
            value={contact.whatsapp}
            onChange={(event) => setContact({ ...contact, whatsapp: event.target.value })}
            error={errors.get('contact.whatsapp')}
          />
          <TextField
            label="Instagram"
            hint="El usuario o el link al perfil."
            value={contact.instagram}
            onChange={(event) => setContact({ ...contact, instagram: event.target.value })}
            error={errors.get('contact.instagram')}
            autoCapitalize="none"
          />
          <TextField
            label="Facebook"
            hint="El usuario o el link a la página."
            value={contact.facebook}
            onChange={(event) => setContact({ ...contact, facebook: event.target.value })}
            error={errors.get('contact.facebook')}
            autoCapitalize="none"
          />
          <TextField
            label="Email"
            hint="Para consultas por escrito."
            type="email"
            value={contact.email}
            onChange={(event) => setContact({ ...contact, email: event.target.value })}
            error={errors.get('contact.email')}
          />
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={save.pending} className="h-12 px-8 text-base font-bold">
          {save.pending ? 'Guardando…' : 'Guardar'}
        </Button>
        <p aria-live="polite" className="text-sm font-semibold">
          {save.error ? <span className="text-lost">{save.error}</span> : null}
          {save.done && errors.size === 0 ? <span className="text-adopted">Guardado.</span> : null}
          {errors.size > 0 ? <span className="text-lost">Revisá los campos marcados.</span> : null}
        </p>
      </div>
    </form>
  )
}
