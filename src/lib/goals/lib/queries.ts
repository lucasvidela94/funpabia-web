import { env } from 'cloudflare:workers'
import { z } from 'zod'

const goalRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  target_amount: z.number(),
  deadline_on: z.string().nullable(),
  status: z.enum(['active', 'fulfilled', 'closed']),
  mercado_pago_url: z.string().nullable(),
  raised: z.number(),
  donations: z.number(),
  updated_at: z.string(),
})

export type GoalRow = z.infer<typeof goalRowSchema>

// The progress comes from the goal_progress view (migrations/0001_init.sql). The last update shown
// to visitors is the newest of the last donation and the last goal edit.
const GOAL_SELECT = `
  SELECT g.id, g.title, g.slug, g.description, g.target_amount, g.deadline_on, g.status,
    g.mercado_pago_url,
    gp.current_amount AS raised,
    gp.contributions AS donations,
    MAX(g.updated_at, COALESCE(gp.last_donated_on, '')) AS updated_at
  FROM goal g JOIN goal_progress gp ON gp.goal_id = g.id`

export async function selectGoals(status: GoalRow['status']): Promise<GoalRow[]> {
  const { results } = await env.DB.prepare(
    `${GOAL_SELECT} WHERE g.status = ? ORDER BY g.deadline_on IS NULL, g.deadline_on, g.created_at`,
  )
    .bind(status)
    .all()

  return z.array(goalRowSchema).parse(results)
}

export async function selectGoal(slug: string): Promise<GoalRow | null> {
  const row = await env.DB.prepare(`${GOAL_SELECT} WHERE g.slug = ?`).bind(slug).first()

  return row ? goalRowSchema.parse(row) : null
}

// Panel: every goal, active ones first.
export async function selectAllGoalRows(): Promise<GoalRow[]> {
  const { results } = await env.DB.prepare(
    `${GOAL_SELECT} ORDER BY g.status <> 'active', g.status <> 'fulfilled', g.created_at DESC LIMIT 200`,
  ).all()

  return z.array(goalRowSchema).parse(results)
}

export async function selectGoalRowById(id: string): Promise<GoalRow | null> {
  const row = await env.DB.prepare(`${GOAL_SELECT} WHERE g.id = ?`).bind(id).first()

  return row ? goalRowSchema.parse(row) : null
}
