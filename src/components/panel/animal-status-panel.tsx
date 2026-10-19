import { Link } from '@tanstack/react-router'
import { Eye, EyeOff, Flame } from 'lucide-react'
import type { ReactNode } from 'react'
import { setAnimalFlags, setAnimalStatus, type AnimalDetail } from '@/lib/animals'
import { STATUS_LABEL, type AnimalStatus } from '@/lib/catalog'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { StatusBadge } from './status-badge'
import { useAction } from './use-action'

// Spec 6.3: the status, published and urgent, the three things that decide where the animal
// shows up. Every status change lands in the history below.

const STATUSES: AnimalStatus[] = [
  'intake',
  'under_treatment',
  'available',
  'reserved',
  'adopted',
  'fostered',
  'not_adoptable',
  'returned',
  'deceased',
]

export function AnimalStatusPanel({ detail }: { detail: AnimalDetail }) {
  const { animal, history } = detail
  const status = useAction()
  const flags = useAction()
  const error = status.error ?? flags.error

  return (
    <section aria-labelledby="estado" className="rounded-lg border bg-card p-5">
      <h2 id="estado" className="font-heading text-xl font-bold">
        Estado
      </h2>

      <fieldset className="mt-3" disabled={status.pending}>
        <legend className="sr-only">Cambiar el estado</legend>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={animal.status === option}
              onClick={() =>
                status.run(() => setAnimalStatus({ data: { id: animal.id, status: option } }))
              }
              className={cn(
                'inline-flex h-11 items-center rounded-pill border px-4 font-semibold disabled:opacity-60',
                animal.status === option
                  ? 'border-teal-900 bg-teal-900 text-white'
                  : 'border-input bg-card hover:border-teal-700',
              )}
            >
              {STATUS_LABEL[option]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-2">
        <Toggle
          on={animal.published}
          disabled={flags.pending}
          onClick={() =>
            flags.run(() =>
              setAnimalFlags({ data: { id: animal.id, published: !animal.published } }),
            )
          }
          iconOn={<Eye className="size-5" aria-hidden="true" />}
          iconOff={<EyeOff className="size-5" aria-hidden="true" />}
          labelOn="Publicado en el sitio"
          labelOff="Sin publicar"
          action={animal.published ? 'Despublicar' : 'Publicar'}
        />
        <Toggle
          on={animal.urgent}
          disabled={flags.pending}
          onClick={() =>
            flags.run(() => setAnimalFlags({ data: { id: animal.id, urgent: !animal.urgent } }))
          }
          iconOn={<Flame className="size-5 text-urgent" aria-hidden="true" />}
          iconOff={<Flame className="size-5" aria-hidden="true" />}
          labelOn="Urgente: aparece primero"
          labelOff="No es urgente"
          action={animal.urgent ? 'Quitar urgente' : 'Marcar urgente'}
        />
      </div>

      {animal.published ? (
        <Link
          to="/adopta/$slug"
          params={{ slug: animal.slug }}
          target="_blank"
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
        >
          Ver la ficha pública
        </Link>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-lost">
          {error}
        </p>
      ) : null}

      {history.length > 0 ? (
        <details className="mt-4 border-t pt-3">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold">
            Historial de estados
          </summary>
          <ol className="mt-2 flex flex-col gap-2">
            {history.map((entry) => (
              <li
                key={`${entry.at}-${entry.status}`}
                className="flex flex-wrap items-center gap-2 text-sm text-ink-2"
              >
                <StatusBadge status={entry.status} />
                <span>
                  {formatDate(entry.at)}
                  {entry.by ? `, ${entry.by}` : ''}
                </span>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </section>
  )
}

function Toggle({
  on,
  disabled,
  onClick,
  iconOn,
  iconOff,
  labelOn,
  labelOff,
  action,
}: {
  on: boolean
  disabled: boolean
  onClick: () => void
  iconOn: ReactNode
  iconOff: ReactNode
  labelOn: string
  labelOff: string
  action: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
      <span className="flex items-center gap-2 text-sm font-semibold">
        {on ? iconOn : iconOff}
        {on ? labelOn : labelOff}
      </span>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex h-11 shrink-0 items-center rounded-md border border-input px-3 text-sm font-semibold hover:bg-muted disabled:opacity-60"
      >
        {action}
      </button>
    </div>
  )
}
