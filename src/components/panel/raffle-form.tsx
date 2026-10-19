import { useId, useState, type FormEvent } from 'react'
import { parsePesos } from '@/lib/goals'
import { MAX_TICKETS, raffleInputSchema, type RaffleInput } from '@/lib/raffles'
import { FormFooter, TextAreaField, TextField, focusFirstError } from '../shared/form-fields'

// Spec 6.12: what the raffle is, what it costs and what it raises money for. Used to create a raffle
// and to edit it; price and size lock once sales start (`sizeLocked`).

export type RaffleFormValues = {
  title: string
  prizes: string
  ticketPrice: string
  ticketCount: string
  drawOn: string
  drawMethod: string
  permit: string
  goalId: string
}

export const EMPTY_RAFFLE: RaffleFormValues = {
  title: '',
  prizes: '',
  ticketPrice: '',
  ticketCount: '1000',
  drawOn: '',
  drawMethod: '',
  permit: '',
  goalId: '',
}

export function RaffleForm({
  initial,
  goals,
  sizeLocked,
  submitLabel,
  onSave,
}: {
  initial: RaffleFormValues
  goals: { id: string; title: string }[]
  sizeLocked: boolean
  submitLabel: string
  onSave: (input: RaffleInput) => Promise<void>
}) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const [pending, setPending] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const goalId = useId()

  const set = (key: keyof RaffleFormValues) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      const next = new Map(current)
      next.delete(key)

      return next
    })
    setSaved(false)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget

    const input = {
      ...values,
      ticketPrice: parsePesos(values.ticketPrice),
      // "1.000" is a thousand, as with money.
      ticketCount: parsePesos(values.ticketCount),
    }

    const parsed = raffleInputSchema.safeParse(input)

    if (!parsed.success) {
      setErrors(
        new Map(parsed.error.issues.map((issue) => [String(issue.path.at(0)), issue.message])),
      )
      requestAnimationFrame(() => focusFirstError(form))

      return
    }

    setErrors(new Map())
    setPending(true)
    setSaveError(null)

    try {
      await onSave(input)
      setSaved(true)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-5 rounded-lg border bg-card p-5"
    >
      <TextField
        label="Título"
        hint="Como la anuncian: Rifa de primavera."
        value={values.title}
        onChange={(event) => set('title')(event.target.value)}
        error={errors.get('title')}
      />
      <TextAreaField
        label="Premios"
        hint="Uno por renglón, en el orden en que se sortean."
        rows={3}
        value={values.prizes}
        onChange={(event) => set('prizes')(event.target.value)}
        error={errors.get('prizes')}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Precio del número"
          inputMode="numeric"
          placeholder="$ 2.000"
          disabled={sizeLocked}
          value={values.ticketPrice}
          onChange={(event) => set('ticketPrice')(event.target.value)}
          error={errors.get('ticketPrice')}
        />
        <TextField
          label="Cantidad de números"
          hint={`Hasta ${MAX_TICKETS}. Con 1000 van del 000 al 999.`}
          inputMode="numeric"
          disabled={sizeLocked}
          value={values.ticketCount}
          onChange={(event) => set('ticketCount')(event.target.value)}
          error={errors.get('ticketCount')}
        />
      </div>
      {sizeLocked ? (
        <p className="-mt-2 text-sm text-ink-2">
          El precio y la cantidad quedan fijos desde que empezó la venta.
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Fecha del sorteo (opcional)"
          type="date"
          value={values.drawOn}
          onChange={(event) => set('drawOn')(event.target.value)}
          error={errors.get('drawOn')}
        />
        <TextField
          label="Cómo se sortea (opcional)"
          placeholder="Quiniela Nocturna de Río Negro"
          value={values.drawMethod}
          onChange={(event) => set('drawMethod')(event.target.value)}
          error={errors.get('drawMethod')}
        />
      </div>
      <TextField
        label="Número de permiso (opcional)"
        hint="El de la autorización provincial, si la tienen. Sin permiso la rifa no se publica en el sitio."
        value={values.permit}
        onChange={(event) => set('permit')(event.target.value)}
        error={errors.get('permit')}
      />
      <div>
        <label htmlFor={goalId} className="mb-2 block font-semibold">
          Meta (opcional)
        </label>
        <p className="-mt-1 mb-2 text-sm text-muted-foreground">
          Para qué es la plata. Al cerrar, lo cobrado se suma a esta meta.
        </p>
        <select
          id={goalId}
          value={values.goalId}
          onChange={(event) => set('goalId')(event.target.value)}
          className="h-12 w-full rounded-md border border-input bg-card px-3 text-base"
        >
          <option value="">Sin meta</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
        </select>
      </div>

      <FormFooter
        submitLabel={submitLabel}
        pending={pending}
        error={saveError}
        success={saved ? 'Guardado.' : null}
        hasErrors={errors.size > 0}
      />
    </form>
  )
}
