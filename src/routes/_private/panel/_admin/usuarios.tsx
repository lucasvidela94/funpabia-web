import { createFileRoute } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ConfirmButton } from '@/components/shared/confirm-dialog'
import { ChoiceField, TextField } from '@/components/shared/form-fields'
import { PanelHeader } from '@/components/panel/panel-page'
import { useAction } from '@/components/panel/use-action'
import { Button } from '@/components/ui/button'
import { roleLabel } from '@/lib/auth/session'
import { formatAge } from '@/lib/format'
import {
  ASSIGNABLE_ROLES,
  MIN_PASSWORD_LENGTH,
  createUser,
  listUsers,
  newUserSchema,
  setUserActive,
  setUserRole,
  type PanelUser,
} from '@/lib/users'

export const Route = createFileRoute('/_private/panel/_admin/usuarios')({
  loader: () => listUsers(),
  component: Users,
})

const ROLE_LABEL: Record<(typeof ASSIGNABLE_ROLES)[number], string> = {
  admin: 'Comisión: todo el panel',
  editor: 'Editora: animales, noticias y agenda',
}

const ROLE_OPTIONS = ASSIGNABLE_ROLES.map((value) => ({ value, label: ROLE_LABEL[value] }))

function Users() {
  const { users, me } = Route.useLoaderData()
  const [adding, setAdding] = useState(false)

  return (
    <div className="max-w-3xl">
      <PanelHeader
        title="Usuarios"
        help="sumar-persona"
        description="Quién entra al panel. La editora no ve datos de adoptantes ni de dinero."
        actions={
          adding ? null : (
            <Button type="button" className="h-11 px-4 font-bold" onClick={() => setAdding(true)}>
              <UserPlus aria-hidden="true" />
              Sumar una persona
            </Button>
          )
        }
      />

      {adding ? <NewUser onDone={() => setAdding(false)} /> : null}

      <ul className="mt-6 divide-y overflow-hidden rounded-lg border bg-card">
        {users.map((user) => (
          <li key={user.id}>
            <UserRow user={user} isMe={user.id === me} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function UserRow({ user, isMe }: { user: PanelUser; isMe: boolean }) {
  const action = useAction()
  const editable = !isMe && user.role !== 'superadmin'

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {user.name}
          {isMe ? <span className="font-normal text-muted-foreground"> (vos)</span> : null}
        </p>
        <p className="truncate text-sm text-ink-2">{user.email}</p>
        <p className="text-sm text-muted-foreground">
          {roleLabel(user.role)}
          {user.active ? '' : ', dada de baja'}
          {user.lastSeen
            ? `. Entró por última vez ${formatAge(user.lastSeen)}`
            : '. Todavía no entró'}
        </p>
      </div>
      {editable ? (
        <div className="flex flex-wrap gap-2">
          {user.active ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 px-3"
              disabled={action.pending}
              onClick={() =>
                action.run(() =>
                  setUserRole({
                    data: { id: user.id, role: user.role === 'admin' ? 'editor' : 'admin' },
                  }),
                )
              }
            >
              {user.role === 'admin' ? 'Pasar a editora' : 'Pasar a comisión'}
            </Button>
          ) : null}
          {user.active ? (
            <ConfirmButton
              variant="outline"
              className="h-11 px-3 text-lost"
              disabled={action.pending}
              title={`¿Dar de baja a ${user.name}?`}
              description="Se cierra su sesión en todos los dispositivos y no puede volver a entrar. Se puede reactivar después."
              confirmLabel="Dar de baja"
              destructive
              onConfirm={() =>
                void action.run(() => setUserActive({ data: { id: user.id, active: false } }))
              }
            >
              Dar de baja
            </ConfirmButton>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-11 px-3"
              disabled={action.pending}
              onClick={() =>
                action.run(() => setUserActive({ data: { id: user.id, active: true } }))
              }
            >
              Reactivar
            </Button>
          )}
        </div>
      ) : null}
      {action.error ? (
        <p className="w-full text-sm font-semibold text-lost">{action.error}</p>
      ) : null}
    </div>
  )
}

// The new person types their own password here, in front of whoever adds them: it is never
// passed along by message.
function NewUser({ onDone }: { onDone: () => void }) {
  const [values, setValues] = useState({ name: '', email: '', role: 'editor', password: '' })
  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const save = useAction()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = newUserSchema.safeParse(values)

    if (!parsed.success) {
      setErrors(
        new Map(parsed.error.issues.map((issue) => [String(issue.path.at(0)), issue.message])),
      )

      return
    }

    setErrors(new Map())
    await save.run(() => createUser({ data: parsed.data }))
  }

  if (save.done) {
    return (
      <p
        role="status"
        className="mt-6 rounded-md border-l-[6px] border-adopted bg-adopted-soft p-4"
      >
        <strong className="text-adopted">Cuenta creada.</strong> {values.name} ya puede entrar en
        /login con su email y la contraseña que escribió.{' '}
        <button type="button" onClick={onDone} className="font-semibold underline">
          Listo
        </button>
      </p>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mt-6 flex flex-col gap-5 rounded-lg border bg-card p-5"
    >
      <h2 className="font-heading text-xl font-bold">Sumar una persona</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Nombre"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          error={errors.get('name')}
        />
        <TextField
          label="Email"
          type="email"
          autoCapitalize="none"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
          error={errors.get('email')}
        />
      </div>
      <ChoiceField
        legend="Rol"
        name="role"
        options={ROLE_OPTIONS}
        value={values.role}
        onChange={(role) => setValues({ ...values, role })}
        error={errors.get('role')}
      />
      <TextField
        label="Contraseña"
        hint={`Que la escriba la persona nueva, en este momento. Al menos ${MIN_PASSWORD_LENGTH} caracteres.`}
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={(event) => setValues({ ...values, password: event.target.value })}
        error={errors.get('password')}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={save.pending} className="h-12 px-6 font-bold">
          {save.pending ? 'Creando…' : 'Crear la cuenta'}
        </Button>
        <Button type="button" variant="ghost" className="h-12 px-4" onClick={onDone}>
          Cancelar
        </Button>
        {save.error ? <p className="text-sm font-semibold text-lost">{save.error}</p> : null}
      </div>
    </form>
  )
}
