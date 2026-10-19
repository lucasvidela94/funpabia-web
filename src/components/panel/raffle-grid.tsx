import { Check, Clock, Trophy } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TICKET_STATUS_LABEL, formatTicket, type Raffle, type Ticket } from '@/lib/raffles'
import { cn } from '@/lib/utils'

// Every number of the raffle, a hundred at a time so the phone shows a whole paper book page.
// Each state has its own icon and border, not only a color.

type Filter = 'all' | 'free' | 'reserved' | 'paid'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'free', label: 'Libres' },
  { value: 'reserved', label: 'Reservados' },
  { value: 'paid', label: 'Pagados' },
]

const PAGE = 100

export function RaffleGrid({
  raffle,
  tickets,
  onSelect,
}: {
  raffle: Raffle
  tickets: Map<number, Ticket>
  onSelect: (number: number) => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(0)
  const [jump, setJump] = useState('')
  const [jumpError, setJumpError] = useState<string | null>(null)
  const pages = Math.ceil(raffle.ticketCount / PAGE)

  const numbers =
    filter === 'all'
      ? range(page * PAGE, Math.min(raffle.ticketCount, (page + 1) * PAGE))
      : range(0, raffle.ticketCount).filter(
          (number) => (tickets.get(number)?.status ?? 'free') === filter,
        )

  function onJump(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const number = Number(jump.trim())

    if (jump.trim() === '' || !Number.isInteger(number) || number < 0) {
      setJumpError('Escribí un número.')

      return
    }

    if (number >= raffle.ticketCount) {
      setJumpError(
        `Esta rifa llega hasta el ${formatTicket(raffle.ticketCount - 1, raffle.ticketCount)}.`,
      )

      return
    }

    setJumpError(null)
    setJump('')
    setFilter('all')
    setPage(Math.floor(number / PAGE))
    onSelect(number)
  }

  return (
    <section aria-labelledby="numeros" className="rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="numeros" className="font-heading text-xl font-bold">
          Números
        </h2>
        <form onSubmit={onJump} noValidate className="flex items-end gap-2">
          <div>
            <label htmlFor="ir-al-numero" className="mb-1 block text-sm font-semibold">
              Ir al número
            </label>
            <Input
              id="ir-al-numero"
              inputMode="numeric"
              value={jump}
              onChange={(event) => setJump(event.target.value)}
              aria-invalid={jumpError ? true : undefined}
              aria-describedby={jumpError ? 'ir-al-numero-error' : undefined}
              className="h-11 w-24 bg-card text-base"
            />
          </div>
          <Button type="submit" variant="outline" className="h-11 px-4 font-semibold">
            Abrir
          </Button>
        </form>
      </div>
      {jumpError ? (
        <p id="ir-al-numero-error" className="mt-1.5 text-sm font-semibold text-lost">
          {jumpError}
        </p>
      ) : null}

      <div role="group" aria-label="Mostrar" className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={filter === option.value ? 'default' : 'outline'}
            aria-pressed={filter === option.value}
            className="h-10 px-3.5 font-semibold"
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {filter === 'all' && pages > 1 ? (
        <div role="group" aria-label="Página" className="mt-3 flex flex-wrap gap-1.5">
          {range(0, pages).map((index) => (
            <Button
              key={index}
              type="button"
              variant={page === index ? 'secondary' : 'ghost'}
              aria-pressed={page === index}
              className="h-10 px-2.5 text-sm tabular-nums"
              onClick={() => setPage(index)}
            >
              {formatTicket(index * PAGE, raffle.ticketCount)}–
              {formatTicket(
                Math.min(raffle.ticketCount, (index + 1) * PAGE) - 1,
                raffle.ticketCount,
              )}
            </Button>
          ))}
        </div>
      ) : null}

      <Legend />

      {numbers.length > 0 ? (
        <ul className="mt-4 grid grid-cols-5 gap-1.5 sm:grid-cols-10">
          {numbers.map((number) => (
            <li key={number}>
              <NumberCell
                label={formatTicket(number, raffle.ticketCount)}
                ticket={tickets.get(number)}
                winner={raffle.winningNumber === number}
                onClick={() => onSelect(number)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-ink-2">No hay números en este estado.</p>
      )}
    </section>
  )
}

function NumberCell({
  label,
  ticket,
  winner,
  onClick,
}: {
  label: string
  ticket: Ticket | undefined
  winner: boolean
  onClick: () => void
}) {
  const status = ticket?.status ?? 'free'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Número ${label}, ${TICKET_STATUS_LABEL[status].toLowerCase()}${winner ? ', ganador' : ''}`}
      className={cn(
        'relative flex h-11 w-full items-center justify-center gap-1 rounded-md border text-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        status === 'free' && 'border-input bg-card text-ink hover:border-teal-700',
        status === 'reserved' &&
          'border-dashed border-ink-2 bg-yellow-100 text-ink hover:bg-yellow-400',
        status === 'paid' && 'border-teal-900 bg-teal-700 text-white hover:bg-teal-900',
        winner && 'ring-2 ring-lilac-700 ring-offset-2',
      )}
    >
      {winner ? <Trophy className="size-3.5" aria-hidden="true" /> : null}
      {status === 'reserved' ? <Clock className="size-3.5" aria-hidden="true" /> : null}
      {status === 'paid' ? <Check className="size-3.5" aria-hidden="true" /> : null}
      {label}
    </button>
  )
}

function Legend() {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-4 rounded-sm border border-input bg-card" />
        Libre
      </li>
      <li className="flex items-center gap-1.5">
        <Clock className="size-4" aria-hidden="true" />
        Reservado, falta cobrar
      </li>
      <li className="flex items-center gap-1.5">
        <Check className="size-4 text-teal-700" aria-hidden="true" />
        Pagado
      </li>
    </ul>
  )
}

function range(from: number, to: number) {
  return Array.from({ length: Math.max(0, to - from) }, (_, index) => from + index)
}
