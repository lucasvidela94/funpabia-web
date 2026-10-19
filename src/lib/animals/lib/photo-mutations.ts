import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { auditStatement } from '@/lib/audit'
import { deletePhoto } from '@/lib/photos/server'
import { AnimalError } from './errors'

const photoRowSchema = z.object({
  animal_id: z.string(),
  r2_key: z.string(),
  is_primary: z.number(),
  published: z.number(),
  siblings: z.number(),
})

async function findPhoto(photoId: string) {
  const row = await env.DB.prepare(
    `SELECT p.animal_id, p.r2_key, p.is_primary, a.published,
       (SELECT COUNT(*) FROM photo WHERE animal_id = p.animal_id) AS siblings
     FROM photo p JOIN animal a ON a.id = p.animal_id WHERE p.id = ?`,
  )
    .bind(photoId)
    .first()

  if (!row) {
    throw new AnimalError('Esta foto ya no existe.')
  }

  return photoRowSchema.parse(row)
}

export async function editPhoto(
  edit: { photoId: string; alt?: string; primary?: true },
  userId: string,
) {
  const photo = await findPhoto(edit.photoId)
  const statements = []

  if (edit.alt !== undefined) {
    statements.push(
      env.DB.prepare('UPDATE photo SET alt_text = ? WHERE id = ?').bind(edit.alt, edit.photoId),
    )
  }

  // The unique index allows one primary per animal: clear the old one first, in the same batch.
  if (edit.primary) {
    statements.push(
      env.DB.prepare('UPDATE photo SET is_primary = 0 WHERE animal_id = ?').bind(photo.animal_id),
      env.DB.prepare('UPDATE photo SET is_primary = 1 WHERE id = ?').bind(edit.photoId),
    )
  }

  if (statements.length === 0) {
    return
  }

  await env.DB.batch([
    ...statements,
    auditStatement({
      userId,
      entity: 'animal',
      entityId: photo.animal_id,
      action: 'update',
      changes: { photo: edit.photoId, alt: edit.alt !== undefined, primary: Boolean(edit.primary) },
    }),
  ])
}

export async function removePhoto(photoId: string, userId: string) {
  const photo = await findPhoto(photoId)

  if (photo.published === 1 && photo.siblings === 1) {
    throw new AnimalError(
      'Es la única foto de una ficha publicada. Sumá otra o despublicá antes de borrarla.',
    )
  }

  const statements = [env.DB.prepare('DELETE FROM photo WHERE id = ?').bind(photoId)]

  // The next photo in order becomes the primary one.
  if (photo.is_primary === 1) {
    statements.push(
      env.DB.prepare(
        `UPDATE photo SET is_primary = 1 WHERE id = (
           SELECT id FROM photo WHERE animal_id = ? ORDER BY position LIMIT 1)`,
      ).bind(photo.animal_id),
    )
  }

  await env.DB.batch([
    ...statements,
    auditStatement({
      userId,
      entity: 'animal',
      entityId: photo.animal_id,
      action: 'update',
      changes: { photoRemoved: photoId },
    }),
  ])

  // After the row is gone: a failed R2 delete leaves an orphan file, never a broken photo.
  await deletePhoto(photo.r2_key)
}
