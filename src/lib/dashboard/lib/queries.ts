import { env } from 'cloudflare:workers'
import { z } from 'zod'

const countSchema = z.object({ total: z.number() })

async function count(sql: string) {
  return countSchema.parse(await env.DB.prepare(sql).first()).total
}

export async function selectStatusCounts() {
  const { results } = await env.DB.prepare(
    'SELECT status, COUNT(*) AS total FROM animal WHERE discarded_at IS NULL GROUP BY status',
  ).all()

  return z.array(z.object({ status: z.string(), total: z.number() })).parse(results)
}

export function countUrgent() {
  return count(
    "SELECT COUNT(*) AS total FROM animal WHERE urgent = 1 AND status NOT IN ('adopted', 'deceased') AND discarded_at IS NULL",
  )
}

export function countUnpublished() {
  return count(
    "SELECT COUNT(*) AS total FROM animal WHERE published = 0 AND status IN ('available', 'reserved') AND discarded_at IS NULL",
  )
}

export function countPendingReports() {
  return count("SELECT COUNT(*) AS total FROM lost_found_report WHERE status = 'pending'")
}

export function countNewApplications() {
  return count(
    "SELECT COUNT(*) AS total FROM application WHERE stage = 'new' AND discarded_at IS NULL",
  )
}

// Calendar dates are compared in Argentina's day, not UTC's.
export function countOverdueFollowUps() {
  return count(
    "SELECT COUNT(*) AS total FROM follow_up WHERE completed_on IS NULL AND scheduled_on < date('now', '-3 hours')",
  )
}
