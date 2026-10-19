import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { auditStatement } from '@/lib/audit'
import { SPECIES_LABEL } from '@/lib/catalog'
import { todayCalendar } from '@/lib/format'
import { slugify } from '@/lib/slug'
import { AnimalError } from './errors'
import type { AnimalDetails, Intake, UploadedPhoto } from './schema'

// Writes for the panel. Every change goes in one batch with its history and audit rows, so the
// record and its trail never disagree.

function now() {
  return new Date().toISOString()
}

// "Lobito" -> "lobito-4821". The number keeps slugs unique and URLs short (spec 6.1).
async function uniqueSlug(name: string) {
  const base = slugify(name, 40) || 'animal'

  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = `${base}-${1000 + Math.floor(Math.random() * 9000)}`
    const taken = await env.DB.prepare('SELECT 1 FROM animal WHERE slug = ?').bind(slug).first()

    if (!taken) {
      return slug
    }
  }

  throw new AnimalError('No pudimos generar el link de la ficha. Probá de nuevo.')
}

function photoStatements(
  animalId: string,
  name: string,
  species: Intake['species'],
  photos: UploadedPhoto[],
  first: number,
) {
  return photos.map((photo, index) =>
    env.DB.prepare(
      `INSERT INTO photo (id, animal_id, r2_key, position, alt_text, width, height, is_primary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      animalId,
      photo.key,
      first + index,
      // A default the volunteer can improve later: every photo needs alt text (spec 9).
      `${name}, ${SPECIES_LABEL[species].toLowerCase()} de Funpabia, foto ${first + index + 1}`,
      photo.width,
      photo.height,
      first === 0 && index === 0 ? 1 : 0,
      now(),
    ),
  )
}

export async function insertIntake(intake: Intake, userId: string) {
  const id = crypto.randomUUID()
  const slug = await uniqueSlug(intake.name)
  const at = now()

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO animal (id, name, slug, species, sex, age_category, size, status, intake_date, published,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'intake', ?, 0, ?, ?)`,
    ).bind(
      id,
      intake.name,
      slug,
      intake.species,
      intake.sex,
      intake.ageCategory,
      intake.size,
      todayCalendar(),
      at,
      at,
    ),
    ...photoStatements(id, intake.name, intake.species, intake.photos, 0),
    env.DB.prepare(
      "INSERT INTO animal_status_history (id, animal_id, previous_status, new_status, user_id, created_at) VALUES (?, ?, NULL, 'intake', ?, ?)",
    ).bind(crypto.randomUUID(), id, userId, at),
    auditStatement({
      userId,
      entity: 'animal',
      entityId: id,
      action: 'create',
      changes: { status: 'intake', photos: intake.photos.length },
    }),
  ])

  return id
}

const COLUMNS = {
  name: 'name',
  species: 'species',
  sex: 'sex',
  ageCategory: 'age_category',
  size: 'size',
  color: 'color',
  breed: 'approx_breed',
  story: 'story',
  personality: 'personality',
  goodWithDogs: 'good_with_dogs',
  goodWithCats: 'good_with_cats',
  goodWithKids: 'good_with_kids',
  neutered: 'neutered',
  vaccinated: 'vaccinated',
  dewormed: 'dewormed',
  intakeDate: 'intake_date',
  intakeReason: 'intake_reason',
  location: 'current_location',
  specialRequirements: 'special_requirements',
} as const satisfies Record<Exclude<keyof AnimalDetails, 'id'>, string>

function toColumnValue(value: AnimalDetails[keyof typeof COLUMNS]) {
  if (Array.isArray(value)) {
    return JSON.stringify(value)
  }

  if (value === true || value === false) {
    return value ? 1 : 0
  }

  // An emptied optional text field clears the column.
  return value === '' ? null : value
}

const FIELDS = Object.keys(COLUMNS).filter(
  (field): field is keyof typeof COLUMNS => field in COLUMNS,
)

const storedRowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null()]))

