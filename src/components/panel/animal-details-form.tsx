import { useState, type FormEvent } from 'react'
import { animalDetailsSchema, updateAnimal, type AnimalDetail } from '@/lib/animals'
import {
  CheckboxField,
  ChoiceField,
  FormFooter,
  TextAreaField,
  TextField,
} from '../shared/form-fields'
import { useAction } from './use-action'

// Everything after the intake (spec section 7, Animal): what the public profile shows plus the
// internal facts. Saved as a whole; only field names reach the audit trail.

const options = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }))

const SPECIES = options([
  ['dog', 'Perro'],
  ['cat', 'Gato'],
  ['other', 'Otro'],
])

const SEX = options([
  ['male', 'Macho'],
  ['female', 'Hembra'],
  ['unknown', 'No sé'],
])

const AGE = options([
  ['baby', 'Cachorro'],
  ['young', 'Joven'],
  ['adult', 'Adulto'],
  ['senior', 'Senior'],
])

const SIZE = options([
  ['small', 'Chico'],
  ['medium', 'Mediano'],
  ['large', 'Grande'],
])

const COMPATIBILITY = options([
  ['yes', 'Sí'],
  ['no', 'No'],
  ['unknown', 'Sin probar'],
])

const REASON = options([
  ['rescue', 'Rescate'],
  ['raid', 'Allanamiento'],
  ['abandonment', 'Abandono'],
  ['surrender', 'Entrega'],
])

const LOCATION = options([
  ['shelter', 'Refugio'],
  ['foster', 'Tránsito'],
  ['vet', 'Veterinaria'],
])

type Animal = AnimalDetail['animal']

// The form keeps strings and booleans; the schema turns them into the stored shape.
function initialValues(animal: Animal) {
  return {
    name: animal.name,
    species: animal.species,
    sex: animal.sex,
    ageCategory: animal.ageCategory ?? undefined,
    size: animal.size,
    color: animal.color ?? '',
    breed: animal.breed ?? '',
    story: animal.story ?? '',
    personality: animal.personality.join(', '),
    goodWithDogs: animal.goodWithDogs,
    goodWithCats: animal.goodWithCats,
    goodWithKids: animal.goodWithKids,
    neutered: animal.neutered,
    vaccinated: animal.vaccinated,
    dewormed: animal.dewormed,
    intakeDate: animal.intakeDate ?? '',
    intakeReason: animal.intakeReason ?? undefined,
    location: animal.location ?? undefined,
    specialRequirements: animal.specialRequirements ?? '',
  }
}

type Values = ReturnType<typeof initialValues>

type Errors = Partial<Record<keyof Values, string>>

export function AnimalDetailsForm({ animal }: { animal: Animal }) {
  const [values, setValues] = useState(() => initialValues(animal))
  const [errors, setErrors] = useState<Errors>({})
  const save = useAction()

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const choose = (key: keyof Values) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }))

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = animalDetailsSchema.safeParse({
      ...values,
      id: animal.id,
      personality: values.personality
        .split(',')
        .map((trait) => trait.trim())
        .filter((trait) => trait !== ''),
      intakeDate: values.intakeDate || null,
      intakeReason: values.intakeReason ?? null,
      location: values.location ?? null,
    })

    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path.at(0)), issue.message]),
        ),
      )

      return
    }

    setErrors({})
    await save.run(() => updateAnimal({ data: parsed.data }))
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-6 rounded-lg border bg-card p-5"
    >
      <h2 className="font-heading text-xl font-bold">Datos de la ficha</h2>

      <TextField
        label="Nombre"
        value={values.name}
        onChange={(event) => set('name', event.target.value)}
        error={errors.name}
      />
      <ChoiceField
        legend="Especie"
        name="species"
        options={SPECIES}
        value={values.species}
        onChange={choose('species')}
        error={errors.species}
      />
      <ChoiceField
        legend="Sexo"
        name="sex"
        options={SEX}
        value={values.sex}
        onChange={choose('sex')}
        error={errors.sex}
      />
      <ChoiceField
        legend="Edad aproximada"
        name="ageCategory"
        options={AGE}
        value={values.ageCategory}
        onChange={choose('ageCategory')}
        error={errors.ageCategory}
      />
      <ChoiceField
        legend="Tamaño"
        name="size"
        options={SIZE}
        value={values.size}
        onChange={choose('size')}
        error={errors.size}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          label="Color (opcional)"
          value={values.color}
          onChange={(event) => set('color', event.target.value)}
          error={errors.color}
        />
        <TextField
          label="Raza aproximada (opcional)"
          value={values.breed}
          onChange={(event) => set('breed', event.target.value)}
          error={errors.breed}
        />
      </div>

      <TextAreaField
        label="Su historia"
        hint="Cómo llegó, cómo es, qué le gusta. Separá los párrafos con una línea en blanco."
        rows={6}
        value={values.story}
        onChange={(event) => set('story', event.target.value)}
        error={errors.story}
      />
      <TextField
        label="Personalidad"
        hint="Hasta 8 palabras separadas por coma: tranquilo, juguetón, mimoso."
        value={values.personality}
        onChange={(event) => set('personality', event.target.value)}
        error={errors.personality}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Salud</legend>
        <CheckboxField checked={values.neutered} onChange={(checked) => set('neutered', checked)}>
          Castrado
        </CheckboxField>
        <CheckboxField
          checked={values.vaccinated}
          onChange={(checked) => set('vaccinated', checked)}
        >
          Vacunado
        </CheckboxField>
        <CheckboxField checked={values.dewormed} onChange={(checked) => set('dewormed', checked)}>
          Desparasitado
        </CheckboxField>
      </fieldset>

      <ChoiceField
        legend="¿Convive con perros?"
        name="goodWithDogs"
        options={COMPATIBILITY}
        value={values.goodWithDogs}
        onChange={choose('goodWithDogs')}
      />
      <ChoiceField
        legend="¿Convive con gatos?"
        name="goodWithCats"
        options={COMPATIBILITY}
        value={values.goodWithCats}
        onChange={choose('goodWithCats')}
      />
      <ChoiceField
        legend="¿Apto para chicos?"
        name="goodWithKids"
        options={COMPATIBILITY}
        value={values.goodWithKids}
        onChange={choose('goodWithKids')}
      />

      <TextAreaField
        label="Lo que necesita (opcional)"
        hint="Requisitos especiales para la familia, por ejemplo un patio alto."
        rows={2}
        value={values.specialRequirements}
        onChange={(event) => set('specialRequirements', event.target.value)}
        error={errors.specialRequirements}
      />

      <div className="border-t pt-5">
        <p className="mb-4 text-sm text-muted-foreground">Datos internos: no se publican.</p>
        <div className="flex flex-col gap-6">
          <TextField
            label="Fecha de ingreso"
            type="date"
            value={values.intakeDate}
            onChange={(event) => set('intakeDate', event.target.value)}
            error={errors.intakeDate}
          />
          <ChoiceField
            legend="Motivo de ingreso"
            name="intakeReason"
            options={REASON}
            value={values.intakeReason}
            onChange={choose('intakeReason')}
          />
          <ChoiceField
            legend="Dónde está ahora"
            name="location"
            options={LOCATION}
            value={values.location}
            onChange={choose('location')}
          />
        </div>
      </div>

      <FormFooter
        submitLabel="Guardar cambios"
        pending={save.pending}
        error={save.error}
        success={save.done ? 'Cambios guardados.' : null}
        hasErrors={Object.keys(errors).length > 0}
      />
    </form>
  )
}
