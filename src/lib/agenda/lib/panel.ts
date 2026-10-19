import { env } from 'cloudflare:workers'
import type { z } from 'zod'
import { AgendaError } from './errors'
import type { agendaInputSchema } from './schema'

// Writes for agenda events (spec 6.7). The panel and the public API both go through here.

type EventValues = z.output<typeof agendaInputSchema>

function bindValues(values: EventValues) {
  return [
    values.type,
    values.title,
    values.startsAt,
    values.endsAt || null,
    values.venue || null,
    values.address || null,
    values.neighborhood || null,
    values.organizer,
    values.requirements || null,
    values.appointmentUrl || null,
    values.appointmentPhone || null,
    values.source || null,
  ]
}

export async function insertEvent(values: EventValues, userId: string) {
  const id = crypto.randomUUID()
  const at = new Date().toISOString()

  await env.DB.prepare(
    `INSERT INTO agenda_event (type, title, starts_at, ends_at, venue_name, public_address,
       neighborhood, organizer, requirements, appointment_url, appointment_phone, source,
       id, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(...bindValues(values), id, userId, at, at)
    .run()

  return id
}

export async function updateEvent(id: string, values: EventValues) {
  const result = await env.DB.prepare(
    `UPDATE agenda_event SET type = ?, title = ?, starts_at = ?, ends_at = ?, venue_name = ?,
       public_address = ?, neighborhood = ?, organizer = ?, requirements = ?, appointment_url = ?,
       appointment_phone = ?, source = ?, updated_at = ?
     WHERE id = ? AND discarded_at IS NULL`,
  )
    .bind(...bindValues(values), new Date().toISOString(), id)
    .run()

  if (result.meta.changes === 0) {
    throw new AgendaError('Este evento ya no existe.')
  }
}

// Soft delete: the event leaves the site and the panel but the row stays.
export async function discardEvent(id: string) {
  const at = new Date().toISOString()

  const result = await env.DB.prepare(
    'UPDATE agenda_event SET discarded_at = ?, updated_at = ? WHERE id = ? AND discarded_at IS NULL',
  )
    .bind(at, at, id)
    .run()

  if (result.meta.changes === 0) {
    throw new AgendaError('Este evento ya no existe.')
  }
}

// REST API (docs/spec/api-rest.md): the same writes, but only on events the token's own user
// created. A municipality token cannot touch Funpabia's events, and the other way around.
export async function updateEventOwned(id: string, values: EventValues, userId: string) {
  const result = await env.DB.prepare(
    `UPDATE agenda_event SET type = ?, title = ?, starts_at = ?, ends_at = ?, venue_name = ?,
       public_address = ?, neighborhood = ?, organizer = ?, requirements = ?, appointment_url = ?,
       appointment_phone = ?, source = ?, updated_at = ?
     WHERE id = ? AND created_by = ? AND discarded_at IS NULL`,
  )
    .bind(...bindValues(values), new Date().toISOString(), id, userId)
    .run()

  if (result.meta.changes === 0) {
    throw new AgendaError('Este evento ya no existe.')
  }
}

export async function discardEventOwned(id: string, userId: string) {
  const at = new Date().toISOString()

  const result = await env.DB.prepare(
    `UPDATE agenda_event SET discarded_at = ?, updated_at = ?
     WHERE id = ? AND created_by = ? AND discarded_at IS NULL`,
  )
    .bind(at, at, id, userId)
    .run()

  if (result.meta.changes === 0) {
    throw new AgendaError('Este evento ya no existe.')
  }
}
