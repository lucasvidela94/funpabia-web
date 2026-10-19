import { Cat, Dog, PawPrint } from 'lucide-react'
import type { Species } from '@/lib/catalog'
import type { Photo } from '@/lib/photos'
import { cn } from '@/lib/utils'

const PLACEHOLDER_ICON = { dog: Dog, cat: Cat, other: PawPrint }

// A photo with its box reserved (no layout shift), or a quiet placeholder while it is uploaded.
// `sizes` says how wide it shows, so the browser picks the 480px thumbnail or the full photo.
export function AnimalPhoto({
  photo,
  species,
  sizes,
  className,
  priority = false,
}: {
  photo: Photo | null
  species: Species
  sizes: string
  className?: string
  priority?: boolean
}) {
  if (!photo) {
    const Icon = PLACEHOLDER_ICON[species]

    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 bg-sand text-gray-500',
          className,
        )}
      >
        <Icon className="size-10" aria-hidden="true" />
        <span className="text-sm">Foto en camino</span>
      </div>
    )
  }

  return (
    <img
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={sizes}
      alt={photo.alt}
      width={photo.width ?? undefined}
      height={photo.height ?? undefined}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={cn('bg-sand object-cover', className)}
    />
  )
}
