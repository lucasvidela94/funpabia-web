import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { PanelHeader } from '@/components/panel/panel-page'
import { useAction } from '@/components/panel/use-action'
import { Button } from '@/components/ui/button'
import { ConfirmButton } from '@/components/shared/confirm-dialog'
import { TextAreaField } from '@/components/shared/form-fields'
import { formatAge, formatDate } from '@/lib/format'
import {
  TAG_LABEL,
  anonymizePerson,
  getPerson,
  savePersonNotes,
  type PersonDetail,
} from '@/lib/people'

// Tags come from the base as plain strings; unknown values fall back to the raw tag.
const TAG_NAMES: Record<string, string> = TAG_LABEL

// Spec 7 and 9: contact, consent, notes, everything hanging from this person, and the
// "anonymize person" action (Ley 25.326). Committee only (the _admin layout).
export const Route = createFileRoute('/_private/panel/_admin/personas/$personId')({
  loader: ({ params }) => getPerson({ data: { id: params.personId } }),
  component: Person,
  notFoundComponent: () => (
    <div>
      <h1 className="font-heading text-3xl font-bold">Esta persona no existe</h1>
      <Link
        to="/panel/personas"
        className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline"
      >
        Volver a las personas
      </Link>
    </div>
  ),
})

const KIND_LABEL = { application: 'Solicitud', adoption: 'Adopción', foster: 'Tránsito' } as const

function Person() {
  const detail = Route.useLoaderData()
  const { person } = detail

  return (
    <div>
      <Link
        to="/panel/personas"
        className="mb-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Personas
      </Link>
      <PanelHeader title={person.name} description={contactLine(detail)} />

      {person.anonymizedAt ? (
        <p className="mt-4 rounded-md border-l-[6px] border-input bg-card p-4 text-ink-2">
          Anonimizada el {formatDate(person.anonymizedAt)}. Los datos personales se borraron; quedan
          los registros anónimos para que los números de la fundación sigan cerrando.
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <div className="order-2 flex flex-col gap-6 lg:order-1">
          <NotesCard detail={detail} />
          <LinksCard detail={detail} />
        </div>
        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <ContactCard detail={detail} />
          <AnonymizeCard detail={detail} />
        </div>
      </div>
    </div>
  )
}

function contactLine(detail: PersonDetail) {
  const { person } = detail
  const parts = [person.city, person.neighborhood].filter(Boolean).join(', ')
  const tags = person.tags.map((tag) => TAG_NAMES[tag] ?? tag).join(', ')

  return [parts, tags || null].filter(Boolean).join(' · ')
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="font-heading text-xl font-bold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function ContactCard({ detail }: { detail: PersonDetail }) {
  const { person } = detail

  if (person.anonymizedAt) {
    return (
      <Card title="Contacto">
        <p className="text-ink-2">Sin datos de contacto: fueron borrados.</p>
      </Card>
    )
  }

  return (
    <Card title="Contacto">
      <dl className="flex flex-col gap-2 text-[15px]">
        {person.whatsapp ? (
          <div className="flex gap-2">
            <dt className="font-semibold">WhatsApp:</dt>
            <dd>{person.whatsapp}</dd>
          </div>
        ) : null}
        {person.email ? (
          <div className="flex gap-2">
            <dt className="font-semibold">Email:</dt>
            <dd className="min-w-0 break-words">{person.email}</dd>
          </div>
        ) : null}
        <div className="flex gap-2">
          <dt className="font-semibold">Consentimiento:</dt>
          <dd>
            {formatDate(person.consent.at)} (versión {person.consent.version})
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-semibold">En el registro desde:</dt>
          <dd>
            {formatDate(person.createdAt)} ({formatAge(person.createdAt)})
          </dd>
        </div>
      </dl>
    </Card>
  )
}

function NotesCard({ detail }: { detail: PersonDetail }) {
  const { person } = detail
  const [notes, setNotes] = useState(person.notes)
  const save = useAction()

  if (person.anonymizedAt) {
    return null
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await save.run(() => savePersonNotes({ data: { id: person.id, notes } }))
  }

  return (
    <Card title="Notas internas">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
        <TextAreaField
          label="Notas internas"
          hint="Solo las ve la comisión. Nunca llevan datos que la persona no dio."
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={save.pending} className="min-h-11 font-semibold">
            {save.pending ? 'Guardando…' : 'Guardar notas'}
          </Button>
          {save.done ? (
            <p role="status" className="text-sm font-semibold text-adopted">
              Guardadas.
            </p>
          ) : null}
          {save.error ? (
            <p role="alert" className="text-sm font-semibold text-lost">
              {save.error}
            </p>
          ) : null}
        </div>
      </form>
    </Card>
  )
}

function LinksCard({ detail }: { detail: PersonDetail }) {
  return (
    <Card title="Su recorrido en la fundación">
      {detail.links.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {detail.links.map((link) => (
            <li key={`${link.kind}-${link.id}`} className="text-[15px]">
              {link.kind === 'foster' ? (
                <span>
                  <strong>{KIND_LABEL[link.kind]}</strong>
                  {link.animal_name ? ` de ${link.animal_name}` : ''} · {link.label} ·{' '}
                  {formatDate(link.at)}
                </span>
              ) : (
                <Link
                  to="/panel/solicitudes/$applicationId"
                  params={{ applicationId: link.id }}
                  className="font-semibold text-primary underline"
                >
                  {KIND_LABEL[link.kind]}
                  {link.animal_name ? ` de ${link.animal_name}` : ''}
                </Link>
              )}
              {link.kind !== 'foster' ? (
                <span className="text-ink-2">
                  {' '}
                  · {link.label} · {formatDate(link.at)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-2">Todavía no tiene solicitudes, adopciones ni tránsitos.</p>
      )}
    </Card>
  )
}

// Ley 25.326, right to deletion: erases personal data and free-text answers, keeps anonymous
// records. It cannot be undone.
function AnonymizeCard({ detail }: { detail: PersonDetail }) {
  const { person } = detail
  const navigate = useNavigate()
  const action = useAction()

  if (person.anonymizedAt) {
    return null
  }

  return (
    <section className="rounded-lg border border-lost bg-card p-5">
      <h2 className="font-heading text-xl font-bold">Zona de cuidado</h2>
      <p className="mt-2 text-sm text-ink-2">
        Si la persona pide que se borren sus datos, se anonimizan en el momento.
      </p>
      <ConfirmButton
        variant="outline"
        disabled={action.pending}
        className="mt-3 min-h-11 text-lost"
        title={`¿Anonimizar a ${person.name}?`}
        description="Se borran sus datos de contacto y sus respuestas. Las adopciones y los aportes quedan, sin nombre. No se puede deshacer."
        confirmLabel="Anonimizar"
        destructive
        onConfirm={() =>
          // Back to the list first, so the reload that follows refreshes the list.
          void action.run(async () => {
            await anonymizePerson({ data: { id: person.id } })
            await navigate({ to: '/panel/personas' })
          })
        }
      >
        {action.pending ? 'Anonimizando…' : 'Anonimizar a esta persona'}
      </ConfirmButton>
      {action.error ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-lost">
          {action.error}
        </p>
      ) : null}
    </section>
  )
}
