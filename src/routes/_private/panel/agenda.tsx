import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { AgendaForm, EMPTY_EVENT, toLocalInput } from '@/components/panel/agenda-form'
import { PanelHeader } from '@/components/panel/panel-page'
import { useAction } from '@/components/panel/use-action'
import { Button } from '@/components/ui/button'
import {
  AGENDA_TYPE_LABEL,
  ORGANIZER_LABEL,
  createAgendaEvent,
  editAgendaEvent,
  listAgendaEvents,
  removeAgendaEvent,
  type AgendaEvent,
  type AgendaInput,
} from '@/lib/agenda'
import { formatDate, formatTimeRange } from '@/lib/format'

export const Route = createFileRoute('/_private/panel/agenda')({
  loader: () => listAgendaEvents(),
  component: AgendaAdmin,
})

// `null` is the list alone, 'new' the empty form, an event the form filled in to edit it.
type Editing = null | 'new' | AgendaEvent

function formValues(event: AgendaEvent) {
  return {
    type: event.type,
    title: event.title,
    startsAt: toLocalInput(event.startsAt),
    endsAt: event.endsAt ? toLocalInput(event.endsAt) : '',
    venue: event.venue ?? '',
    address: event.address ?? '',
    neighborhood: event.neighborhood ?? '',
    organizer: event.organizer,
    requirements: event.requirements ?? '',
    appointmentUrl: event.appointmentUrl ?? '',
    appointmentPhone: event.appointmentPhone ?? '',
    source: event.source ?? '',
  }
}

function AgendaAdmin() {
  const events = Route.useLoaderData()
  const router = useRouter()
  const [editing, setEditing] = useState<Editing>(null)
  const removeAction = useAction()

  async function save(input: AgendaInput) {
    if (editing === 'new') {
      await createAgendaEvent({ data: input })
    } else if (editing) {
      await editAgendaEvent({ data: { id: editing.id, values: input } })
    }

    await router.invalidate({ sync: true })
    setEditing(null)
  }

  async function remove(event: AgendaEvent) {
    await removeAction.run(() => removeAgendaEvent({ data: { id: event.id } }))
  }

  return (
    <div>
      <PanelHeader
        title="Agenda"
        description="Castraciones, vacunaciones y jornadas que se ven en el sitio."
        actions={
          editing === null ? (
            <Button className="h-11 gap-2 px-4 font-bold" onClick={() => setEditing('new')}>
              <Plus className="size-5" aria-hidden="true" />
              Nuevo evento
            </Button>
          ) : null
        }
      />

      {editing !== null ? (
        <section aria-labelledby="evento" className="mt-6">
          <h2 id="evento" className="mb-3 font-heading text-xl font-bold">
            {editing === 'new' ? 'Nuevo evento' : 'Editar el evento'}
          </h2>
          <AgendaForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? EMPTY_EVENT : formValues(editing)}
            submitLabel={editing === 'new' ? 'Publicar evento' : 'Guardar cambios'}
            onSave={save}
          />
          <Button variant="ghost" className="mt-3 min-h-11" onClick={() => setEditing(null)}>
            Cancelar
          </Button>
        </section>
      ) : null}

      <p aria-live="polite" className="mt-4 font-semibold text-lost">
        {removeAction.error}
      </p>

      {events.length > 0 ? (
        <ul className="mt-6 divide-y overflow-hidden rounded-lg border bg-card">
          {events.map((event) => (
            <li key={event.id} className="flex items-center gap-4 px-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-heading text-lg font-bold">{event.title}</p>
                <p className="text-sm text-ink-2">
                  {AGENDA_TYPE_LABEL[event.type]}, {ORGANIZER_LABEL[event.organizer]}
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  {formatDate(event.startsAt)}, {formatTimeRange(event.startsAt, event.endsAt)}
                  {event.venue ? `. ${event.venue}` : ''}
                </p>
              </div>
              <Button
                variant="outline"
                className="min-h-11 font-semibold"
                disabled={removeAction.pending}
                onClick={() => setEditing(event)}
              >
                Editar
              </Button>
              <Button
                variant="ghost"
                className="min-h-11 text-lost"
                aria-label={`Quitar ${event.title}`}
                disabled={removeAction.pending}
                onClick={() => remove(event)}
              >
                <Trash2 className="size-5" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-input bg-card p-8">
          <CalendarDays className="size-6 text-teal-700" aria-hidden="true" />
          <p className="mt-2 font-heading text-xl font-bold">Todavía no hay eventos</p>
          <p className="mt-1 text-ink-2">Los eventos que cargues se ven en la agenda del sitio.</p>
        </div>
      )}
    </div>
  )
}
