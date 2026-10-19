import { Link } from '@tanstack/react-router'
import { CalendarClock, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FOLLOW_UP_TYPE_LABEL, RESULT_LABEL, recordFollowUp, type FollowUp } from '@/lib/follow-ups'
import { formatDate } from '@/lib/format'
import { whatsAppUrl } from '@/lib/phone'
import { cn } from '@/lib/utils'
import { useAction } from './use-action'

const DAY = 24 * 60 * 60 * 1000

// "Venció hace 3 días", "Es hoy", "En 5 días": dates are 'YYYY-MM-DD' in Argentina.
function due(scheduledOn: string, today: string) {
  const days = Math.round((Date.parse(scheduledOn) - Date.parse(today)) / DAY)

  if (days < 0) {
    return { text: days === -1 ? 'Venció ayer' : `Venció hace ${-days} días`, overdue: true }
  }

  return { text: days === 0 ? 'Es hoy' : days === 1 ? 'Mañana' : `En ${days} días`, overdue: false }
}

function message(item: FollowUp) {
  const text =
    item.type === 'neutering'
      ? `Hola ${item.person.firstName}, te escribimos de Funpabia: ya se acerca la castración de ${item.animal.name}. ¿Coordinamos el turno?`
      : `Hola ${item.person.firstName}, te escribimos de Funpabia para saber cómo está ${item.animal.name}. ¿Nos contás cómo se adaptó? Si podés, mandanos una foto.`

  return text
}

const RESULTS = ['ok', 'problems', 'no_response', 'returned'] as const

export function FollowUpItem({ item, today }: { item: FollowUp; today: string }) {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<(typeof RESULTS)[number] | null>(null)
  const [notes, setNotes] = useState('')
  const save = useAction()
  const when = due(item.scheduledOn, today)
  const done = item.completedOn !== null

  return (
    <article
      className={cn(
        'rounded-md border border-l-[6px] bg-card p-4',
        when.overdue && !done ? 'border-l-lost' : 'border-l-line-strong',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">
            {FOLLOW_UP_TYPE_LABEL[item.type]}: {item.animal.name}
          </p>
          <p className="text-sm text-ink-2">
            {item.kind === 'adoption' ? 'Adoptó' : 'Transita'} {item.person.name}
          </p>
        </div>
        {done ? (
          <span className="text-sm text-ink-2">
            {RESULT_LABEL[item.result ?? 'ok']}, {formatDate(item.completedOn ?? item.scheduledOn)}
            {item.completedBy ? ` (${item.completedBy})` : ''}
          </span>
        ) : (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-sm font-semibold',
              when.overdue ? 'text-lost' : 'text-ink-2',
            )}
          >
            <CalendarClock className="size-4" aria-hidden="true" />
            {when.text} ({formatDate(item.scheduledOn)})
          </span>
        )}
      </div>

      {done && item.notes ? <p className="mt-2 text-sm whitespace-pre-line">{item.notes}</p> : null}

      {done ? null : (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.person.whatsapp ? (
            <a
              href={whatsAppUrl(item.person.whatsapp, message(item))}
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 font-semibold text-primary-foreground hover:bg-teal-900"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Escribir
            </a>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="h-11 px-4 font-semibold"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            Registrar resultado
          </Button>
          {item.applicationId ? (
            <Link
              to="/panel/solicitudes/$applicationId"
              params={{ applicationId: item.applicationId }}
              className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-primary underline underline-offset-4"
            >
              Ver la solicitud
            </Link>
          ) : null}
        </div>
      )}

      {open && !done ? (
        <div className="mt-3 rounded-md bg-muted p-4">
          <fieldset>
            <legend className="mb-2 font-semibold">¿Cómo está?</legend>
            <div className="flex flex-wrap gap-2">
              {RESULTS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={result === option}
                  onClick={() => setResult(option)}
                  className={cn(
                    'inline-flex h-11 items-center rounded-pill border px-4 font-semibold',
                    result === option
                      ? 'border-teal-900 bg-teal-900 text-white'
                      : 'border-input bg-card hover:border-teal-700',
                  )}
                >
                  {RESULT_LABEL[option]}
                </button>
              ))}
            </div>
          </fieldset>
          {result === 'returned' ? (
            <p className="mt-3 text-sm">
              La adopción se marca como devuelta, {item.animal.name} pasa a "devuelto" y se cancelan
              los seguimientos que quedaban.
            </p>
          ) : null}
          <label htmlFor={`notas-${item.id}`} className="mt-3 block text-sm font-semibold">
            Notas (opcional)
          </label>
          <textarea
            id={`notas-${item.id}`}
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2"
          />
          <Button
            type="button"
            className="mt-3 h-11 px-5 font-bold"
            disabled={!result || save.pending}
            onClick={() =>
              result && save.run(() => recordFollowUp({ data: { id: item.id, result, notes } }))
            }
          >
            {save.pending ? 'Guardando…' : 'Guardar'}
          </Button>
          {save.error ? <p className="mt-2 text-sm font-semibold text-lost">{save.error}</p> : null}
        </div>
      ) : null}
    </article>
  )
}
