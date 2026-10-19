import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { auditStatement } from '@/lib/audit'
import { FosterError } from './errors'
import type { AssignPlacement } from './schema'

// Writes for foster placements (spec 6.4). Placements also arrive from approved foster requests
// (src/lib/applications); this is the direct assignment from the panel. Every write goes in one
// batch with what it implies for the animal, so the placement and the animal never disagree.

// Direct assignment only makes sense before the animal leaves the foundation's hands.
const ASSIGNABLE_STATUSES = new Set(['intake', 'under_treatment', 'available'])

function now() {
  return new Date().toISOString()
}

const animalSchema = z.object({ status: z.string() })

const personSchema = z.object({ discarded_at: z.string().nullable() })

// Status, history and audit move together, like everywhere else an animal changes hands.
function animalMove(
  animalId: string,
  from: string | null,
  to: string,
  location: string,
  userId: string,
  at: string,
) {
  return [
    env.DB.prepare(
      'UPDATE animal SET status = ?, current_location = ?, updated_at = ? WHERE id = ?',
    ).bind(to, location, at, animalId),
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

export async function assignPlacement(values: AssignPlacement, userId: string) {
  const animal = await env.DB.prepare(
    'SELECT status FROM animal WHERE id = ? AND discarded_at IS NULL',
  )
    .bind(values.animalId)
    .first()

  if (!animal) {
    throw new FosterError('Ese animal ya no existe.')
  }

  const status = animalSchema.parse(animal).status

  if (!ASSIGNABLE_STATUSES.has(status)) {
    throw new FosterError('Ese animal no está para transitar (revisá su estado).')
  }

  const active = await env.DB.prepare(
    'SELECT 1 FROM foster_placement WHERE animal_id = ? AND ended_on IS NULL',
  )
    .bind(values.animalId)
    .first()

  if (active) {
    throw new FosterError('Ese animal ya está en un tránsito activo.')
  }

  const person = await env.DB.prepare('SELECT discarded_at FROM person WHERE id = ?')
    .bind(values.personId)
    .first()

  if (!person) {
    throw new FosterError('Esa persona ya no existe.')
  }

  if (personSchema.parse(person).discarded_at) {
    throw new FosterError('Esa persona fue anonimizada.')
  }

  const at = now()
  const id = crypto.randomUUID()

  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO foster_placement (id, animal_id, person_id, started_on, ended_on, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind(
      id,
      values.animalId,
      values.personId,
      values.startedOn,
      values.endedOn === '' ? null : values.endedOn,
      values.notes === '' ? null : values.notes,
      at,
    ),
    ...animalMove(values.animalId, status, 'fostered', 'foster', userId, at),
  ])

  return id
}

const placementSchema = z.object({
  animal_id: z.string(),
  animal_status: z.string(),
  ended_on: z.string().nullable(),
})

export async function endPlacement(id: string, endedOn: string, userId: string) {
  const row = await env.DB.prepare(
    `SELECT fp.animal_id, an.status AS animal_status, fp.ended_on
     FROM foster_placement fp JOIN animal an ON an.id = fp.animal_id
     WHERE fp.id = ?`,
  )
    .bind(id)
    .first()

  if (!row) {
    throw new FosterError('Ese tránsito ya no existe.')
  }

  const placement = placementSchema.parse(row)

  if (placement.ended_on) {
    throw new FosterError('Ese tránsito ya terminó.')
  }

  const at = now()

  const statements = [
    env.DB.prepare('UPDATE foster_placement SET ended_on = ? WHERE id = ?').bind(endedOn, id),
  ]

  // The animal comes back to the shelter, unless it moved on already (adopted from its foster
  // home, for example): then the placement just closes.
  if (placement.animal_status === 'fostered') {
    statements.push(
      ...animalMove(placement.animal_id, 'fostered', 'available', 'shelter', userId, at),
    )
  }

  await env.DB.batch(statements)
}
