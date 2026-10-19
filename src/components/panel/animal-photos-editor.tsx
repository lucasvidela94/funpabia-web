import { Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  addAnimalPhotos,
  deleteAnimalPhoto,
  editAnimalPhoto,
  type AnimalDetail,
} from '@/lib/animals'
import { ConfirmButton } from '../shared/confirm-dialog'
import { PhotoPicker } from '../shared/photo-picker'
import { usePhotoUploads } from '../shared/photo-uploads'
import { useAction } from './use-action'

const MAX_TOTAL = 12

// Spec 6.3 and 9: pick the primary photo, describe each one for screen readers, remove or add.
export function AnimalPhotosEditor({ detail }: { detail: AnimalDetail }) {
  const { animal, photos } = detail
  const action = useAction()
  const uploads = usePhotoUploads(Math.max(0, MAX_TOTAL - photos.length))

  async function saveNew() {
    await action.run(() => addAnimalPhotos({ data: { id: animal.id, photos: uploads.uploaded } }))
    uploads.clear()
  }

  return (
    <section aria-labelledby="fotos" className="rounded-lg border bg-card p-5">
      <h2 id="fotos" className="font-heading text-xl font-bold">
        Fotos
      </h2>
      <p className="mt-1 text-sm text-ink-2">
        La principal es la que se ve en el catálogo y al compartir. Describí cada foto para quien no
        la puede ver.
      </p>

      {photos.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-4">
          {photos.map((photo) => (
            <li key={photo.id} className="flex gap-3">
              <img
                src={photo.thumbnail}
                alt=""
                className="size-24 shrink-0 rounded-md bg-sand object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <AltTextField photoId={photo.id} alt={photo.alt} />
                <div className="flex flex-wrap gap-2">
                  {photo.primary ? (
                    <span className="inline-flex h-9 items-center gap-1 rounded-pill bg-yellow-400 px-3 text-sm font-bold text-ink">
                      <Star className="size-4" aria-hidden="true" />
                      Principal
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 px-3"
                      disabled={action.pending}
                      onClick={() =>
                        action.run(() =>
                          editAnimalPhoto({ data: { photoId: photo.id, primary: true } }),
                        )
                      }
                    >
                      <Star aria-hidden="true" />
                      Hacer principal
                    </Button>
                  )}
                  <ConfirmButton
                    variant="outline"
                    className="h-11 px-3 text-lost"
                    disabled={action.pending}
                    title="¿Borrar esta foto?"
                    description="Deja de verse en la ficha. No se puede deshacer."
                    confirmLabel="Borrar la foto"
                    destructive
                    onConfirm={() =>
                      void action.run(() => deleteAnimalPhoto({ data: { photoId: photo.id } }))
                    }
                  >
                    <Trash2 aria-hidden="true" />
                    Borrar
                  </ConfirmButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-md bg-muted p-4 text-ink-2">
          Sin fotos todavía: hace falta al menos una para publicar.
        </p>
      )}

      {photos.length < MAX_TOTAL ? (
        <div className="mt-5 border-t pt-4">
          <h3 className="mb-2 font-semibold">Sumar fotos</h3>
          <PhotoPicker
            photos={uploads.photos}
            room={uploads.room}
            onAdd={uploads.add}
            onRemove={uploads.remove}
            onMakeFirst={uploads.makeFirst}
            onRetry={uploads.retry}
          />
          {uploads.photos.length > 0 ? (
            <Button
              type="button"
              className="mt-3 h-11 px-5 font-bold"
              disabled={uploads.busy || action.pending || uploads.uploaded.length === 0}
              onClick={saveNew}
            >
              {uploads.busy
                ? 'Subiendo…'
                : `Guardar ${uploads.uploaded.length === 1 ? 'la foto' : 'las fotos'}`}
            </Button>
          ) : null}
        </div>
      ) : null}

      {action.error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-lost">
          {action.error}
        </p>
      ) : null}
    </section>
  )
}

function AltTextField({ photoId, alt }: { photoId: string; alt: string }) {
  const [value, setValue] = useState(alt)
  const save = useAction()
  const id = `alt-${photoId}`

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        Descripción
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={id}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-11 min-w-0 flex-1 rounded-md border border-input bg-card px-3"
        />
        {value.trim() !== alt ? (
          <Button
            type="button"
            className="h-11 px-3"
            disabled={save.pending}
            onClick={() => save.run(() => editAnimalPhoto({ data: { photoId, alt: value } }))}
          >
            Guardar
          </Button>
        ) : null}
      </div>
      {save.error ? <p className="mt-1 text-sm font-semibold text-lost">{save.error}</p> : null}
    </div>
  )
}
