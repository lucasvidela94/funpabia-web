import { Download } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/format'
import { METHOD_LABEL } from '@/lib/goals'
import { TICKET_STATUS_LABEL, formatTicket, type Raffle, type Ticket } from '@/lib/raffles'
import { slugify } from '@/lib/slug'

// How the raffle is going: sold, collected, still to collect, and the same per seller, which is how
// the committee settles accounts with each volunteer.

const NO_SELLER = 'Sin anotar'

export function RaffleSummary({ raffle, tickets }: { raffle: Raffle; tickets: Ticket[] }) {
  const free = raffle.ticketCount - raffle.paid - raffle.reserved
  const sellers = bySeller(tickets, raffle.ticketPrice)

  return (
    <section aria-labelledby="cuentas" className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="cuentas" className="font-heading text-xl font-bold">
          Cuentas
        </h2>
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 px-4 font-semibold"
          disabled={tickets.length === 0}
          onClick={() => downloadCsv(raffle, tickets)}
        >
          <Download className="size-4" aria-hidden="true" />
          Descargar planilla
        </Button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <Figure term="Cobrado" value={formatMoney(raffle.paid * raffle.ticketPrice)}>
          {raffle.paid} {raffle.paid === 1 ? 'número pagado' : 'números pagados'}
        </Figure>
        <Figure term="Falta cobrar" value={formatMoney(raffle.reserved * raffle.ticketPrice)}>
          {raffle.reserved} {raffle.reserved === 1 ? 'reservado' : 'reservados'}
        </Figure>
        <Figure term="Libres" value={String(free)}>
          de {raffle.ticketCount}, a {formatMoney(raffle.ticketPrice)} cada uno
        </Figure>
        <Figure
          term="Si se venden todos"
          value={formatMoney(raffle.ticketCount * raffle.ticketPrice)}
        />
      </dl>

      {sellers.length > 0 ? (
        <table className="mt-5 w-full text-left text-sm">
          <caption className="mb-2 text-left font-semibold">Por vendedora</caption>
          <thead className="text-muted-foreground">
            <tr>
              <th scope="col" className="py-1.5 font-semibold">
                Vendió
              </th>
              <th scope="col" className="py-1.5 text-right font-semibold">
                Pagados
              </th>
              <th scope="col" className="py-1.5 text-right font-semibold">
                Reservados
              </th>
              <th scope="col" className="py-1.5 text-right font-semibold">
                Cobrado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y tabular-nums">
            {sellers.map((row) => (
              <tr key={row.seller}>
                <th scope="row" className="py-2 font-normal">
                  {row.seller}
                </th>
                <td className="py-2 text-right">{row.paid}</td>
                <td className="py-2 text-right">{row.reserved}</td>
                <td className="py-2 text-right font-semibold">{formatMoney(row.collected)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  )
}

function Figure({ term, value, children }: { term: string; value: string; children?: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-ink-2">{term}</dt>
      <dd className="font-heading text-2xl font-bold tabular-nums">{value}</dd>
      {children ? <dd className="text-sm text-ink-2">{children}</dd> : null}
    </div>
  )
}

function bySeller(tickets: Ticket[], price: number) {
  const rows = new Map<
    string,
    { seller: string; paid: number; reserved: number; collected: number }
  >()

  for (const ticket of tickets) {
    const seller = ticket.seller ?? NO_SELLER
    const row = rows.get(seller) ?? { seller, paid: 0, reserved: 0, collected: 0 }

    if (ticket.status === 'paid') {
      row.paid += 1
      row.collected += price
    } else {
      row.reserved += 1
    }

    rows.set(seller, row)
  }

  return [...rows.values()].sort((a, b) => a.seller.localeCompare(b.seller, 'es'))
}

// The whole ledger as a spreadsheet, to settle accounts or keep with the permit papers. It carries
// buyers' names and phones: it is built in the browser and never leaves the committee's device.
function downloadCsv(raffle: Raffle, tickets: Ticket[]) {
  const header = [
    'Número',
    'Estado',
    'Comprador',
    'Teléfono',
    'Vendió',
    'Cómo pagó',
    'Fecha de pago',
  ]

  const rows = tickets.map((ticket) => [
    formatTicket(ticket.number, raffle.ticketCount),
    TICKET_STATUS_LABEL[ticket.status],
    ticket.buyerName ?? '',
    ticket.buyerPhone ?? '',
    ticket.seller ?? '',
    ticket.paymentMethod ? METHOD_LABEL[ticket.paymentMethod] : '',
    ticket.paidOn ?? '',
  ])

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
  // The byte order mark makes Excel read the accents right.
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${slugify(raffle.title) || 'rifa'}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// Quoted, and a leading = + - @ neutralized so a spreadsheet never runs a typed name as a formula.
function csvCell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value

  return `"${safe.replaceAll('"', '""')}"`
}
