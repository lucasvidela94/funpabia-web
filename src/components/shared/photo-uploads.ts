import { useRef, useState } from 'react'
import { z } from 'zod'
import { FULL_WIDTH, THUMB_WIDTH, type UploadedPhoto } from '@/lib/photos'

// Photos picked on the phone: compressed in the browser into the two sizes the site serves (spec
// 6.3), uploaded right away, one state per photo so a failed one can be retried alone.

export type PendingPhoto = {
  id: string
  preview: string
  state: 'working' | 'done' | 'error'
  error?: string
  file: File
  result?: UploadedPhoto
}

async function encode(bitmap: ImageBitmap, maxWidth: number, type: 'image/webp' | 'image/jpeg') {
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.8))

  return { blob, width: canvas.width, height: canvas.height }
}

// WebP when the browser can write it, JPEG otherwise (older Safari returns PNG for WebP).
async function compress(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

  try {
    let full = await encode(bitmap, FULL_WIDTH, 'image/webp')
    let type: 'image/webp' | 'image/jpeg' = 'image/webp'

    if (full.blob?.type !== 'image/webp') {
      type = 'image/jpeg'
      full = await encode(bitmap, FULL_WIDTH, type)
    }

    const thumb = await encode(bitmap, THUMB_WIDTH, type)

    if (!full.blob || !thumb.blob) {
      throw new Error('encode')
    }

    return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height }
  } finally {
    bitmap.close()
  }
}

const responseSchema = z.union([
  z.object({ key: z.string(), width: z.number(), height: z.number() }),
  z.object({ error: z.string() }),
])

// Where each kind of photo goes. Visitors' reports have their own open endpoint; the panel's
// photos need a session.
export type UploadTarget = 'animals' | 'news' | 'reports'

const ENDPOINT: Record<UploadTarget, string> = {
  animals: '/api/uploads/photo',
  news: '/api/uploads/photo',
  reports: '/api/uploads/report-photo',
}

async function upload(file: File, target: UploadTarget): Promise<UploadedPhoto> {
  const compressed = await compress(file).catch(() => {
    throw new Error('No pudimos leer esta foto. Probá con otra.')
  })

  const body = new FormData()
  body.set('full', compressed.full, 'full')
  body.set('thumb', compressed.thumb, 'thumb')
  body.set('width', String(compressed.width))
  body.set('height', String(compressed.height))
  body.set('folder', target)

  const response = await fetch(ENDPOINT[target], { method: 'POST', body }).catch(() => {
    throw new Error('Sin conexión. Tocá para reintentar.')
  })

  const parsed = responseSchema.safeParse(await response.json().catch(() => null))

  if (!parsed.success) {
    throw new Error('No se pudo subir. Tocá para reintentar.')
  }

  if ('error' in parsed.data) {
    throw new Error(parsed.data.error)
  }

  return parsed.data
}

export function usePhotoUploads(limit: number, target: UploadTarget = 'animals') {
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const counter = useRef(0)

  function patch(id: string, change: Partial<PendingPhoto>) {
    setPhotos((current) =>
      current.map((photo) => (photo.id === id ? { ...photo, ...change } : photo)),
    )
  }

  function start(photo: PendingPhoto) {
    patch(photo.id, { state: 'working', error: undefined })
    upload(photo.file, target).then(
      (result) => patch(photo.id, { state: 'done', result }),
      (error: Error) => patch(photo.id, { state: 'error', error: error.message }),
    )
  }

  // What the browser can turn into a JPG or WebP. SVG is an image to the picker but not a photo.
  const isPhoto = (file: File) => file.type.startsWith('image/') && file.type !== 'image/svg+xml'

  function add(files: FileList | null) {
    const room = limit - photos.length
    const chosen = [...(files ?? [])]
    const accepted = chosen.filter(isPhoto)

    // Said out loud: a file that silently does nothing looks like a broken button.
    setNotice(
      accepted.length < chosen.length
        ? 'Solo se pueden subir fotos (JPG, PNG o WebP). Probá con otra.'
        : accepted.length > room
          ? `Solo entran ${limit} fotos. Quitá alguna para sumar otra.`
          : null,
    )

    const picked = accepted.slice(0, Math.max(0, room)).map((file) => ({
      id: `photo-${counter.current++}`,
      preview: URL.createObjectURL(file),
      state: 'working' as const,
      file,
    }))

    setPhotos((current) => [...current, ...picked])
    picked.forEach(start)
  }

  function remove(id: string) {
    setPhotos((current) => current.filter((photo) => photo.id !== id))
  }

  // The first photo is the primary one.
  function makeFirst(id: string) {
    setPhotos((current) => [
      ...current.filter((photo) => photo.id === id),
      ...current.filter((photo) => photo.id !== id),
    ])
  }

  function retry(id: string) {
    const photo = photos.find((candidate) => candidate.id === id)

    if (photo) {
      start(photo)
    }
  }

  function clear() {
    setPhotos([])
  }

  const uploaded = photos.flatMap((photo) => (photo.result ? [photo.result] : []))
  const busy = photos.some((photo) => photo.state === 'working')

  return {
    photos,
    uploaded,
    busy,
    notice,
    room: limit - photos.length,
    add,
    remove,
    makeFirst,
    retry,
    clear,
  }
}
