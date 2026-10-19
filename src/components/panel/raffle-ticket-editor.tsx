import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { formatDate, todayCalendar } from '@/lib/format'
import { METHOD_LABEL } from '@/lib/goals'
import {
  TICKET_STATUS_LABEL,
  ticketInputSchema,
  type TicketInput,
  type Ticket,
} from '@/lib/raffles'
import { ConfirmDialog } from '../shared/confirm-dialog'
import { ChoiceField, TextField } from '../shared/form-fields'

// One number: who has it and whether it is paid. Buyer details are optional and only the committee
// sees them; the paper stub is still the receipt.

type TicketStatus = TicketInput['status']

const STATUS_OPTIONS = (['free', 'reserved', 'paid'] as const).map((value) => ({
  value,
  label: TICKET_STATUS_LABEL[value],
}))

const METHOD_OPTIONS = (['cash', 'alias', 'cbu', 'mp_link'] as const).map((value) => ({
  value,
  label: METHOD_LABEL[value],
}))

function isTicketStatus(value: string): value is TicketStatus {
  return STATUS_OPTIONS.some((option) => option.value === value)
}

export function RaffleTicketEditor({
  label,
  ticket,
  sellers,
  onSave,
  onCancel,
}: {
  label: string
  ticket: Ticket | undefined
  sellers: string[]
  onSave: (input: TicketInput) => Promise<void>
  onCancel: () => void
}) {
  const [status, setStatus] = useState<TicketStatus>(ticket?.status ?? 'reserved')
  const [buyerName, setBuyerName] = useState(ticket?.buyerName ?? '')
  const [buyerPhone, setBuyerPhone] = useState(ticket?.buyerPhone ?? '')
  const [seller, setSeller] = useState(ticket?.seller ?? '')

  const [paymentMethod, setPaymentMethod] = useState<string | undefined>(
    ticket?.paymentMethod ?? undefined,
  )

  const [paidOn, setPaidOn] = useState(ticket?.paidOn ?? todayCalendar())
  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const [pending, setPending] = useState(false)
  const sellersId = useId()

  const [confirmingRelease, setConfirmingRelease] = useState(false)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Releasing a paid number drops money from the totals: ask first.
    if (status === 'free' && ticket?.status === 'paid') {
      setConfirmingRelease(true)

      return
    }

    void save()
  }

  async function save() {
    const parsed = ticketInputSchema.safeParse({
      status,
      buyerName,
      buyerPhone,
      seller,
      paymentMethod,
      paidOn,
    })

    if (!parsed.success) {
      setErrors(
        new Map(parsed.error.issues.map((issue) => [String(issue.path.at(0)), issue.message])),
      )

      return
    }

    setErrors(new Map())
    setPending(true)

    try {
      await onSave(parsed.data)
    } finally {
      setPending(false)
    }
  }

  return (
    // Only the fields scroll: Guardar stays in view on short screens.
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5">
        <ChoiceField
          legend="Marcar como"
          name="ticket-status"
          // "Libre" is an action only for a number someone has; a free number is already free.
          options={
            ticket ? STATUS_OPTIONS : STATUS_OPTIONS.filter((option) => option.value !== 'free')
          }
          value={status}
          onChange={(value) => {
            if (isTicketStatus(value)) {
              setStatus(value)
            }
          }}
        />

        {status === 'free' ? (
          <p className="text-ink-2">
            {ticket
              ? 'Se borran los datos de este número y vuelve a estar disponible.'
              : 'Sigue libre.'}
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Quién lo compró (opcional)"
                autoComplete="off"
                value={buyerName}
                onChange={(event) => setBuyerName(event.target.value)}
                error={errors.get('buyerName')}
              />
              <TextField
                label="Teléfono (opcional)"
                hint="Para avisarle si gana."
                type="tel"
                autoComplete="off"
                value={buyerPhone}
                onChange={(event) => setBuyerPhone(event.target.value)}
                error={errors.get('buyerPhone')}
              />
            </div>
            <TextField
              label="Quién lo vendió (opcional)"
              list={sellersId}
              autoComplete="off"
              value={seller}
              onChange={(event) => setSeller(event.target.value)}
              error={errors.get('seller')}
            />
            <datalist id={sellersId}>
              {sellers.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </>
        )}

        {status === 'paid' ? (
          <>
            <ChoiceField
              legend="Cómo pagó"
              name="ticket-method"
              options={METHOD_OPTIONS}
              value={paymentMethod}
              onChange={setPaymentMethod}
              error={errors.get('paymentMethod')}
            />
            <TextField
              label="Fecha del pago"
              type="date"
              value={paidOn}
              onChange={(event) => setPaidOn(event.target.value)}
              error={errors.get('paidOn')}
            />
          </>
        ) : null}

        {ticket?.recordedBy ? (
          <p className="text-sm text-muted-foreground">
            Lo cargó {ticket.recordedBy}
            {ticket.paidOn ? `. Pagado el ${formatDate(ticket.paidOn)}` : ''}.
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-t px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button type="submit" disabled={pending} className="h-12 px-8 text-base font-bold">
          {pending ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button type="button" variant="ghost" className="h-12" onClick={onCancel}>
          Cancelar
        </Button>
        {errors.size > 0 ? (
          <p className="text-sm font-semibold text-lost">Revisá los campos marcados.</p>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirmingRelease}
        onOpenChange={setConfirmingRelease}
        title={`¿Liberar el número ${label}?`}
        description="Figura pagado. Liberarlo lo saca de lo cobrado. Hacelo solo si se cargó por error o se devolvió la plata."
        confirmLabel="Liberar el número"
        destructive
        onConfirm={() => void save()}
      />
    </form>
  )
}
