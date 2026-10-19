import { useState } from 'react'
import type { Species } from '@/lib/catalog'
import type { Photo } from '@/lib/photos'
import { cn } from '@/lib/utils'
import { AnimalPhoto } from '../shared/animal-photo'

// Battersea-style profile gallery: one large photo and a strip of thumbnails that swap it.
export function PhotoGallery({ photos, species }: { photos: Photo[]; species: Species }) {
  const [current, setCurrent] = useState(0)
  const shown = photos.at(current) ?? null

  return (
    <div className="flex flex-col gap-3">
      <AnimalPhoto
        photo={shown}
        species={species}
        sizes="(min-width: 1152px) 640px, (min-width: 1024px) 55vw, 100vw"
        priority
        className="aspect-[4/3] w-full rounded-lg"
      />
      {photos.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Más fotos">
          {photos.map((photo, index) => (
            <li key={photo.src} className="shrink-0">
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Ver foto ${index + 1} de ${photos.length}`}
                aria-current={index === current ? 'true' : undefined}
                className={cn(
                  'block overflow-hidden rounded-md border-[3px] transition-colors',
                  index === current
                    ? 'border-teal-700'
                    : 'border-transparent hover:border-line-strong',
                )}
              >
                <img
                  src={photo.thumbnail}
                  alt=""
                  loading="lazy"
                  className="size-20 bg-sand object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
