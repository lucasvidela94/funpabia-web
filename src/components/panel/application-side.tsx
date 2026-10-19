import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  assignApplicationAnimal,
  saveApplicationNotes,
  type ApplicationDetail,
} from '@/lib/applications'
import { StageBadge } from './application-badges'
import { useAction } from './use-action'

// The animal the request is for (or picking one), the other requests for the same animal, and the
// committee's internal notes.

export function ApplicationAnimal({ detail }: { detail: ApplicationDetail }) {
  const [animalId, setAnimalId] = useState('')
  const assign = useAction()

  if (detail.animal) {
    return (
      <section aria-labelledby="animal" className="rounded-lg border bg-card p-5">
        <h2 id="animal" className="font-heading text-xl font-bold">
          Para {detail.animal.name}
        </h2>
        <div className="mt-2 flex flex-wrap gap-x-4">
          <Link
            to="/panel/animales/$animalId"
            params={{ animalId: detail.animal.id }}
            className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
          >
            Ver en el panel
          </Link>
        </div>

        {/* Another request already took the animal: this one needs the kind message. */}
        {detail.stage !== 'delivered' &&
        (detail.animal.status === 'adopted' || detail.animal.status === 'fostered') ? (
          <p
            role="status"
            className="mt-3 rounded-md border-l-[6px] border-urgent bg-urgent-soft p-3 text-sm"
          >
            <strong className="text-urgent">
              {detail.animal.name} ya está{' '}
              {detail.animal.status === 'adopted' ? 'adoptado' : 'en tránsito'}.
            </strong>{' '}
            Avisale a esta persona con el mensaje "Ya encontró familia" y cerrá la solicitud.
          </p>
        ) : null}

        {detail.siblings.length > 0 ? (
          <div className="mt-3 border-t pt-3">
            <h3 className="font-sans text-sm font-semibold">
              Otras solicitudes por {detail.animal.name}
            </h3>
            <ul className="mt-2 flex flex-col">
              {detail.siblings.map((sibling) => (
                <li key={sibling.id}>
                  <Link
                    to="/panel/solicitudes/$applicationId"
                    params={{ applicationId: sibling.id }}
                    className="flex min-h-11 items-center justify-between gap-2 hover:underline"
                  >
                    {sibling.person}
                    <StageBadge stage={sibling.stage} />
                  </Link>
                </li>
              ))}
            </ul>
            {detail.stage === 'approved' || detail.stage === 'delivered' ? (
              <p className="mt-2 text-sm text-ink-2">
                Avisales con el mensaje "Ya encontró familia" desde cada solicitud.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <section aria-labelledby="animal" className="rounded-lg border bg-card p-5">
      <h2 id="animal" className="font-heading text-xl font-bold">
        Sin animal elegido
      </h2>
      <p className="mt-1 text-sm text-ink-2">Hace falta uno para aprobar o entregar.</p>
      {detail.stage === 'delivered' ? null : (
        <div className="mt-3 flex flex-wrap gap-2">
          <label htmlFor="asignar" className="sr-only">
            Animal
          </label>
          <select
            id="asignar"
            value={animalId}
            onChange={(event) => setAnimalId(event.target.value)}
            className="h-11 min-w-0 flex-1 rounded-md border border-input bg-card px-3"
          >
            <option value="">Elegí un animal</option>
            {detail.assignable.map((animal) => (
              <option key={animal.id} value={animal.id}>
                {animal.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            className="h-11 px-4"
            disabled={animalId === '' || assign.pending}
            onClick={() =>
              assign.run(() => assignApplicationAnimal({ data: { id: detail.id, animalId } }))
            }
          >
            Asignar
          </Button>
        </div>
      )}
      {assign.error ? <p className="mt-2 text-sm font-semibold text-lost">{assign.error}</p> : null}
    </section>
  )
}

export function ApplicationNotes({ detail }: { detail: ApplicationDetail }) {
  const [notes, setNotes] = useState(detail.notes)
  const save = useAction()

  return (
    <section aria-labelledby="notas" className="rounded-lg border bg-card p-5">
      <h2 id="notas" className="font-heading text-xl font-bold">
        Notas internas
      </h2>
      <p className="mt-1 text-sm text-ink-2">Solo las ve la comisión.</p>
      <label htmlFor="notas-texto" className="sr-only">
        Notas
      </label>
      <textarea
        id="notas-texto"
        rows={5}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        className="mt-3 w-full rounded-md border border-input bg-card px-3 py-2"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          className="h-11 px-5"
          disabled={save.pending || notes.trim() === detail.notes}
          onClick={() => save.run(() => saveApplicationNotes({ data: { id: detail.id, notes } }))}
        >
          Guardar notas
        </Button>
        <p aria-live="polite" className="text-sm font-semibold">
          {save.error ? <span className="text-lost">{save.error}</span> : null}
          {save.done && notes.trim() === detail.notes ? (
            <span className="text-adopted">Guardadas.</span>
          ) : null}
        </p>
      </div>
    </section>
  )
}
