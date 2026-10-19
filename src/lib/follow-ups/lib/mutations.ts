import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { auditStatement } from '@/lib/audit'
import { todayCalendar } from '@/lib/format'
import { FollowUpError } from './errors'

const targetSchema = z.object({
  completed_on: z.string().nullable(),
  adoption_id: z.string().nullable(),
  animal_id: z.string().nullable(),
  animal_status: z.string().nullable(),
})

// Records the result of a follow-up. "Lo devolvieron" also closes the adoption: it is marked as
// returned, the animal goes back to "devuelto" and the follow-ups still pending are dropped.
export async function completeFollowUp(
  input: { id: string; result: 'ok' | 'problems' | 'no_response' | 'returned'; notes: string },
  userId: string,
) {
  const row = await env.DB.prepare(
    `SELECT f.completed_on, f.adoption_id, an.id AS animal_id, an.status AS animal_status
     FROM follow_up f
     LEFT JOIN adoption ad ON ad.id = f.adoption_id
     LEFT JOIN foster_placement fp ON fp.id = f.foster_placement_id
     LEFT JOIN animal an ON an.id = COALESCE(ad.animal_id, fp.animal_id)
     WHERE f.id = ?`,
  )
    .bind(input.id)
    .first()

  if (!row) {
    throw new FollowUpError('Este seguimiento ya no existe.')
  }

  const target = targetSchema.parse(row)

  if (target.completed_on) {
    throw new FollowUpError('Este seguimiento ya está registrado.')
  }

  const today = todayCalendar()
  const at = new Date().toISOString()

  const statements = [
    env.DB.prepare(
      'UPDATE follow_up SET completed_on = ?, result = ?, notes = ?, completed_by = ? WHERE id = ?',
    ).bind(today, input.result, input.notes === '' ? null : input.notes, userId, input.id),
  ]

  if (input.result === 'returned' && target.adoption_id && target.animal_id) {
    statements.push(
      env.DB.prepare('UPDATE adoption SET returned = 1, returned_on = ? WHERE id = ?').bind(
        today,
        target.adoption_id,
      ),
      env.DB.prepare(
        'DELETE FROM follow_up WHERE adoption_id = ? AND completed_on IS NULL AND id <> ?',
      ).bind(target.adoption_id, input.id),
      env.DB.prepare("UPDATE animal SET status = 'returned', updated_at = ? WHERE id = ?").bind(
        at,
        target.animal_id,
      ),
      env.DB.prepare(
        "INSERT INTO animal_status_history (id, animal_id, previous_status, new_status, user_id, created_at) VALUES (?, ?, ?, 'returned', ?, ?)",
      ).bind(crypto.randomUUID(), target.animal_id, target.animal_status, userId, at),
      auditStatement({
        userId,
        entity: 'animal',
        entityId: target.animal_id,
        action: 'update',
        changes: { status: 'returned', reason: 'follow_up' },
      }),
    )
  }

  await env.DB.batch(statements)
}