// Writes only the fields that changed, and the audit names them ("who changed what", spec 7).
export async function updateDetails(details: AnimalDetails, userId: string) {
  const row = await env.DB.prepare(
    `SELECT ${Object.values(COLUMNS).join(', ')} FROM animal WHERE id = ?`,
  )
    .bind(details.id)
    .first()

  if (!row) {
    throw new AnimalError('Este animal ya no existe.')
  }

  const stored = new Map(Object.entries(storedRowSchema.parse(row)))

  const changed = FIELDS.filter(
    (field) => stored.get(COLUMNS[field]) !== toColumnValue(details[field]),
  )

  if (changed.length === 0) {
    return
  }

  const assignments = changed.map((field) => `${COLUMNS[field]} = ?`).join(', ')

  await env.DB.batch([
    env.DB.prepare(`UPDATE animal SET ${assignments}, updated_at = ? WHERE id = ?`).bind(
      ...changed.map((field) => toColumnValue(details[field])),
      now(),
      details.id,
    ),
    // Field names only: the story and notes are not copied into the audit trail.
    auditStatement({
      userId,
      entity: 'animal',
      entityId: details.id,
      action: 'update',
      changes: { fields: changed.join(',') },
    }),
  ])
}

async function currentState(id: string) {
  const row = await env.DB.prepare(
    'SELECT status, published, (SELECT COUNT(*) FROM photo WHERE animal_id = animal.id) AS photos FROM animal WHERE id = ?',
  )
    .bind(id)
    .first()

  if (!row) {
    throw new AnimalError('Este animal ya no existe.')
  }

  return z.object({ status: z.string(), published: z.number(), photos: z.number() }).parse(row)
}

export async function changeStatus(id: string, status: string, userId: string) {
  const current = await currentState(id)

  if (current.status === status) {
    return
  }

  const at = now()

  await env.DB.batch([
    env.DB.prepare('UPDATE animal SET status = ?, updated_at = ? WHERE id = ?').bind(
      status,
      at,
      id,
    ),
    env.DB.prepare(
      'INSERT INTO animal_status_history (id, animal_id, previous_status, new_status, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), id, current.status, status, userId, at),
    auditStatement({
      userId,
      entity: 'animal',
      entityId: id,
      action: 'update',
      changes: { status },
    }),
  ])
}

export async function setFlags(
  id: string,
  flags: { published?: boolean; urgent?: boolean },
  userId: string,
) {
  const current = await currentState(id)

  // Spec 3: every published animal has a profile with a photo.
  if (flags.published && current.photos === 0) {
    throw new AnimalError('Sumá al menos una foto antes de publicar.')
  }

  const sets: string[] = []
  const values: number[] = []

  if (flags.published !== undefined) {
    sets.push('published = ?')
    values.push(flags.published ? 1 : 0)
  }

  if (flags.urgent !== undefined) {
    sets.push('urgent = ?')
    values.push(flags.urgent ? 1 : 0)
  }

  // null: that flag did not change.
  const changes = { published: flags.published ?? null, urgent: flags.urgent ?? null }

  if (sets.length === 0) {
    return
  }

  await env.DB.batch([
    env.DB.prepare(`UPDATE animal SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).bind(
      ...values,
      now(),
      id,
    ),
    auditStatement({ userId, entity: 'animal', entityId: id, action: 'update', changes }),
  ])
}

export async function appendPhotos(id: string, photos: UploadedPhoto[], userId: string) {
  const row = await env.DB.prepare(
    `SELECT name, species, (SELECT COUNT(*) FROM photo WHERE animal_id = animal.id) AS photos FROM animal WHERE id = ?`,
  )
    .bind(id)
    .first()

  if (!row) {
    throw new AnimalError('Este animal ya no existe.')
  }

  const animal = z
    .object({ name: z.string(), species: z.enum(['dog', 'cat', 'other']), photos: z.number() })
    .parse(row)

  if (animal.photos + photos.length > 12) {
    throw new AnimalError('Cada animal puede tener hasta 12 fotos.')
  }

  await env.DB.batch([
    ...photoStatements(id, animal.name, animal.species, photos, animal.photos),
    auditStatement({
      userId,
      entity: 'animal',
      entityId: id,
      action: 'update',
      changes: { photosAdded: photos.length },
    }),
  ])
}
