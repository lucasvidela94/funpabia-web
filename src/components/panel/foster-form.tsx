import { useState, type FormEvent } from 'react'
import { listAnimals } from '@/lib/animals'
import { assignPlacementSchema, type AssignPlacement } from '@/lib/fosters'
import { todayCalendar } from '@/lib/format'
import { listPeople } from '@/lib/people'
import { FormFooter, TextAreaField, TextField } from '../shared/form-fields'
import { EntitySearch, type Picked } from './entity-search'

// Spec 6.4: an animal with a foster home, with start and optional end dates. Both sides are
// picked by search: there are too many animals and people to list them all here.

export function FosterForm({ onSave }: { onSave: (input: AssignPlacement) => Promise<void> }) {
  const [animal, setAnimal] = useState<Picked | null>(null)
  const [person, setPerson] = useState<Picked | null>(null)
  const [startedOn, setStartedOn] = useState(todayCalendar())
  const [endedOn, setEndedOn] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const [pending, setPending] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = assignPlacementSchema.safeParse({
      animalId: animal?.id ?? '',
      personId: person?.id ?? '',
      startedOn,
      endedOn,
      notes,
    })

    if (!parsed.success) {
      const mapped = new Map(
        parsed.error.issues.map((issue) => {
          const field = String(issue.path.at(0))

          return [
            field === 'animalId' ? 'animal' : field === 'personId' ? 'person' : field,
            issue.message,
          ] as const
        }),
      )

      setErrors(mapped)

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
      <AnimalPick picked={animal} onPick={setAnimal} error={errors.get('animal')} />
      <PersonPick picked={person} onPick={setPerson} error={errors.get('person')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Desde"
          type="date"
          value={startedOn}
          onChange={(event) => setStartedOn(event.target.value)}
          error={errors.get('startedOn')}
        />
        <TextField
          label="Hasta (opcional)"
          hint="Si ya se sabe cuándo vuelve."
          type="date"
          value={endedOn}
          onChange={(event) => setEndedOn(event.target.value)}
          error={errors.get('endedOn')}
        />
      </div>
      <TextAreaField
        label="Notas (opcional)"
        hint="Medicación, comida, a qué estar atentas."
        rows={3}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        error={errors.get('notes')}
      />

      <FormFooter
        submitLabel="Asignar el tránsito"
        pending={pending}
        error={saveError}
        hasErrors={errors.size > 0}
      />
    </form>
  )
}

function AnimalPick({
  picked,
  onPick,
  error,
}: {
  picked: Picked | null
  onPick: (picked: Picked | null) => void
  error?: string
}) {
  return (
    <EntitySearch
      label="Animal"
      placeholder="Buscar un animal por nombre"
      emptyText="Ningún animal coincide con esa búsqueda."
      picked={picked}
      onPick={onPick}
      onClear={() => onPick(null)}
      onSearch={async (q) =>
        (await listAnimals({ data: { q } })).map((animal) => ({
          id: animal.id,
          name: animal.name,
          detail: '',
        }))
      }
      error={error}
    />
  )
}

function PersonPick({
  picked,
  onPick,
  error,
}: {
  picked: Picked | null
  onPick: (picked: Picked | null) => void
  error?: string
}) {
  return (
    <EntitySearch
      label="Transitanta"
      placeholder="Buscar por nombre, WhatsApp o email"
      emptyText="Nadie coincide con esa búsqueda."
      picked={picked}
      onPick={onPick}
      onClear={() => onPick(null)}
      onSearch={async (q) =>
        (await listPeople({ data: { q } }))
          .filter((person) => !person.anonymized)
          .map((person) => ({
            id: person.id,
            name: person.name,
            detail: [person.city, person.whatsapp].filter(Boolean).join(' · '),
          }))
      }
      error={error}
    />
  )
}
