import { MapPin } from 'lucide-react'
import { AGENDA_TYPE_LABEL, ORGANIZER_LABEL, type AgendaEvent } from '@/lib/agenda'
import { dateParts, formatTimeRange } from '@/lib/format'

// One agenda event: a calendar tile with the day, then what, where and how to get a turn.
// Municipal campaigns use the "found" blue, the design system's color for public notices.
export function AgendaItem({ event }: { event: AgendaEvent }) {
  const date = dateParts(event.startsAt)
  const place = [event.venue, event.address, event.neighborhood].filter(Boolean).join(', ')

  return (
    <article className="flex gap-4 rounded-md border-l-[6px] border-found bg-found-soft p-4">
      <div className="flex w-16 shrink-0 flex-col items-center rounded-sm bg-card py-2 text-center shadow-card">
        <span className="text-xs font-semibold text-found capitalize">{date.weekday}</span>
        <span className="font-heading text-3xl leading-none font-bold">{date.day}</span>
        <span className="text-xs text-ink-2">{date.month}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-found">
          {AGENDA_TYPE_LABEL[event.type]}, {formatTimeRange(event.startsAt, event.endsAt)} h
        </p>
        <h3 className="mt-0.5 font-heading text-lg font-bold">{event.title}</h3>
        {place ? (
          <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-2">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {place}
          </p>
        ) : null}
        {event.requirements ? (
          <p className="mt-1 text-sm text-ink-2">{event.requirements}</p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          Organiza: {ORGANIZER_LABEL[event.organizer]}
        </p>
        {event.appointmentUrl ? (
          <a
            href={event.appointmentUrl}
            rel="noopener"
            className="mt-2 inline-flex min-h-11 items-center font-semibold text-found underline underline-offset-4"
          >
            Pedir turno
          </a>
        ) : null}
      </div>
    </article>
  )
}
