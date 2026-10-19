import { useState, type FormEvent } from 'react'
import { GOAL_STATUS_LABEL, goalInputSchema, parsePesos, type GoalInput } from '@/lib/goals'
import { ChoiceField, FormFooter, TextAreaField, TextField } from '../shared/form-fields'

// Spec 6.5: title, description, target, optional deadline and the Mercado Pago link made by hand
// in the foundation's account. Used to create a goal and to edit it.

export type GoalFormValues = {
  title: string
  description: string
  target: string
  deadlineOn: string
  mercadoPagoUrl: string
  status: GoalInput['status']
}

export const EMPTY_GOAL: GoalFormValues = {
  title: '',
  description: '',
  target: '',
  deadlineOn: '',
  mercadoPagoUrl: '',
  status: 'active',
}

const STATUS_OPTIONS = (['active', 'fulfilled', 'closed'] as const).map((value) => ({
  value,
  label: GOAL_STATUS_LABEL[value],
}))

export function GoalForm({
  initial,
  submitLabel,
  showStatus,
  onSave,
}: {
  initial: GoalFormValues
  submitLabel: string
  showStatus: boolean
  onSave: (input: GoalInput) => Promise<void>
}) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const [pending, setPending] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const set = (key: keyof GoalFormValues) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = { ...values, target: parsePesos(values.target) }
    const parsed = goalInputSchema.safeParse(input)

    if (!parsed.success) {
      setErrors(
        new Map(parsed.error.issues.map((issue) => [String(issue.path.at(0)), issue.message])),
      )

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
        hint="Para qué es, en pocas palabras: Deuda veterinaria de octubre."
        value={values.title}
        onChange={(event) => set('title')(event.target.value)}
        error={errors.get('title')}
      />
      <TextAreaField
        label="Descripción (opcional)"
        hint="Qué se paga con esto. Se ve en el sitio."
        rows={3}
        value={values.description}
        onChange={(event) => set('description')(event.target.value)}
        error={errors.get('description')}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Monto objetivo"
          inputMode="numeric"
          placeholder="$ 5.000.000"
          value={values.target}
          onChange={(event) => set('target')(event.target.value)}
          error={errors.get('target')}
        />
        <TextField
          label="Fecha límite (opcional)"
          type="date"
          value={values.deadlineOn}
          onChange={(event) => set('deadlineOn')(event.target.value)}
          error={errors.get('deadlineOn')}
        />
      </div>
      <TextField
        label="Link de Mercado Pago (opcional)"
        hint="Creado a mano en la cuenta de la fundación. Aparece como botón Donar."
        type="url"
        value={values.mercadoPagoUrl}
        onChange={(event) => set('mercadoPagoUrl')(event.target.value)}
        error={errors.get('mercadoPagoUrl')}
      />
      {showStatus ? (
        <ChoiceField
          legend="Estado"
          name="status"
          options={STATUS_OPTIONS}
          value={values.status}
          onChange={set('status')}
        />
      ) : null}

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
