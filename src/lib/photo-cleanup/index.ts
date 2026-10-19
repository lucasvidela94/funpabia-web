import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Photos are uploaded before the form that links them is saved (spec 6.3), so a photo whose form
// was never sent, or whose save failed, stays in R2 with nothing pointing at it. This finds those
// and deletes them. Server only. Run nightly by the Worker's cron trigger (src/server.ts).

// An upload younger than this may still be waiting for its form to be saved.
const GRACE_MS = 24 * 60 * 60 * 1000

// Where uploads land: the folders the upload endpoints write to (src/routes/api/uploads).
const PREFIXES = ['animals/', 'news/', 'reports/']

// R2 deletes up to this many keys per call.
const DELETE_BATCH = 1000

// Every photo key some row still points at.
async function referencedKeys() {
  const { results } = await env.DB.prepare(
    `SELECT r2_key AS key FROM photo
     UNION SELECT r2_key FROM lost_found_photo
     UNION SELECT image_r2_key FROM news_post WHERE image_r2_key IS NOT NULL
     UNION SELECT image_r2_key FROM goal WHERE image_r2_key IS NOT NULL`,
  ).all()

  return new Set(
    z
      .array(z.object({ key: z.string() }))
      .parse(results)
      .map((row) => row.key),
  )
}

// "animals/abc-480.webp" belongs to "animals/abc.webp": a photo and its thumbnail live and die
// together (src/lib/photos).
function ownerKey(key: string) {
  return key.replace(/-480(\.[a-z]+)$/, '$1')
}

export async function deleteOrphanPhotos() {
  const referenced = await referencedKeys()
  const cutoff = Date.now() - GRACE_MS
  const orphans: string[] = []

  for (const prefix of PREFIXES) {
    let cursor: string | undefined

    do {
      const page = await env.BUCKET.list({ prefix, cursor })

      for (const object of page.objects) {
        if (object.uploaded.getTime() < cutoff && !referenced.has(ownerKey(object.key))) {
          orphans.push(object.key)
        }
      }

      cursor = page.truncated ? page.cursor : undefined
    } while (cursor)
  }

  for (let start = 0; start < orphans.length; start += DELETE_BATCH) {
    await env.BUCKET.delete(orphans.slice(start, start + DELETE_BATCH))
  }

  logger.info('photos.orphans_deleted', { count: orphans.length })

  return orphans.length
}
