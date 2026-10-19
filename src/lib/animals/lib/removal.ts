import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { auditStatement } from '@/lib/audit'
import { deletePhoto } from '@/lib/photos/server'
import { AnimalError } from './errors'

// Taking an animal out of the panel. Archiving keeps everything and hides the animal; deleting for
// good is only for animals nothing else refers to (a mistake, a test), because adoptions and
// foster placements point at the animal and are the foundation's record.

// Requests, adoptions and foster placements that point at the animal.
export async function countHistory(id: string) {
  const row = await env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM application WHERE animal_id = ?1)
          + (SELECT COUNT(*) FROM adoption WHERE animal_id = ?1)
          + (SELECT COUNT(*) FROM foster_placement WHERE animal_id = ?1) AS total`,
  )
    .bind(id)
    .first()

  return z.object({ total: z.number() }).parse(row).total
}

// `archived` says which side the animal must be on: in the panel, or archived. Deleting accepts both.
async function requireAnimal(id: string, archived: boolean | 'any' = false) {
  const where =
    archived === 'any' ? '1 = 1' : archived ? 'discarded_at IS NOT NULL' : 'discarded_at IS NULL'

  const row = await env.DB.prepare(`SELECT 1 FROM animal WHERE id = ? AND ${where}`)
    .bind(id)
    .first()

  if (!row) {
    throw new AnimalError('Este animal ya no existe.')
  }
}

export async function archiveAnimal(id: string, userId: string) {
  await requireAnimal(id)

  const placement = await env.DB.prepare(
    'SELECT 1 FROM foster_placement WHERE animal_id = ? AND ended_on IS NULL',
  )
    .bind(id)
    .first()

  if (placement) {
    throw new AnimalError('Está en un hogar de tránsito. Cerrá el tránsito antes de archivarlo.')
  }

  const at = new Date().toISOString()

  await env.DB.batch([
    env.DB.prepare(
      'UPDATE animal SET discarded_at = ?, published = 0, urgent = 0, updated_at = ? WHERE id = ?',
    ).bind(at, at, id),
    auditStatement({
      userId,
      entity: 'animal',
      entityId: id,
      action: 'update',
      changes: { archived: true },
    }),
  ])
}

// Back to the panel, still unpublished: someone decides again whether it goes on the site.
export async function unarchiveAnimal(id: string, userId: string) {
  await requireAnimal(id, true)

  await env.DB.batch([
    env.DB.prepare('UPDATE animal SET discarded_at = NULL, updated_at = ? WHERE id = ?').bind(
      new Date().toISOString(),
      id,
    ),
    auditStatement({
      userId,
      entity: 'animal',
      entityId: id,
      action: 'update',
      changes: { archived: false },
    }),
  ])
}

export async function deleteAnimal(id: string, userId: string) {
  await requireAnimal(id, 'any')

  if ((await countHistory(id)) > 0) {
    throw new AnimalError(
      'Tiene solicitudes, adopciones o tránsitos: no se puede borrar, solo archivar.',
    )
  }

  const { results } = await env.DB.prepare('SELECT r2_key FROM photo WHERE animal_id = ?')
    .bind(id)
    .all()

  const keys = z.array(z.object({ r2_key: z.string() })).parse(results)

  // Photos, status history and links to goals and news go with the animal (ON DELETE CASCADE).
  await env.DB.batch([
    env.DB.prepare('DELETE FROM animal WHERE id = ?').bind(id),
    auditStatement({
      userId,
      entity: 'animal',
      entityId: id,
      action: 'delete',
      changes: { photos: keys.length },
    }),
  ])

  // After the rows are gone: a failed R2 delete leaves an orphan file, never a broken record.
  await Promise.all(keys.map((photo) => deletePhoto(photo.r2_key)))
}
