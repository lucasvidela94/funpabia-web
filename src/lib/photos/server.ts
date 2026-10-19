import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { thumbnailKey, type UploadedPhoto } from './index'

export function readPhoto(key: string) {
  return env.BUCKET.get(key)
}

async function storePhoto(key: string, body: ArrayBuffer, contentType: string) {
  await env.BUCKET.put(key, body, { httpMetadata: { contentType } })
}

// Both sizes go together.
export async function deletePhoto(key: string) {
  await env.BUCKET.delete([key, thumbnailKey(key)])
}

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024

const uploadFieldsSchema = z.object({
  width: z.coerce.number().int().min(1).max(4000),
  height: z.coerce.number().int().min(1).max(4000),
})

export type UploadResult =
  | { status: 200; body: UploadedPhoto }
  | { status: 400 | 413 | 415; body: { error: string } }

// One photo already compressed on the phone, in both sizes (spec 6.3): checked, then stored under
// `<folder>/<uuid>`. Who may upload, and how often, is for the endpoint to decide.
export async function receiveUpload(form: FormData, folder: string): Promise<UploadResult> {
  const full = form.get('full')
  const thumb = form.get('thumb')

  const fields = uploadFieldsSchema.safeParse({
    width: form.get('width'),
    height: form.get('height'),
  })

  if (!(full instanceof File) || !(thumb instanceof File) || !fields.success) {
    return { status: 400, body: { error: 'Faltan datos de la foto.' } }
  }

  if (full.size > MAX_UPLOAD_BYTES || thumb.size > MAX_UPLOAD_BYTES) {
    return { status: 413, body: { error: 'La foto pesa demasiado.' } }
  }

  const [fullBytes, thumbBytes] = await Promise.all([full.arrayBuffer(), thumb.arrayBuffer()])
  // subarray, not a length argument: a file shorter than 12 bytes must be refused, not crash.
  const type = sniffImageType(new Uint8Array(fullBytes).subarray(0, 12))

  if (!type || sniffImageType(new Uint8Array(thumbBytes).subarray(0, 12)) !== type) {
    return { status: 415, body: { error: 'El archivo no es una foto JPG o WebP.' } }
  }

  const key = `${folder}/${crypto.randomUUID()}.${type === 'image/webp' ? 'webp' : 'jpg'}`

  await Promise.all([
    storePhoto(key, fullBytes, type),
    storePhoto(thumbnailKey(key), thumbBytes, type),
  ])
  logger.info('photo.uploaded', { bytes: full.size, type, folder })

  return { status: 200, body: { key, width: fields.data.width, height: fields.data.height } }
}

// The type comes from the file's first bytes, not from what the client says it is.
function sniffImageType(bytes: Uint8Array): 'image/jpeg' | 'image/webp' | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }

  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end))

  return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP' ? 'image/webp' : null
}
