import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { formatDate, formatMoney, todayCalendar } from '@/lib/format'
import {
  METHOD_LABEL,
  deleteDonation,
  donationInputSchema,
  parsePesos,
  recordDonation,
  type GoalDetail,
} from '@/lib/goals'
import { ConfirmButton } from '../shared/confirm-dialog'
import { ChoiceField, TextField } from '../shared/form-fields'
import { useAction } from './use-action'

// Spec 6.5: transfers are not confirmed automatically, so each one is recorded by hand and the
// public bar moves with it. Spec 8.3: reaching the target marks the goal as fulfilled.

const METHODS = (['alias', 'cbu', 'mp_link', 'cash'] as const).map((value) => ({
  value,
  label: METHOD_LABEL[value],
}))

export function GoalDonations({ detail }: { detail: GoalDetail }) {
  const [amount, setAmount] = useState('')
  const [donatedOn, setDonatedOn] = useState(todayCalendar)
  const [method, setMethod] = useState<string | undefined>(undefined)
  const [publicName, setPublicName] = useState('')
  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const save = useAction()
  const remove = useAction()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const input = {
      goalId: detail.goal.id,
      amount: parsePesos(amount),
      donatedOn,
      method,
      publicName,
    }

    const parsed = donationInputSchema.safeParse(input)

    if (!parsed.success) {
      setErrors(
        new Map(parsed.error.issues.map((issue) => [String(issue.path.at(0)), issue.message])),
      )

      return
    }

    setErrors(new Map())
    await save.run(() => recordDonation({ data: parsed.data }))
    setAmount('')
    setPublicName('')
  }

  return (
    <section aria-labelledby="aportes" className="rounded-lg border bg-card p-5">
      <h2 id="aportes" className="font-heading text-xl font-bold">
        Aportes
      </h2>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-4 flex flex-col gap-4 rounded-md bg-muted p-4"
      >
        <h3 className="font-sans font-semibold">Registrar un aporte</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Monto"
            inputMode="numeric"
            placeholder="$ 10.000"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            error={errors.get('amount')}
          />
          <TextField
            label="Fecha"
            type="date"
            value={donatedOn}
            onChange={(event) => setDonatedOn(event.target.value)}
            error={errors.get('donatedOn')}
          />
        </div>
        <ChoiceField
          legend="Cómo llegó"
          name="method"
          options={METHODS}
          value={method}
          onChange={setMethod}
          error={errors.get('method')}
        />
        <TextField
          label="Nombre público (opcional)"
          hint="Solo si la persona pidió figurar, y solo el nombre de pila. Vacío es anónimo."
          value={publicName}
          onChange={(event) => setPublicName(event.target.value)}
          error={errors.get('publicName')}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={save.pending} className="h-11 px-6 font-bold">
            {save.pending ? 'Guardando…' : 'Registrar'}
          </Button>
          <p aria-live="polite" className="text-sm font-semibold">
            {save.error ? <span className="text-lost">{save.error}</span> : null}
            {save.done ? <span className="text-adopted">Aporte registrado.</span> : null}
          </p>
        </div>
      </form>

      {detail.donations.length > 0 ? (
        <ul className="mt-4 divide-y">
          {detail.donations.map((donation) => (
            <li
              key={donation.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <div>
                <p className="font-semibold tabular-nums">{formatMoney(donation.amount)}</p>
                <p className="text-sm text-ink-2">
                  {formatDate(donation.donatedOn)}, {METHOD_LABEL[donation.method]}
                  {donation.publicName ? `, de ${donation.publicName}` : ', anónimo'}
                  {donation.recordedBy ? `. Lo cargó ${donation.recordedBy}` : ''}
                </p>
              </div>
              <ConfirmButton
                variant="ghost"
                className="h-11 px-3 text-lost"
                disabled={remove.pending}
                title={`¿Borrar el aporte de ${formatMoney(donation.amount)}?`}
                description="Usalo solo si se cargó por error. La barra de la meta baja en el momento."
                confirmLabel="Borrar el aporte"
                destructive
                onConfirm={() =>
                  void remove.run(() => deleteDonation({ data: { id: donation.id } }))
                }
              >
                <Trash2 aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Borrar</span>
              </ConfirmButton>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-ink-2">Todavía no hay aportes registrados.</p>
      )}
      {remove.error ? <p className="mt-2 text-sm font-semibold text-lost">{remove.error}</p> : null}
    </section>
  )
}
