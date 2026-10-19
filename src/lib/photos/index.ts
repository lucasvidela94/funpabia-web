// Animal photos live in R2 and are served through /api/photos/<key>, so the bucket stays private.
// Every stored photo has two sizes: the key itself (up to 1600px) and a 480px thumbnail under
// thumbnailKey(key). The phone makes both before uploading (Workers cannot resize on the free plan).
// Reading and writing the bucket is server only: see ./server.ts.

export const FULL_WIDTH = 1600

export const THUMB_WIDTH = 480

export type Photo = {
  src: string
  thumbnail: string
  srcSet: string
  alt: string
  width: number | null
  height: number | null
}

// What an upload endpoint answers: where the photo is stored and how big it is.
export type UploadedPhoto = { key: string; width: number; height: number }

export function photoUrl(key: string) {
  return `/api/photos/${key.split('/').map(encodeURIComponent).join('/')}`
}

// "animals/abc.webp" -> "animals/abc-480.webp"
export function thumbnailKey(key: string) {
  const dot = key.lastIndexOf('.')

  return dot === -1
    ? `${key}-${THUMB_WIDTH}`
    : `${key.slice(0, dot)}-${THUMB_WIDTH}${key.slice(dot)}`
}

export function toPhoto(
  key: string,
  alt: string,
  width: number | null,
  height: number | null,
): Photo {
  const thumbnail = photoUrl(thumbnailKey(key))

  return {
    src: photoUrl(key),
    thumbnail,
    srcSet: `${thumbnail} ${THUMB_WIDTH}w, ${photoUrl(key)} ${width ?? FULL_WIDTH}w`,
    alt,
    width,
    height,
  }
}
