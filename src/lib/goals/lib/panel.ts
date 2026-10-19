import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { auditStatement } from '@/lib/audit'
import { slugify } from '@/lib/slug'
import { donationStatements, syncGoalStatus } from '../server'
import { GoalError } from './errors'
import { selectGoalRowById, selectAllGoalRows } from './queries'
import type { donationInputSchema, goalInputSchema } from './schema'

// Panel writes and reads for goals and their donations (spec 6.5, 8.3). Admin only.

type GoalValues = z.output<typeof goalInputSchema>

type DonationValues = z.output<typeof donationInputSchema>

const donationSchema = z
  .object({
    id: z.string(),
    amount: z.number(),
    donated_on: z.string(),
    method: z.enum(['alias', 'cbu', 'mp_link', 'mp_api', 'cash']),
    public_name: z.string().nullable(),
    recorded_by_name: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    amount: row.amount,
    donatedOn: row.donated_on,
    method: row.method,
    publicName: row.public_name,
    recordedBy: row.recorded_by_name,
  }))

export { selectAllGoalRows }

export async function selectGoalWithDonations(id: string) {
  const goal = await selectGoalRowById(id)

  if (!goal) {
    return null
  }

  const { results } = await env.DB.prepare(
    `SELECT d.id, d.amount, d.donated_on, d.method, d.public_name, u.name AS recorded_by_name
     FROM donation d LEFT JOIN app_user u ON u.id = d.recorded_by
     WHERE d.goal_id = ? ORDER BY d.donated_on DESC, d.created_at DESC LIMIT 200`,
  )
    .bind(id)
    .all()

  return { goal, donations: z.array(donationSchema).parse(results) }
}

async function uniqueGoalSlug(title: string) {
  const base = slugify(title, 50) || 'meta'

  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`
    const taken = await env.DB.prepare('SELECT 1 FROM goal WHERE slug = ?').bind(slug).first()

    if (!taken) {
      return slug
    }
  }

  throw new GoalError('Ya hay muchas metas con ese título. Probá con otro.')
}

export async function insertGoal(values: GoalValues) {
  const id = crypto.randomUUID()
  const at = new Date().toISOString()

  await env.DB.prepare(
    `INSERT INTO goal (id, title, slug, description, target_amount, deadline_on, status, mercado_pago_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      values.title,
      await uniqueGoalSlug(values.title),
      values.description || null,
      values.target,
      values.deadlineOn || null,
      values.status,
      values.mercadoPagoUrl || null,
      at,
      at,
    )
    .run()

  return id
}

// The slug stays as it was: links to the goal are already shared.
export async function updateGoal(id: string, values: GoalValues) {
  const result = await env.DB.prepare(
    `UPDATE goal SET title = ?, description = ?, target_amount = ?, deadline_on = ?, status = ?,
       mercado_pago_url = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(
      values.title,
      values.description || null,
      values.target,
      values.deadlineOn || null,
      values.status,
      values.mercadoPagoUrl || null,
      new Date().toISOString(),
      id,
    )
    .run()

  if (result.meta.changes === 0) {
    throw new GoalError('Esta meta ya no existe.')
  }
}

export async function insertDonation(values: DonationValues, userId: string) {
  const goal = await env.DB.prepare('SELECT status FROM goal WHERE id = ?')
    .bind(values.goalId)
    .first()

  if (!goal) {
    throw new GoalError('Esta meta ya no existe.')
  }

  await env.DB.batch(donationStatements({ ...values, externalReference: null, userId }))
}

export async function removeDonation(id: string, userId: string) {
  const row = await env.DB.prepare('SELECT goal_id, amount FROM donation WHERE id = ?')
    .bind(id)
    .first()

  if (!row) {
    throw new GoalError('Este aporte ya no existe.')
  }

  const donation = z.object({ goal_id: z.string().nullable(), amount: z.number() }).parse(row)

  await env.DB.batch([
    env.DB.prepare('DELETE FROM donation WHERE id = ?').bind(id),
    ...(donation.goal_id ? [syncGoalStatus(donation.goal_id)] : []),
    auditStatement({
      userId,
      entity: 'donation',
      entityId: id,
      action: 'delete',
      changes: { amount: donation.amount },
    }),
  ])
}
