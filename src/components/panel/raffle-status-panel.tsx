import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ConfirmButton } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  deleteRaffle,
  recordRaffleProceeds,
  setRaffleStatus,
  type Raffle,
  type RaffleStatus,
  type Ticket,
} from '@/lib/raffles'
import { Proceeds, Winner, WinnerForm } from './raffle-outcome'
import { useAction } from './use-action'

// The raffle's one-way path: draft, selling, closed, drawn. Each step says what it does before
// doing it; closing and putting the money in the goal are the ones that cannot be quietly undone.

const HEADING: Record<RaffleStatus, string> = {
  draft: 'Borrador',
  selling: 'En venta',
  closed: 'Venta cerrada',
  drawn: 'Sorteada',
}

const EXPLANATION: Record<RaffleStatus, string> = {
  draft:
    'Revisá los datos. Cuando abras la venta, el precio y la cantidad de números quedan fijos.',
  selling: 'Marcá cada número a medida que se vende o se cobra.',
  closed: 'Ya no se marcan números. Cuando salga el sorteo, cargá el número ganador.',
  drawn: 'El sorteo está registrado. La rifa queda de solo lectura.',
}

export function RaffleStatusPanel({ raffle, tickets }: { raffle: Raffle; tickets: Ticket[] }) {
  const action = useAction()
  const navigate = useNavigate()
  const [removeError, setRemoveError] = useState<string | null>(null)

  const move = (status: RaffleStatus, winningNumber: number | null = null) =>
    void action.run(() => setRaffleStatus({ data: { id: raffle.id, status, winningNumber } }))

  // Not through useAction: reloading this page after the delete would show "not found" first.
  async function removeDraft() {
    setRemoveError(null)

    try {
      await deleteRaffle({ data: { id: raffle.id } })
      await navigate({ to: '/panel/rifas' })
    } catch (caught) {
      setRemoveError(caught instanceof Error ? caught.message : 'No se pudo borrar.')
    }
  }

  return (
    <section aria-labelledby="estado" className="rounded-lg border bg-card p-5">
      <h2 id="estado" className="font-heading text-xl font-bold">
        {HEADING[raffle.status]}
      </h2>
      <p className="mt-1 text-ink-2">{EXPLANATION[raffle.status]}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {raffle.status === 'draft' ? (
          <>
            <ConfirmButton
              className="h-11 px-5 font-bold"
              disabled={action.pending}
              title="¿Abrir la venta?"
              description="Desde ahora se pueden marcar números. El precio y la cantidad de números quedan fijos."
              confirmLabel="Abrir la venta"
              onConfirm={() => move('selling')}
            >
              Abrir la venta
            </ConfirmButton>
            <ConfirmButton
              variant="ghost"
              className="h-11 text-lost"
              disabled={action.pending}
              title="¿Borrar el borrador?"
              description={`"${raffle.title}" se borra del panel. Todavía no vendió nada, así que no se pierde ningún número.`}
              confirmLabel="Borrar el borrador"
              destructive
              onConfirm={() => void removeDraft()}
            >
              Borrar el borrador
            </ConfirmButton>
          </>
        ) : null}

        {raffle.status === 'selling' ? (
          <ConfirmButton
            className="h-11 px-5 font-bold"
            disabled={action.pending}
            title="¿Cerrar la venta?"
            description={
              raffle.reserved > 0
                ? `No se pueden marcar más números. Quedan ${raffle.reserved} reservados sin cobrar: no se suman a la meta salvo que reabras la venta y los marques pagados.`
                : 'No se pueden marcar más números. Si hace falta, se puede reabrir mientras lo recaudado no esté en la meta.'
            }
            confirmLabel="Cerrar la venta"
            onConfirm={() => move('closed')}
          >
            Cerrar la venta
          </ConfirmButton>
        ) : null}

        {raffle.status === 'closed' && !raffle.proceedsRecordedAt ? (
          <Button
            variant="outline"
            className="h-11 px-5 font-semibold"
            disabled={action.pending}
            onClick={() => move('selling')}
          >
            Reabrir la venta
          </Button>
        ) : null}

        {raffle.status === 'drawn' ? (
          <ConfirmButton
            variant="outline"
            className="h-11 px-5 font-semibold"
            disabled={action.pending}
            title="¿Corregir el número ganador?"
            description='La rifa vuelve a "Venta cerrada" hasta que cargues el ganador de nuevo. Los números no cambian.'
            confirmLabel="Corregir el ganador"
            onConfirm={() => move('closed')}
          >
            Corregir el ganador
          </ConfirmButton>
        ) : null}
      </div>

      {raffle.status === 'closed' ? (
        <WinnerForm
          raffle={raffle}
          pending={action.pending}
          onSave={(number) => move('drawn', number)}
        />
      ) : null}

      {raffle.status === 'drawn' && raffle.winningNumber !== null ? (
        <Winner
          raffle={raffle}
          ticket={tickets.find((ticket) => ticket.number === raffle.winningNumber)}
        />
      ) : null}

      {raffle.status === 'closed' || raffle.status === 'drawn' ? (
        <Proceeds
          raffle={raffle}
          pending={action.pending}
          onRecord={() => void action.run(() => recordRaffleProceeds({ data: { id: raffle.id } }))}
        />
      ) : null}

      <p aria-live="polite" className="mt-3 text-sm font-semibold text-lost">
        {action.error}
        {removeError}
      </p>
    </section>
  )
}
