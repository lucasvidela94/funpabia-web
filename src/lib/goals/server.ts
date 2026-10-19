import { env } from 'cloudflare:workers'
import { auditStatement } from '@/lib/audit'

// Second entry, server only: the statements that record a donation, for modules that put one in
// their own batch (a raffle's proceeds). Recording through here keeps the goal's status in step.

type DonationRecord = {
  goalId: string
  amount: number
  donatedOn: string
  method: 'alias' | 'cbu' | 'mp_link' | 'cash'
  // Empty means anonymous.
  publicName: string
  // Unique across donations: the same reference is never counted twice.
  externalReference: string | null
  userId: string
}

// Spec 8.3, step 5: reaching 100 % marks the goal as fulfilled; removing a donation recorded by
// mistake below the target opens it again. Closed goals are left alone.
export function syncGoalStatus(goalId: string) {
  return env.DB.prepare(
    `UPDATE goal SET status = CASE
       WHEN (SELECT current_amount FROM goal_progress WHERE goal_id = goal.id) >= target_amount THEN 'fulfilled'
       ELSE 'active' END,
     updated_at = ?
     WHERE id = ? AND status IN ('active', 'fulfilled')`,
  ).bind(new Date().toISOString(), goalId)
}

export function donationStatements(record: DonationRecord) {
  const id = crypto.randomUUID()
  const anonymous = record.publicName === ''

  return [
    env.DB.prepare(
      `INSERT INTO donation (id, goal_id, amount, donated_on, method, public_name, anonymous, external_reference, recorded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      record.goalId,
      record.amount,
      record.donatedOn,
      record.method,
      anonymous ? null : record.publicName,
      anonymous ? 1 : 0,
      record.externalReference,
      record.userId,
      new Date().toISOString(),
    ),
    syncGoalStatus(record.goalId),
    auditStatement({
      userId: record.userId,
      entity: 'donation',
      entityId: id,
      action: 'create',
      changes: { amount: record.amount, method: record.method },
    }),
  ]
}
