import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import type { z } from 'zod'
import { ChoiceField, TextField } from '@/components/shared/form-fields'
import { PanelHeader } from '@/components/panel/panel-page'
import { PhotoPicker } from '@/components/shared/photo-picker'
import { usePhotoUploads } from '@/components/shared/photo-uploads'
import { Button } from '@/components/ui/button'
import { MAX_PHOTOS, createAnimal, intakeSchema } from '@/lib/animals'

// Spec 8.4: photos, then five answers with big buttons; only the name needs the keyboard. The
// animal starts as "ingresado" and unpublished; the story and the rest come later.

const SPECIES = [
  { value: 'dog', label: 'Perro' },
  { value: 'cat', label: 'Gato' },
  { value: 'other', label: 'Otro' },
]

const SEX = [
  { value: 'male', label: 'Macho' },
  { value: 'female', label: 'Hembra' },
  { value: 'unknown', label: 'No sé' },
]

const AGE = [
  { value: 'baby', label: 'Cachorro' },
  { value: 'young', label: 'Joven' },
  { value: 'adult', label: 'Adulto' },
  { value: 'senior', label: 'Senior' },
]

const SIZE = [
  { value: 'small', label: 'Chico' },
  { value: 'medium', label: 'Mediano' },
  { value: 'large', label: 'Grande' },
]

type Answers = { name: string; species?: string; sex?: string; ageCategory?: string; size?: string }

type Errors = Partial<Record<keyof Answers | 'photos', string>>

function toErrors(error: z.ZodError): Errors {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path.at(0)), issue.message]))
}

export const Route = createFileRoute('/_private/panel/animales/nuevo')({ component: NewAnimal })

function NewAnimal() {
  const navigate = useNavigate()
  const uploads = usePhotoUploads(MAX_PHOTOS)
  const [answers, setAnswers] = useState<Answers>({ name: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Answering a field clears its error; the rest stay until the next save.
  const set = (key: keyof Answers) => (value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const photosError = uploads.photos.length > 0 ? undefined : errors.photos

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)

    const parsed = intakeSchema.safeParse({ ...answers, photos: uploads.uploaded })

    if (!parsed.success) {
      setErrors(toErrors(parsed.error))

      return
    }

    setErrors({})
    setSaving(true)

    try {
      const { id } = await createAnimal({ data: parsed.data })
      await navigate({
        to: '/panel/animales/$animalId',
        params: { animalId: id },
        search: { nuevo: true },
      })
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar.')
      setSaving(false)
    }
  }

  const failed = uploads.photos.some((photo) => photo.state === 'error')

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-2xl pb-28 md:pb-0">
      <PanelHeader
        title="Cargar un animal"
        description="Con esto alcanza para empezar. El resto se completa después."
      />

      <div className="mt-8 flex flex-col gap-7">
        <section aria-labelledby="fotos">
          <h2 id="fotos" className="mb-2 font-semibold">
            Fotos <span className="font-normal text-muted-foreground">(de 1 a {MAX_PHOTOS})</span>
          </h2>
          <PhotoPicker
            photos={uploads.photos}
            room={uploads.room}
            onAdd={uploads.add}
            onRemove={uploads.remove}
            onMakeFirst={uploads.makeFirst}
            onRetry={uploads.retry}
            error={photosError}
          />
        </section>

        <TextField
          label="Nombre"
          value={answers.name}
          onChange={(event) => set('name')(event.target.value)}
          error={errors.name}
          autoComplete="off"
          enterKeyHint="done"
        />
        <ChoiceField
          legend="Especie"
          name="species"
          options={SPECIES}
          value={answers.species}
          onChange={set('species')}
          error={errors.species}
        />
        <ChoiceField
          legend="Sexo"
          name="sex"
          options={SEX}
          value={answers.sex}
          onChange={set('sex')}
          error={errors.sex}
        />
        <ChoiceField
          legend="Edad aproximada"
          name="ageCategory"
          options={AGE}
          value={answers.ageCategory}
          onChange={set('ageCategory')}
          error={errors.ageCategory}
        />
        <ChoiceField
          legend="Tamaño"
          name="size"
          options={SIZE}
          value={answers.size}
          onChange={set('size')}
          error={errors.size}
        />
      </div>

      {/* On the phone the save button stays at the bottom of the screen, above the keyboard. */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background p-4 md:static md:mt-10 md:border-0 md:p-0">
        {saveError || failed ? (
          <p role="alert" className="mb-3 text-sm font-semibold text-lost">
            {saveError ?? 'Alguna foto no subió: tocala para reintentar o quitala.'}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={saving || uploads.busy}
          className="h-12 w-full text-base font-bold md:w-auto md:px-10"
        >
          {saving ? 'Guardando…' : uploads.busy ? 'Subiendo fotos…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
