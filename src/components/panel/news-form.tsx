import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NEWS_TAGS, NEWS_TAG_LABEL, newsInputSchema, type NewsInput } from '@/lib/news'
import { listAnimals } from '@/lib/animals'
import { photoUrl } from '@/lib/photos'
import { CheckboxField, FormFooter, TextAreaField, TextField } from '../shared/form-fields'
import { EntitySearch } from './entity-search'
import { PhotoPicker } from '../shared/photo-picker'
import { usePhotoUploads } from '../shared/photo-uploads'

// Spec 6.7: title, cover photo, body, tags and linked animals. The body is plain text: a blank
// line starts a new paragraph on the site.

export type LinkedAnimal = { id: string; name: string }

export type NewsFormValues = {
  title: string
  body: string
  tags: string[]
  imageKey: string
  animals: LinkedAnimal[]
  published: boolean
}

export const EMPTY_POST: NewsFormValues = {
  title: '',
  body: '',
  tags: [],
  imageKey: '',
  animals: [],
  published: false,
}

export function NewsForm({
  initial,
  submitLabel,
  onSave,
}: {
  initial: NewsFormValues
  submitLabel: string
  onSave: (input: NewsInput) => Promise<void>
}) {
  const [title, setTitle] = useState(initial.title)
  const [body, setBody] = useState(initial.body)
  const [tags, setTags] = useState<string[]>(initial.tags)
  const [keepCover, setKeepCover] = useState(initial.imageKey !== '')
  const [animals, setAnimals] = useState<LinkedAnimal[]>(initial.animals)
  const [published, setPublished] = useState(initial.published)
  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const [pending, setPending] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const uploads = usePhotoUploads(1, 'news')

  function toggleTag(tag: string) {
    setTags((current) =>
      current.includes(tag) ? current.filter((other) => other !== tag) : [...current, tag],
    )
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = newsInputSchema.safeParse({
      title,
      body,
      tags,
      imageKey: uploads.uploaded[0]?.key ?? (keepCover ? initial.imageKey : ''),
      animalIds: animals.map((animal) => animal.id),
      published,
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
      <TextField
        label="Título"
        hint="Qué pasó, en pocas palabras."
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        error={errors.get('title')}
      />
      <TextAreaField
        label="Texto"
        hint="Un renglón en blanco empieza un párrafo nuevo."
        rows={10}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        error={errors.get('body')}
      />
      <fieldset>
        <legend className="mb-2 font-semibold">Etiquetas</legend>
        <div className="flex flex-col gap-2">
          {NEWS_TAGS.map((tag) => (
            <CheckboxField key={tag} checked={tags.includes(tag)} onChange={() => toggleTag(tag)}>
              {NEWS_TAG_LABEL[tag]}
            </CheckboxField>
          ))}
        </div>
        {errors.get('tags') ? (
          <p className="mt-1.5 text-sm font-semibold text-lost">{errors.get('tags')}</p>
        ) : null}
      </fieldset>
      <div>
        <p className="mb-2 text-base font-semibold">Foto de portada (opcional)</p>
        {keepCover && initial.imageKey !== '' && uploads.uploaded.length === 0 ? (
          <div className="mb-3 flex items-center gap-3">
            <img
              src={photoUrl(initial.imageKey)}
              alt="Portada actual"
              className="size-20 rounded-md bg-sand object-cover"
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setKeepCover(false)}
            >
              Quitar
            </Button>
          </div>
        ) : null}
        <PhotoPicker
          photos={uploads.photos}
          room={uploads.room}
          onAdd={uploads.add}
          onRemove={uploads.remove}
          onMakeFirst={uploads.makeFirst}
          onRetry={uploads.retry}
        />
      </div>
      <AnimalLinks animals={animals} onChange={setAnimals} error={errors.get('animalIds')} />
      <CheckboxField checked={published} onChange={setPublished}>
        Publicada en el sitio. Sin esto queda como borrador.
      </CheckboxField>

      <FormFooter
        submitLabel={submitLabel}
        pending={pending || uploads.busy}
        pendingLabel={uploads.busy ? 'Subiendo la foto…' : undefined}
        error={saveError}
        hasErrors={errors.size > 0}
      />
    </form>
  )
}

// Animals linked from the story, so it shows on their profiles. Search is on demand: the
// foundation has too many animals to list them all here.
function AnimalLinks({
  animals,
  onChange,
  error,
}: {
  animals: LinkedAnimal[]
  onChange: (animals: LinkedAnimal[]) => void
  error?: string
}) {
  const selected = new Set(animals.map((animal) => animal.id))

  return (
    <div>
      {animals.length > 0 ? (
        <ul className="mb-3 flex flex-wrap gap-2">
          {animals.map((animal) => (
            <li
              key={animal.id}
              className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-input bg-card px-3 font-semibold"
            >
              {animal.name}
              <button
                type="button"
                onClick={() => onChange(animals.filter((other) => other.id !== animal.id))}
                className="flex size-8 items-center justify-center"
                aria-label={`Desvincular a ${animal.name}`}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <EntitySearch
        label="Animales vinculados (opcional)"
        placeholder="Buscar un animal por nombre"
        emptyText="Ningún animal coincide con esa búsqueda."
        picked={null}
        onPick={(picked) => onChange([...animals, { id: picked.id, name: picked.name }])}
        onClear={() => {}}
        onSearch={async (q) =>
          (await listAnimals({ data: { q } }))
            .filter((animal) => !selected.has(animal.id))
            .map((animal) => ({ id: animal.id, name: animal.name, detail: '' }))
        }
        error={error}
      />
    </div>
  )
}
