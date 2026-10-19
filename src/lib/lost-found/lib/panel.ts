import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { toPhoto } from '@/lib/photos'
import { deletePhoto } from '@/lib/photos/server'
import { ReportError } from './errors'
import {
  REPORT_LIFETIME_DAYS,
  kindSchema,
  sexSchema,
  sizeSchema,
  speciesSchema,
  statusSchema,
  type ReportStatus,
} from './schema'

// The committee's side: every report, pending ones first. Server only.

const DAY_MS = 24 * 60 * 60 * 1000

const rowSchema = z
  .object({
    id: z.string(),
    kind: kindSchema,
    species: speciesSchema,
    sex: sexSchema,
    size: sizeSchema,
    color: z.string(),
    marks: z.string().nullable(),
    event_on: z.string(),
    description: z.string(),
    status: statusSchema,
    expires_at: z.string(),
    contact_name: z.string(),
    contact_phone: z.string(),
    created_at: z.string(),
    zone_name: z.string(),
    r2_key: z.string().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    kind: row.kind,
    species: row.species,
    sex: row.sex,
    size: row.size,
    color: row.color,
    marks: row.marks,
    eventOn: row.event_on,
    description: row.description,
    status: row.status,
    expired: row.status === 'active' && row.expires_at <= new Date().toISOString(),
    expiresAt: row.expires_at,
    contact: { name: row.contact_name, phone: row.contact_phone },
    createdAt: row.created_at,
    zoneName: row.zone_name,
    photo: row.r2_key ? toPhoto(row.r2_key, row.color, row.width, row.height) : null,
  }))

export async function selectPanelReports() {
  const { results } = await env.DB.prepare(
    `SELECT r.id, r.kind, r.species, r.sex, r.size, r.color, r.marks, r.event_on, r.description,
       r.status, r.expires_at, r.contact_name, r.contact_phone, r.created_at,
       z.name AS zone_name, p.r2_key, p.width, p.height
     FROM lost_found_report r JOIN zone z ON z.id = r.zone_id
       LEFT JOIN lost_found_photo p ON p.report_id = r.id AND p.position = 0
     ORDER BY r.status = 'pending' DESC, r.created_at DESC LIMIT 200`,
  ).all()

  return z.array(rowSchema).parse(results)
}

// For good: the report, its photo rows (ON DELETE CASCADE) and the files in R2. Meant for spam and
// test reports; a real one that is over is better hidden or reunited.
export async function deleteReport(id: string) {
  const { results } = await env.DB.prepare(
    'SELECT r2_key FROM lost_found_photo WHERE report_id = ?',
  )
    .bind(id)
    .all()

  const result = await env.DB.prepare('DELETE FROM lost_found_report WHERE id = ?').bind(id).run()

  if (result.meta.changes === 0) {
    throw new ReportError('Este reporte ya no existe.')
  }

  // After the rows are gone: a failed R2 delete leaves an orphan file (the nightly cleanup takes
  // it), never a broken report.
  const keys = z.array(z.object({ r2_key: z.string() })).parse(results)
  await Promise.all(keys.map((photo) => deletePhoto(photo.r2_key)))
}

// Approving starts the report's lifetime again from today.
export async function changeStatus(id: string, status: ReportStatus) {
  if (status === 'pending') {
    throw new ReportError('Un reporte no vuelve a estar por revisar.')
  }

  const now = Date.now()

  const result = await env.DB.prepare(
    `UPDATE lost_found_report
     SET status = ?, updated_at = ?, expires_at = CASE WHEN ? = 'active' THEN ? ELSE expires_at END
     WHERE id = ?`,
  )
    .bind(
      status,
      new Date(now).toISOString(),
      status,
      new Date(now + REPORT_LIFETIME_DAYS * DAY_MS).toISOString(),
      id,
    )
    .run()

  if (result.meta.changes === 0) {
    throw new ReportError('Este reporte ya no existe.')
  }
}
