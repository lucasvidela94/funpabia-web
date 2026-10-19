import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { todayCalendar } from '@/lib/format'
import { toPhoto } from '@/lib/photos'
import { REPORT_LIFETIME_DAYS, type ReportInput, type ReportSearch } from './schema'
import { kindSchema, sexSchema, sizeSchema, speciesSchema, statusSchema } from './schema'

// Public side of the reports: what a visitor may read (active ones that have not expired, and
// reunited ones as happy endings) and the one write a visitor makes. Server only.

const DAY_MS = 24 * 60 * 60 * 1000

// "Cerca" means this many kilometers around the chosen zone's center.
const NEARBY_KM = 15

const KM_PER_DEGREE = 111

const SPECIES_FROM_URL = { perro: 'dog', gato: 'cat', otro: 'other' } as const

const KIND_FROM_URL = { perdido: 'lost', encontrado: 'found' } as const

const zoneRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
})

export async function selectZones() {
  const { results } = await env.DB.prepare(
    'SELECT id, slug, name, latitude, longitude FROM zone ORDER BY position',
  ).all()

  return z
    .array(zoneRowSchema)
    .parse(results)
    .map((zone) => ({ slug: zone.slug, name: zone.name }))
}

async function findZone(slug: string) {
  const row = await env.DB.prepare(
    'SELECT id, slug, name, latitude, longitude FROM zone WHERE slug = ?',
  )
    .bind(slug)
    .first()

  return row ? zoneRowSchema.parse(row) : null
}

// A square around the zone: cheap to filter in SQL and exact enough at this scale.
function boundingBox(latitude: number, longitude: number) {
  const latitudeSpan = NEARBY_KM / KM_PER_DEGREE
  const longitudeSpan = NEARBY_KM / (KM_PER_DEGREE * Math.cos((latitude * Math.PI) / 180))

  return {
    south: latitude - latitudeSpan,
    north: latitude + latitudeSpan,
    west: longitude - longitudeSpan,
    east: longitude + longitudeSpan,
  }
}

const summarySchema = z
  .object({
    id: z.string(),
    kind: kindSchema,
    species: speciesSchema,
    sex: sexSchema,
    size: sizeSchema,
    color: z.string(),
    event_on: z.string(),
    status: statusSchema,
    zone_slug: z.string(),
    zone_name: z.string(),
    zone_latitude: z.number(),
    zone_longitude: z.number(),
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
    eventOn: row.event_on,
    status: row.status,
    // The center of the town, the only place the site ever shows (never a street or a pin).
    zone: {
      slug: row.zone_slug,
      name: row.zone_name,
      latitude: row.zone_latitude,
      longitude: row.zone_longitude,
    },
    photo: row.r2_key
      ? toPhoto(row.r2_key, `${row.color}, en ${row.zone_name}`, row.width, row.height)
      : null,
  }))

const SUMMARY_COLUMNS = `r.id, r.kind, r.species, r.sex, r.size, r.color, r.event_on, r.status,
  z.slug AS zone_slug, z.name AS zone_name, z.latitude AS zone_latitude,
  z.longitude AS zone_longitude, p.r2_key, p.width, p.height`

const SUMMARY_JOINS = `FROM lost_found_report r JOIN zone z ON z.id = r.zone_id
  LEFT JOIN lost_found_photo p ON p.report_id = r.id AND p.position = 0`

// Active reports within their lifetime, newest event first.
export async function selectReports(search: ReportSearch, limit: number) {
  const where = ["r.status = 'active'", 'r.expires_at > ?']
  const params: (string | number)[] = [new Date().toISOString()]

  if (search.tipo) {
    where.push('r.kind = ?')
    params.push(KIND_FROM_URL[search.tipo])
  }

  if (search.especie) {
    where.push('r.species = ?')
    params.push(SPECIES_FROM_URL[search.especie])
  }

  if (search.dias) {
    where.push('r.event_on >= ?')
    params.push(todayCalendar(Date.now() - search.dias * DAY_MS))
  }

  const zone = search.zona ? await findZone(search.zona) : null

  if (zone && search.cerca) {
    const box = boundingBox(zone.latitude, zone.longitude)
    where.push('z.latitude BETWEEN ? AND ?', 'z.longitude BETWEEN ? AND ?')
    params.push(box.south, box.north, box.west, box.east)
  } else if (zone) {
    where.push('r.zone_id = ?')
    params.push(zone.id)
  }

  const { results } = await env.DB.prepare(
    `SELECT ${SUMMARY_COLUMNS} ${SUMMARY_JOINS}
     WHERE ${where.join(' AND ')}
     ORDER BY r.event_on DESC, r.created_at DESC LIMIT ?`,
  )
    .bind(...params, limit)
    .all()

  return z.array(summarySchema).parse(results)
}

