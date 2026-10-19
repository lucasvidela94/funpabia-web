import { Link, createFileRoute } from '@tanstack/react-router'
import { ChevronRight, Plus, Ticket } from 'lucide-react'
import { PanelHeader } from '@/components/panel/panel-page'
import { formatDate, formatMoney } from '@/lib/format'
import { RAFFLE_STATUS_LABEL, listRaffles, type RaffleStatus } from '@/lib/raffles'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_private/panel/_admin/rifas/')({
  loader: () => listRaffles(),
  component: Raffles,
})

const STATUS_STYLE: Record<RaffleStatus, string> = {
  draft: 'bg-sand text-ink-2',
  selling: 'bg-teal-100 text-teal-900',
  closed: 'bg-yellow-100 text-ink',
  drawn: 'bg-lilac-100 text-lilac-700',
}

function Raffles() {
  const raffles = Route.useLoaderData()

  return (
    <div>
      <PanelHeader
        title="Rifas"
        description="El cuaderno de cada rifa: quién tiene cada número y cuánto se cobró."
        actions={
          <Link
            to="/panel/rifas/nueva"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 font-bold text-primary-foreground hover:bg-teal-900"
          >
            <Plus className="size-5" aria-hidden="true" />
            Nueva rifa
          </Link>
        }
      />

      {raffles.length > 0 ? (
        <ul className="mt-6 divide-y overflow-hidden rounded-lg border bg-card">
          {raffles.map((raffle) => {
            const sold = raffle.paid + raffle.reserved

            return (
              <li key={raffle.id}>
                <Link
                  to="/panel/rifas/$raffleId"
                  params={{ raffleId: raffle.id }}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading text-lg font-bold">{raffle.title}</p>
                      <span
                        className={cn(
                          'inline-flex h-7 items-center rounded-pill px-2.5 text-[0.8125rem] font-semibold',
                          STATUS_STYLE[raffle.status],
                        )}
                      >
                        {RAFFLE_STATUS_LABEL[raffle.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-2">
                      <strong className="text-ink tabular-nums">
                        {sold} de {raffle.ticketCount}
                      </strong>{' '}
                      números vendidos, {formatMoney(raffle.paid * raffle.ticketPrice)} cobrado
                      {raffle.drawOn ? `. Sorteo el ${formatDate(raffle.drawOn)}` : ''}
                      {raffle.goalTitle ? `. Para ${raffle.goalTitle}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-gray-500" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-input bg-card p-8">
          <Ticket className="size-6 text-teal-700" aria-hidden="true" />
          <p className="mt-2 font-heading text-xl font-bold">Todavía no hay rifas</p>
          <p className="mt-1 max-w-prose text-ink-2">
            Cargá la rifa con sus premios y su precio, y marcá cada número a medida que se vende.
            Los talonarios siguen siendo de papel: esto es para llevar las cuentas en orden.
          </p>
        </div>
      )}
    </div>
  )
}
