import { createFileRoute } from '@tanstack/react-router'
import { KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ConfirmButton } from '@/components/shared/confirm-dialog'
import { ChoiceField, TextField } from '@/components/shared/form-fields'
import { PanelHeader } from '@/components/panel/panel-page'
import { useAction } from '@/components/panel/use-action'
import { Button } from '@/components/ui/button'
import {
  createApiToken,
  listApiTokens,
  newTokenSchema,
  revokeApiToken,
  type ApiTokenSummary,
} from '@/lib/api'
import { formatDateWithYear } from '@/lib/format'
import { listUsers, type PanelUser } from '@/lib/users'

// API tokens for the public REST API (docs/spec/api-rest.md, section 5 and docs/api.md).
// Committee only: tokens belong to a municipality or admin user, and the value is shown once.
export const Route = createFileRoute('/_private/panel/_admin/api')({
  loader: async () => {
    const [tokens, users] = await Promise.all([listApiTokens(), listUsers()])

    return { tokens, users: users.users }
  },
  component: ApiTokens,
})

function ApiTokens() {
  const { tokens, users } = Route.useLoaderData()
  const [adding, setAdding] = useState(false)
  const [revealed, setRevealed] = useState<{ name: string; value: string } | null>(null)
  const [showRevoked, setShowRevoked] = useState(false)

  const owners = users.filter(
    (user) => user.active && ['municipality', 'admin'].includes(user.role),
  )

  const revokedCount = tokens.filter((token) => token.revoked).length
  const visible = showRevoked ? tokens : tokens.filter((token) => !token.revoked)

  return (
    <div className="max-w-3xl">
      <PanelHeader
        title="API"
        description="Tokens para que el Municipio cargue la agenda sin usar el panel."
        actions={
          adding ? null : (
            <Button type="button" className="h-11 px-4 font-bold" onClick={() => setAdding(true)}>
              <KeyRound aria-hidden="true" />
              Crear un token
            </Button>
          )
        }
      />

      {revealed ? (
        <div
          role="status"
          className="mt-6 rounded-lg border-l-[6px] border-adopted bg-adopted-soft p-4"
        >
          <p>
            <strong className="text-adopted">Token creado para {revealed.name}.</strong> Copialo
            ahora: no se vuelve a mostrar.
          </p>
          <p className="mt-2 rounded-md border bg-card p-3 font-mono text-sm break-all">
            {revealed.value}
          </p>
          <button
            type="button"
            onClick={() => setRevealed(null)}
            className="mt-2 font-semibold underline"
          >
            Listo
          </button>
        </div>
      ) : null}

      {adding ? (
        <NewToken
          owners={owners}
          onDone={(created) => {
            setAdding(false)

            if (created) {
              setRevealed(created)
            }
          }}
        />
      ) : null}

      {visible.length > 0 ? (
        <ul className="mt-6 divide-y overflow-hidden rounded-lg border bg-card">
          {visible.map((token) => (
            <li key={token.id}>
              <TokenRow token={token} onRevoked={() => setRevealed(null)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-input bg-card p-8">
          <KeyRound className="size-6 text-teal-700" aria-hidden="true" />
          <p className="mt-2 font-heading text-xl font-bold">
            {tokens.length === 0 ? 'Todavía no hay tokens' : 'No hay tokens activos'}
          </p>
          <p className="mt-1 text-ink-2">
            Cuando el Municipio quiera cargar la agenda, se crea un token a nombre de su usuaria.
          </p>
        </div>
      )}

      {revokedCount > 0 ? (
        <button
          type="button"
          aria-pressed={showRevoked}
          onClick={() => setShowRevoked(!showRevoked)}
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
        >
          {showRevoked ? 'Ocultar los revocados' : `Mostrar los revocados (${revokedCount})`}
        </button>
      ) : null}
    </div>
  )
}

function TokenRow({ token, onRevoked }: { token: ApiTokenSummary; onRevoked: () => void }) {
  const action = useAction()

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {token.name}
          {token.revoked ? (
            <span className="font-normal text-muted-foreground"> (revocado)</span>
          ) : null}
        </p>
        <p className="truncate text-sm text-ink-2">
          {token.ownerName} · {token.ownerEmail}
        </p>
        <p className="text-sm text-muted-foreground">
          {token.scopes} · vence el {formatDateWithYear(token.expiresAt)}
        </p>
      </div>
      {token.revoked ? null : (
        <ConfirmButton
          variant="outline"
          className="h-11 px-3 text-lost"
          disabled={action.pending}
          title={`¿Revocar el token ${token.name}?`}
          description="Deja de funcionar en el momento, sin borrar el historial."
          confirmLabel="Revocar el token"
          destructive
          onConfirm={() => {
            // A token just shown stays on screen only until anything is revoked.
            onRevoked()
            void action.run(() => revokeApiToken({ data: { id: token.id } }))
          }}
        >
          Revocar
        </ConfirmButton>
      )}
      {action.error ? (
        <p role="alert" className="w-full text-sm font-semibold text-lost">
          {action.error}
        </p>
      ) : null}
    </div>
  )
}

function NewToken({
  owners,
  onDone,
}: {
  owners: PanelUser[]
  onDone: (created: { name: string; value: string } | null) => void
}) {
  const [values, setValues] = useState({ userId: '', name: '' })
  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const save = useAction()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = newTokenSchema.safeParse(values)

    if (!parsed.success) {
      setErrors(
        new Map(parsed.error.issues.map((issue) => [String(issue.path.at(0)), issue.message])),
      )

      return
    }

    setErrors(new Map())
    const created = await save.run(() => createApiToken({ data: parsed.data }))

    if (created) {
      onDone({ name: parsed.data.name, value: created.value })
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mt-6 flex flex-col gap-5 rounded-lg border bg-card p-5"
    >
      <h2 className="font-heading text-xl font-bold">Crear un token</h2>
      {owners.length > 0 ? (
        <ChoiceField
          legend="Usuaria dueña"
          name="owner"
          options={owners.map((owner) => ({
            value: owner.id,
            label: `${owner.name} (${owner.email})`,
          }))}
          value={values.userId || undefined}
          onChange={(userId) => setValues({ ...values, userId })}
          error={errors.get('userId')}
        />
      ) : (
        <p className="text-ink-2">
          Primero hay que crear una usuaria del Municipio (o de la comisión) en Usuarios.
        </p>
      )}
      <TextField
        label="Nombre del token"
        hint="Para qué es: Municipio de Cipolletti, Zoonosis."
        value={values.name}
        onChange={(event) => setValues({ ...values, name: event.target.value })}
        error={errors.get('name')}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={save.pending} className="h-12 px-6 font-bold">
          {save.pending ? 'Creando…' : 'Crear el token'}
        </Button>
        <Button type="button" variant="ghost" className="h-12 px-4" onClick={() => onDone(null)}>
          Cancelar
        </Button>
        {save.error ? <p className="text-sm font-semibold text-lost">{save.error}</p> : null}
      </div>
    </form>
  )
}
