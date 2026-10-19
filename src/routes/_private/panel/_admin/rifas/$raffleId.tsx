import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { RaffleForm } from '@/components/panel/raffle-form'
import { RaffleGrid } from '@/components/panel/raffle-grid'
import { RaffleStatusPanel } from '@/components/panel/raffle-status-panel'
import { RaffleSummary } from '@/components/panel/raffle-summary'
import { RaffleTicketEditor } from '@/components/panel/raffle-ticket-editor'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDate, formatMoney } from '@/lib/format'
import { METHOD_LABEL } from '@/lib/goals'
import {
  RAFFLE_STATUS_LABEL,
  TICKET_STATUS_LABEL,
  editRaffle,
  formatTicket,
  getRaffle,
  saveRaffleTicket,
  type Ticket,
  type TicketInput,
} from '@/lib/raffles'

export const Route = createFileRoute('/_private/panel/_admin/rifas/$raffleId')({
  loader: ({ params }) => getRaffle({ data: { id: params.raffleId } }),
  component: RafflePage,
  notFoundComponent: () => (
    <div>
      <h1 className="font-heading text-3xl font-bold">Esta rifa no existe</h1>
      <Link
        to="/panel/rifas"
        className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline"
      >
        Volver a las rifas
      </Link>
    </div>
  ),
})

function RafflePage() {
  const { raffle, tickets, goals } = Route.useLoaderData()
  const router = useRouter()
  const [selected, setSelected] = useState<number | null>(null)
  const [ticketError, setTicketError] = useState<string | null>(null)
  const byNumber = new Map(tickets.map((ticket) => [ticket.number, ticket]))
  const sellers = [...new Set(tickets.flatMap((ticket) => (ticket.seller ? [ticket.seller] : [])))]
  const current = selected === null ? undefined : byNumber.get(selected)
  const label = selected === null ? '' : formatTicket(selected, raffle.ticketCount)

  function open(number: number) {
    setTicketError(null)
    setSelected(number)
  }

  // On a failed save the sheet stays open with the message; the page reloads, so if someone else
  // changed the number the editor shows what is stored now.
  async function saveTicket(input: TicketInput) {
    if (selected === null) {
      return
    }

    try {
      await saveRaffleTicket({
        data: {
          raffleId: raffle.id,
          number: selected,
          ticket: input,
          expected: current?.updatedAt ?? null,
        },
      })
      setSelected(null)
    } catch (caught) {
      setTicketError(caught instanceof Error ? caught.message : 'No se pudo guardar.')
    }

    await router.invalidate({ sync: true })
  }

  return (
    <div>
      <Link
        to="/panel/rifas"
        className="mb-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Rifas
      </Link>
      <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{raffle.title}</h1>
      <p className="mt-1 text-ink-2">
        {RAFFLE_STATUS_LABEL[raffle.status]}. {formatMoney(raffle.ticketPrice)} el número
        {raffle.drawOn ? `, sorteo el ${formatDate(raffle.drawOn)}` : ''}
        {raffle.drawMethod ? ` por ${raffle.drawMethod}` : ''}.{' '}
        {raffle.permit ? `Permiso ${raffle.permit}.` : 'Sin permiso cargado.'}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          <RaffleStatusPanel raffle={raffle} tickets={tickets} />
          <RaffleGrid raffle={raffle} tickets={byNumber} onSelect={open} />
        </div>
        <div className="flex flex-col gap-6">
          <RaffleSummary raffle={raffle} tickets={tickets} />
          {raffle.status === 'drawn' ? null : (
            <section aria-labelledby="datos">
              <h2 id="datos" className="mb-3 font-heading text-xl font-bold">
                Datos de la rifa
              </h2>
              <RaffleForm
                key={`${raffle.id}:${raffle.status}`}
                initial={{
                  title: raffle.title,
                  prizes: raffle.prizes,
                  ticketPrice: String(raffle.ticketPrice),
                  ticketCount: String(raffle.ticketCount),
                  drawOn: raffle.drawOn ?? '',
                  drawMethod: raffle.drawMethod ?? '',
                  permit: raffle.permit ?? '',
                  goalId: raffle.goalId ?? '',
                }}
                goals={goals}
                sizeLocked={raffle.status !== 'draft'}
                submitLabel="Guardar cambios"
                onSave={async (values) => {
                  await editRaffle({ data: { id: raffle.id, values } })
                  await router.invalidate({ sync: true })
                }}
              />
            </section>
          )}
        </div>
      </div>

      <Sheet
        open={selected !== null}
        onOpenChange={(isOpen) => (isOpen ? null : setSelected(null))}
      >
        <SheetContent
          side="bottom"
          // The editor scrolls its own fields and keeps its buttons in view; on a computer the
          // sheet floats off the bottom edge instead of sitting on it.
          className="max-h-[90dvh] gap-0 rounded-t-xl sm:bottom-6 sm:mx-auto sm:max-h-[calc(100dvh-3rem)] sm:max-w-xl sm:rounded-xl sm:border"
        >
          <SheetHeader className="shrink-0 px-5 pt-5 pb-4">
            <SheetTitle className="font-heading text-2xl font-bold tabular-nums">
              Número {label}
            </SheetTitle>
            <SheetDescription>
              Ahora: {TICKET_STATUS_LABEL[current?.status ?? 'free'].toLowerCase()}
            </SheetDescription>
          </SheetHeader>
          {ticketError ? (
            <p
              role="alert"
              className="mx-5 mb-4 shrink-0 rounded-md bg-lost-soft p-3 font-semibold text-lost"
            >
              {ticketError}
            </p>
          ) : null}
          {raffle.status === 'selling' ? (
            <RaffleTicketEditor
              key={`${selected}:${current?.updatedAt ?? 'free'}`}
              label={label}
              ticket={current}
              sellers={sellers}
              onSave={saveTicket}
              onCancel={() => setSelected(null)}
            />
          ) : (
            <div className="min-h-0 overflow-y-auto px-5 pb-6">
              <TicketDetails ticket={current} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Outside the sale the numbers are read-only.
function TicketDetails({ ticket }: { ticket: Ticket | undefined }) {
  if (!ticket) {
    return <p className="text-ink-2">Este número no se vendió.</p>
  }

  return (
    <dl className="grid gap-3">
      <Detail term="Comprador" value={ticket.buyerName ?? 'Sin anotar'} />
      <Detail term="Teléfono" value={ticket.buyerPhone ?? 'Sin anotar'} />
      <Detail term="Vendió" value={ticket.seller ?? 'Sin anotar'} />
      {ticket.paymentMethod && ticket.paidOn ? (
        <Detail
          term="Pago"
          value={`${METHOD_LABEL[ticket.paymentMethod]}, el ${formatDate(ticket.paidOn)}`}
        />
      ) : null}
    </dl>
  )
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-ink-2">{term}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