const detailSchema = z.object({
  marks: z.string().nullable(),
  description: z.string(),
  contact_name: z.string(),
  contact_phone: z.string(),
  expires_at: z.string(),
})

const photoRowSchema = z.object({
  r2_key: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
})

// Active reports and reunited ones (a happy ending stays readable). Pending, hidden and expired
// ones do not exist for visitors.
// Public reports, plus a pending one for its owner (the hash of the edit link's token), so the
// link sent right after reporting shows the report while the committee reviews it.
export async function selectReport(id: string, ownerTokenHash: string | null) {
  const row = await env.DB.prepare(
    `SELECT ${SUMMARY_COLUMNS}, r.marks, r.description, r.contact_name, r.contact_phone, r.expires_at
     ${SUMMARY_JOINS}
     WHERE r.id = ? AND (r.status = 'reunited' OR (r.status = 'active' AND r.expires_at > ?)
       OR (r.status = 'pending' AND r.edit_token_hash = ?))`,
  )
    .bind(id, new Date().toISOString(), ownerTokenHash ?? '')
    .first()

  if (!row) {
    return null
  }

  const summary = summarySchema.parse(row)
  const detail = detailSchema.parse(row)

  const { results } = await env.DB.prepare(
    'SELECT r2_key, width, height FROM lost_found_photo WHERE report_id = ? ORDER BY position',
  )
    .bind(id)
    .all()

  const alt = `${summary.color}, en ${summary.zone.name}`

  return {
    ...summary,
    marks: detail.marks,
    description: detail.description,
    contact: { name: detail.contact_name, phone: detail.contact_phone },
    photos: z
      .array(photoRowSchema)
      .parse(results)
      .map((photo) => toPhoto(photo.r2_key, alt, photo.width, photo.height)),
  }
}

// The report starts `pending`: nothing is public until the committee approves it.
export async function insertReport(input: ReportInput, tokenHash: string, privacyVersion: string) {
  const zone = await findZone(input.zone)

  if (!zone) {
    return null
  }

  const id = crypto.randomUUID()
  const now = new Date()

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO lost_found_report (id, kind, species, sex, size, color, marks, event_on,
         description, zone_id, contact_name, contact_phone, expires_at, edit_token_hash,
         consent_at, consent_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      input.kind,
      input.species,
      input.sex,
      input.size,
      input.color,
      input.marks === '' ? null : input.marks,
      input.eventOn,
      input.description,
      zone.id,
      input.contactName,
      input.contactPhone,
      new Date(now.getTime() + REPORT_LIFETIME_DAYS * DAY_MS).toISOString(),
      tokenHash,
      now.toISOString(),
      privacyVersion,
      now.toISOString(),
      now.toISOString(),
    ),
    ...input.photos.map((photo, position) =>
      env.DB.prepare(
        'INSERT INTO lost_found_photo (id, report_id, r2_key, position, width, height) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(crypto.randomUUID(), id, photo.key, position, photo.width, photo.height),
    ),
  ])

  return id
}

// True when the token belongs to this report and the report is still open to be closed.
export async function tokenOpensReport(id: string, tokenHash: string) {
  const row = await env.DB.prepare(
    `SELECT 1 FROM lost_found_report WHERE id = ? AND edit_token_hash = ? AND status = 'active'`,
  )
    .bind(id, tokenHash)
    .first()

  return row !== null
}

// True when the token matched an active report and it is now closed.
export async function reuniteWithToken(id: string, tokenHash: string) {
  const result = await env.DB.prepare(
    `UPDATE lost_found_report SET status = 'reunited', updated_at = ?
     WHERE id = ? AND edit_token_hash = ? AND status = 'active'`,
  )
    .bind(new Date().toISOString(), id, tokenHash)
    .run()

  return result.meta.changes > 0
}
