import { useState, type FormEvent } from 'react'
import {
  AGENDA_TYPES,
  AGENDA_TYPE_LABEL,
  ORGANIZERS,
  ORGANIZER_LABEL,
  agendaInputSchema,
  type AgendaInput,
} from '@/lib/agenda'
import { ChoiceField, FormFooter, TextAreaField, TextField } from '../shared/form-fields'

// Spec 6.7: type, date and time, place, neighborhood, organizer, requirements, how to get an
// appointment and the source when the data comes from the Municipality or Zoonosis.

// The foundation works in Cipolletti, UTC-3 all year: the form speaks local time, the API an offset.
const OFFSET = '-03:00'
const OFFSET_MS = 3 * 60 * 60 * 1000

export type AgendaFormValues = {
  type: string
  title: string
  startsAt: string
  endsAt: string
  venue: string
  address: string
  neighborhood: string
  organizer: string
  requirements: string
  appointmentUrl: string
  appointmentPhone: string
  source: string
}

export const EMPTY_EVENT: AgendaFormValues = {
  type: '',
  title: '',
  startsAt: '',
  endsAt: '',
  venue: '',
  address: '',
  neighborhood: '',
  organizer: 'funpabia',
  requirements: '',
  appointmentUrl: '',
  appointmentPhone: '',
  source: '',
}

// "2026-11-03T12:00:00.000Z" -> "2026-11-03T09:00", what <input type="datetime-local"> expects.
export function toLocalInput(iso: string) {
  return new Date(new Date(iso).getTime() - OFFSET_MS).toISOString().slice(0, 16)
}

function withOffset(local: string) {
  return local === '' ? '' : `${local}:00${OFFSET}`
}

const TYPE_OPTIONS = AGENDA_TYPES.map((value) => ({ value, label: AGENDA_TYPE_LABEL[value] }))

const ORGANIZER_OPTIONS = ORGANIZERS.map((value) => ({ value, label: ORGANIZER_LABEL[value] }))

export function AgendaForm({
  initial,
  submitLabel,
  onSave,
}: {
  initial: AgendaFormValues
  submitLabel: string
  onSave: (input: AgendaInput) => Promise<void>
}) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const [pending, setPending] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const set = (key: keyof AgendaFormValues) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }))

  const text = (key: keyof AgendaFormValues) => ({
    value: values[key],
    onChange: (event: { target: { value: string } }) => set(key)(event.target.value),
    error: errors.get(key),
  })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = agendaInputSchema.safeParse({
      ...values,
      startsAt: withOffset(values.startsAt),
      endsAt: withOffset(values.endsAt),
    })

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
      await onSave(parsed.data)
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
      <ChoiceField
        legend="Tipo de evento"
        name="type"
        options={TYPE_OPTIONS}
        value={values.type || undefined}
        onChange={set('type')}
        error={errors.get('type')}
      />
      <TextField
        label="Título"
        hint="Qué es, en pocas palabras: Castración gratuita de perros y gatos."
        {...text('title')}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Empieza" type="datetime-local" {...text('startsAt')} />
        <TextField label="Termina (opcional)" type="datetime-local" {...text('endsAt')} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Lugar (opcional)" {...text('venue')} />
        <TextField label="Barrio (opcional)" {...text('neighborhood')} />
      </div>
      <TextField
        label="Dirección pública (opcional)"
        hint="La dirección del evento, nunca la de una persona."
        {...text('address')}
      />
      <ChoiceField
        legend="Organiza"
        name="organizer"
        options={ORGANIZER_OPTIONS}
        value={values.organizer}
        onChange={set('organizer')}
        error={errors.get('organizer')}
      />
      <TextAreaField
        label="Requisitos (opcional)"
        hint="Turno, ayuno, edad mínima."
        rows={3}
        {...text('requirements')}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Link para el turno (opcional)" type="url" {...text('appointmentUrl')} />
        <TextField label="Teléfono para el turno (opcional)" {...text('appointmentPhone')} />
      </div>
      <TextField
        label="Fuente (opcional)"
        hint="De dónde sale el dato: Municipalidad de Cipolletti, Zoonosis."
        {...text('source')}
      />

      <FormFooter
        submitLabel={submitLabel}
        pending={pending}
        error={saveError}
        hasErrors={errors.size > 0}
      />
    </form>
  )
}
