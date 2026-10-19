import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { auditStatement } from '@/lib/audit'
import { todayCalendar } from '@/lib/format'
import { ApplicationError } from './errors'
import type { Stage } from './labels'

// Stage changes (spec 6.4 and 8.1). Each one goes in a single batch with what it implies for the
// animal, so the request and the animal never disagree.

const CLOSED_WITH_REASON = new Set<Stage>(['rejected', 'withdrawn'])

function now() {
  return new Date().toISOString()
}

// Calendar date arithmetic on 'YYYY-MM-DD'.

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)

  return value.toISOString().slice(0, 10)
}

function addMonths(date: string, months: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCMonth(value.getUTCMonth() + months)

  return value.toISOString().slice(0, 10)
}

const currentSchema = z.object({
  stage: z.string(),
  type: z.enum(['adoption', 'foster']),
  person_id: z.string(),
  animal_id: z.string().nullable(),
  animal_status: z.string().nullable(),
  age_category: z.string().nullable(),
  approx_birth_date: z.string().nullable(),
})

async function current(id: string) {
  const row = await env.DB.prepare(
    `SELECT a.stage, a.type, a.person_id, a.animal_id, an.status AS animal_status, an.age_category,
       an.approx_birth_date
     FROM application a LEFT JOIN animal an ON an.id = a.animal_id
     WHERE a.id = ? AND a.discarded_at IS NULL`,
  )
    .bind(id)
    .first()

  if (!row) {
    throw new ApplicationError('Esta solicitud ya no existe.')
  }

  return currentSchema.parse(row)
}

function animalStatus(
  animalId: string,
  from: string | null,
  to: string,
  userId: string,
  at: string,
) {
  return [
    env.DB.prepare('UPDATE animal SET status = ?, updated_at = ? WHERE id = ?').bind(
      to,
      at,
      animalId,
    ),
    env.DB.prepare(
      'INSERT INTO animal_status_history (id, animal_id, previous_status, new_status, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), animalId, from, to, userId, at),
    auditStatement({
      userId,
      entity: 'animal',
      entityId: animalId,
      action: 'update',
      changes: { status: to },
    }),
  ]
}

// Spec 6.4: follow-ups at 7 days, 30 days and 6 months, plus neutering at 6 months of age for
// puppies. Without a birth date, a puppy's neutering check goes 3 months after delivery.
function followUps(
  adoptionId: string,
  delivered: string,
  ageCategory: string | null,
  birthDate: string | null,
) {
  const plan: [string, string][] = [
    ['day_7', addDays(delivered, 7)],
    ['day_30', addDays(delivered, 30)],
    ['month_6', addMonths(delivered, 6)],
  ]

  if (ageCategory === 'baby') {
    const neutering = birthDate ? addMonths(birthDate, 6) : addMonths(delivered, 3)
    plan.push(['neutering', neutering < delivered ? delivered : neutering])
  }

  return plan.map(([type, on]) =>
    env.DB.prepare(
      'INSERT INTO follow_up (id, adoption_id, type, scheduled_on, created_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), adoptionId, type, on, now()),
  )
}

export async function changeStage(
  id: string,
  stage: Stage,
  reason: string | undefined,
  userId: string,
) {
  const request = await current(id)

  if (request.stage === stage) {
    return
  }

  if (request.stage === 'delivered') {
    throw new ApplicationError(
      'Esta solicitud ya se entregó: la adopción o el tránsito ya están registrados.',
    )
  }

  if (CLOSED_WITH_REASON.has(stage) && !reason) {
    throw new ApplicationError('Escribí el motivo: queda registrado para la comisión.')
  }

  if ((stage === 'approved' || stage === 'delivered') && !request.animal_id) {
    throw new ApplicationError('Asigná un animal antes de aprobar o entregar.')
  }

  const at = now()

  const statements = [
    env.DB.prepare(
      'UPDATE application SET stage = ?, rejection_reason = ?, updated_at = ? WHERE id = ?',
    ).bind(stage, CLOSED_WITH_REASON.has(stage) ? reason : null, at, id),
    env.DB.prepare(
      'INSERT INTO application_stage_history (id, application_id, stage, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), id, stage, userId, at),
    auditStatement({
      userId,
      entity: 'application',
      entityId: id,
      action: 'update',
      changes: { stage },
    }),
  ]

  const animalId = request.animal_id

  // Approved: the animal stops taking requests in the catalog.
  if (animalId && stage === 'approved' && request.animal_status === 'available') {
    statements.push(...animalStatus(animalId, 'available', 'reserved', userId, at))
  }

  // An approved request that falls through gives the animal back to the catalog.
  if (
    animalId &&
    request.stage === 'approved' &&
    CLOSED_WITH_REASON.has(stage) &&
    request.animal_status === 'reserved'
  ) {
    statements.push(...animalStatus(animalId, 'reserved', 'available', userId, at))
  }

  if (animalId && stage === 'delivered') {
    const delivered = todayCalendar()

    if (request.type === 'adoption') {
      const adoptionId = crypto.randomUUID()
      statements.push(
        env.DB.prepare(
          'INSERT INTO adoption (id, animal_id, person_id, application_id, delivered_on, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        ).bind(adoptionId, animalId, request.person_id, id, delivered, at),
        ...followUps(adoptionId, delivered, request.age_category, request.approx_birth_date),
        ...animalStatus(animalId, request.animal_status, 'adopted', userId, at),
      )
    } else {
      statements.push(
        env.DB.prepare(
          'INSERT INTO foster_placement (id, animal_id, person_id, started_on, created_at) VALUES (?, ?, ?, ?, ?)',
        ).bind(crypto.randomUUID(), animalId, request.person_id, delivered, at),
        env.DB.prepare("UPDATE animal SET current_location = 'foster' WHERE id = ?").bind(animalId),
        ...animalStatus(animalId, request.animal_status, 'fostered', userId, at),
      )
    }
  }

  await env.DB.batch(statements)
}

export async function saveNotes(id: string, notes: string) {
  const result = await env.DB.prepare(
    'UPDATE application SET internal_notes = ?, updated_at = ? WHERE id = ? AND discarded_at IS NULL',
  )
    .bind(notes === '' ? null : notes, now(), id)
    .run()

  if (result.meta.changes === 0) {
    throw new ApplicationError('Esta solicitud ya no existe.')
  }
}

export async function assignAnimal(id: string, animalId: string, userId: string) {
  const request = await current(id)

  if (request.stage === 'delivered') {
    throw new ApplicationError('Esta solicitud ya se entregó.')
  }

  const animal = await env.DB.prepare('SELECT 1 FROM animal WHERE id = ?').bind(animalId).first()

  if (!animal) {
    throw new ApplicationError('Ese animal ya no existe.')
  }

  await env.DB.batch([
    env.DB.prepare('UPDATE application SET animal_id = ?, updated_at = ? WHERE id = ?').bind(
      animalId,
      now(),
      id,
    ),
    auditStatement({
      userId,
      entity: 'application',
      entityId: id,
      action: 'update',
      changes: { animal: animalId },
    }),
  ])
}
