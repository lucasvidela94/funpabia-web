import { Camera, LoaderCircle, RotateCw, Star, X } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/lib/utils'
import type { PendingPhoto } from './photo-uploads'

// Camera or gallery, with one tile per photo showing its upload state. The first photo is the
// primary one.
export function PhotoPicker({
  photos,
  room,
  onAdd,
  onRemove,
  onMakeFirst,
  onRetry,
  error,
  camera = false,
}: {
  photos: PendingPhoto[]
  room: number
  // Offer "take a photo" (opens the camera at once) next to the gallery. For visitors reporting an
  // animal they have in front of them; the panel's single button already offers both.
  camera?: boolean
  onAdd: (files: FileList | null) => void
  onRemove: (id: string) => void
  onMakeFirst: (id: string) => void
  onRetry: (id: string) => void
  error?: string
}) {
  return (
    <div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label="Fotos elegidas">
        {photos.map((photo, index) => (
          <li key={photo.id} className="relative aspect-square overflow-hidden rounded-md bg-sand">
            <img src={photo.preview} alt={`Foto ${index + 1}`} className="size-full object-cover" />

            {photo.state === 'working' ? (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/40 text-white">
                <LoaderCircle className="size-7 animate-spin" aria-hidden="true" />
                <span className="sr-only">Subiendo</span>
              </span>
            ) : null}

            {photo.state === 'error' ? (
              <button
                type="button"
                onClick={() => onRetry(photo.id)}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-lost/85 p-2 text-center text-xs font-semibold text-white"
              >
                <RotateCw className="size-5" aria-hidden="true" />
                {photo.error}
              </button>
            ) : null}

            {index === 0 ? (
              <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-pill bg-yellow-400 px-2 py-0.5 text-xs font-bold text-ink">
                <Star className="size-3" aria-hidden="true" />
                Principal
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onMakeFirst(photo.id)}
                className="absolute bottom-0 left-0 flex h-11 items-end p-1"
                aria-label={`Hacer principal la foto ${index + 1}`}
              >
                <span className="inline-flex items-center gap-1 rounded-pill bg-white/90 px-2 py-0.5 text-xs font-semibold text-ink">
                  <Star className="size-3" aria-hidden="true" />
                  Principal
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onRemove(photo.id)}
              className="absolute top-0 right-0 flex size-11 items-start justify-end p-1"
              aria-label={`Quitar la foto ${index + 1}`}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-ink/70 text-white">
                <X className="size-4" aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}

        {room > 0 && camera ? (
          <li className={cn(photos.length === 0 && 'col-span-3 sm:col-span-5')}>
            <Tile
              label={photos.length === 0 ? 'Sacar una foto' : 'Cámara'}
              empty={photos.length === 0}
              invalid={Boolean(error)}
              onAdd={onAdd}
              capture
            />
          </li>
        ) : null}
        {room > 0 ? (
          <li className={cn(photos.length === 0 && 'col-span-3 sm:col-span-5')}>
            <Tile
              label={
                photos.length === 0
                  ? camera
                    ? 'Elegir de la galería'
                    : 'Sacar o elegir fotos'
                  : camera
                    ? 'Galería'
                    : 'Sumar'
              }
              empty={photos.length === 0}
              invalid={Boolean(error)}
              onAdd={onAdd}
            />
          </li>
        ) : null}
      </ul>
      {error ? <p className="mt-1.5 text-sm font-semibold text-lost">{error}</p> : null}
    </div>
  )
}

// One way to add photos. With `capture` the phone opens the camera straight away (the rear one);
// without it the phone offers the gallery, and often the camera too.
function Tile({
  label,
  empty,
  invalid,
  onAdd,
  capture = false,
}: {
  label: string
  empty: boolean
  invalid: boolean
  onAdd: (files: FileList | null) => void
  capture?: boolean
}) {
  const inputId = useId()

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-card text-center font-semibold text-teal-900 hover:border-teal-700 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
        empty ? 'min-h-28 px-4 py-6' : 'aspect-square',
        invalid ? 'border-lost' : 'border-input',
      )}
    >
      <Camera className="size-8" aria-hidden="true" />
      {label}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        capture={capture ? 'environment' : undefined}
        multiple={!capture}
        className="sr-only"
        onChange={(event) => {
          onAdd(event.target.files)
          event.target.value = ''
        }}
      />
    </label>
  )
}
