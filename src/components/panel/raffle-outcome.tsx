import { Link } from '@tanstack/react-router'
import { Trophy } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ConfirmButton, ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatMoney } from '@/lib/format'
import { formatTicket, type Raffle, type Ticket } from '@/lib/raffles'

// How a raffle ends: the winning number from the outside draw, and the paid total going into the goal.

export function WinnerForm({
  raffle,
  pending,
  onSave,
}: {
  raffle: Raffle
  pending: boolean
  onSave: (number: number) => void
}) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<number | null>(null)
  const last = formatTicket(raffle.ticketCount - 1, raffle.ticketCount)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const number = Number(value.trim())

    if (
      value.trim() === '' ||
      !Number.isInteger(number) ||
      number < 0 ||
      number >= raffle.ticketCount
    ) {
      setError(`Escribí un número del ${formatTicket(0, raffle.ticketCount)} al ${last}.`)

      return
    }

    setError(null)
    setConfirming(number)
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mt-4 flex flex-wrap items-end gap-2 rounded-md bg-muted p-4"
    >
      <div>
        <label htmlFor="ganador" className="mb-1 block font-semibold">
          Número ganador
        </label>
        <Input
          id="ganador"
          inputMode="numeric"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'ganador-error' : undefined}
          className="h-11 w-28 bg-card text-base"
        />
      </div>
      <Button type="submit" className="h-11 px-5 font-bold" disabled={pending}>
        Guardar el ganador
      </Button>
      {error ? (
        <p id="ganador-error" className="w-full text-sm font-semibold text-lost">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => (open ? null : setConfirming(null))}
        title={`¿Ganó el ${confirming === null ? '' : formatTicket(confirming, raffle.ticketCount)}?`}
        description="Revisalo contra el resultado oficial del sorteo. Si te equivocás, se puede corregir."
        confirmLabel="Sí, guardar el ganador"
        onConfirm={() => (confirming === null ? null : onSave(confirming))}
      />
    </form>
  )
}

export function Winner({ raffle, ticket }: { raffle: Raffle; ticket: Ticket | undefined }) {
  const label = formatTicket(raffle.winningNumber ?? 0, raffle.ticketCount)

  return (
    <div className="mt-4 flex items-start gap-3 rounded-md bg-lilac-100 p-4">
      <Trophy className="mt-0.5 size-6 shrink-0 text-lilac-700" aria-hidden="true" />
      <div>
        <p className="font-heading text-2xl font-bold tabular-nums">Ganó el {label}</p>
        <p className="text-ink-2">
          {ticket
            ? `${ticket.buyerName ?? 'Comprador sin anotar'}${ticket.buyerPhone ? `, ${ticket.buyerPhone}` : ''}${ticket.status === 'reserved' ? '. Figura reservado, sin cobrar.' : '.'}`
            : 'Ese número no se vendió.'}
        </p>
      </div>
    </div>
  )
}

export function Proceeds({
  raffle,
  pending,
  onRecord,
}: {
  raffle: Raffle
  pending: boolean
  onRecord: () => void
}) {
  const total = formatMoney(raffle.paid * raffle.ticketPrice)

  if (raffle.proceedsRecordedAt) {
    return (
      <p className="mt-4 rounded-md bg-adopted-soft p-4 font-semibold text-adopted">
        Lo cobrado ({total}) ya está sumado a{' '}
        {raffle.goalId ? (
          <Link to="/panel/metas/$goalId" params={{ goalId: raffle.goalId }} className="underline">
            {raffle.goalTitle}
          </Link>
        ) : (
          'la meta'
        )}
        .
      </p>
    )
  }

  if (!raffle.goalId) {
    return (
      <p className="mt-4 text-sm text-ink-2">
        Para sumar lo cobrado a una meta, elegila en los datos de la rifa.
      </p>
    )
  }

  return (
    <div className="mt-4 rounded-md bg-muted p-4">
      <p className="font-semibold">
        Sumar {total} a {raffle.goalTitle}
      </p>
      <p className="mt-1 text-sm text-ink-2">
        Entra como aportes a la meta, uno por cada forma de pago. Después no se pueden cambiar los
        números ni reabrir la venta.
      </p>
      <ConfirmButton
        className="mt-3 h-11 px-5 font-bold"
        disabled={pending || raffle.paid === 0}
        title={`¿Sumar ${total} a la meta?`}
        description={`Entra en "${raffle.goalTitle}" y la barra del sitio se actualiza. Se hace una sola vez: después los números quedan fijos.`}
        confirmLabel="Registrar lo recaudado"
        onConfirm={onRecord}
      >
        Registrar lo recaudado
      </ConfirmButton>
    </div>
  )
}
