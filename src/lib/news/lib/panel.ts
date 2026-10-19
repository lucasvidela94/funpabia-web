import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { deletePhoto } from '@/lib/photos/server'
import { slugify } from '@/lib/slug'
import { NewsError } from './errors'
import type { newsInputSchema } from './schema'

// Writes for news posts (spec 6.7). Any panel role can manage them; the municipality user only
// does the agenda.

type PostValues = z.output<typeof newsInputSchema>

const tagsSchema = z.string().transform((text) => z.array(z.string()).parse(JSON.parse(text)))

// Slugs are stable once created so links never break: "rescate-en-el-rio", "rescate-en-el-rio-2".
async function freshSlug(title: string) {
  const base = slugify(title) || 'noticia'

  const { results } = await env.DB.prepare(
    "SELECT slug FROM news_post WHERE slug = ?1 OR slug LIKE ?1 || '-%'",
  )
    .bind(base)
    .all()

  const taken = new Set(
    z
      .array(z.object({ slug: z.string() }))
      .parse(results)
      .map((row) => row.slug),
  )

  if (!taken.has(base)) {
    return base
  }

  let suffix = 2

  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1
  }

  return `${base}-${suffix}`
}

async function existingAnimalIds(ids: string[]) {
  if (ids.length === 0) {
    return []
  }

  const placeholders = ids.map(() => '?').join(',')

  const { results } = await env.DB.prepare(
    `SELECT id FROM animal WHERE id IN (${placeholders}) AND discarded_at IS NULL`,
  )
    .bind(...ids)
    .all()

  return z
    .array(z.object({ id: z.string() }))
    .parse(results)
    .map((row) => row.id)
}

async function checkAnimals(ids: string[]) {
  const found = new Set(await existingAnimalIds(ids))
  const missing = ids.filter((id) => !found.has(id))

  if (missing.length > 0) {
    throw new NewsError('Uno de los animales vinculados ya no existe. Sacalo y guardá de nuevo.')
  }
}

async function linkAnimals(postId: string, ids: string[]) {
  await env.DB.prepare('DELETE FROM news_post_animal WHERE news_post_id = ?').bind(postId).run()

  for (const animalId of ids) {
    await env.DB.prepare('INSERT INTO news_post_animal (news_post_id, animal_id) VALUES (?, ?)')
      .bind(postId, animalId)
      .run()
  }
}

export async function insertPost(values: PostValues, authorId: string) {
  await checkAnimals(values.animalIds)

  const id = crypto.randomUUID()
  const at = new Date().toISOString()
  const slug = await freshSlug(values.title)

  await env.DB.prepare(
    `INSERT INTO news_post (id, title, slug, body, image_r2_key, tags, published_at, author_id,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      values.title,
      slug,
      values.body,
      values.imageKey === '' ? null : values.imageKey,
      JSON.stringify(values.tags),
      values.published ? at : null,
      authorId,
      at,
      at,
    )
    .run()

  await linkAnimals(id, values.animalIds)

  return id
}

const editRowSchema = z.object({
  image_r2_key: z.string().nullable(),
  published_at: z.string().nullable(),
})

export async function updatePost(id: string, values: PostValues) {
  await checkAnimals(values.animalIds)

  const row = await env.DB.prepare('SELECT image_r2_key, published_at FROM news_post WHERE id = ?')
    .bind(id)
    .first()

  if (!row) {
    throw new NewsError('Esta noticia ya no existe.')
  }

  const current = editRowSchema.parse(row)
  const at = new Date().toISOString()

  await env.DB.prepare(
    `UPDATE news_post SET title = ?, body = ?, image_r2_key = ?, tags = ?,
       published_at = CASE WHEN ? THEN COALESCE(published_at, ?) ELSE NULL END,
       updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      values.title,
      values.body,
      values.imageKey === '' ? null : values.imageKey,
      JSON.stringify(values.tags),
      values.published ? 1 : 0,
      at,
      at,
      id,
    )
    .run()

  await linkAnimals(id, values.animalIds)

  // The old cover stays in no row: drop it from R2 too.
  const oldKey = current.image_r2_key
  const newKey = values.imageKey === '' ? null : values.imageKey

  if (oldKey && oldKey !== newKey) {
    try {
      await deletePhoto(oldKey)
    } catch (error) {
      logger.warn('news.cover_orphan', {
        key: oldKey,
        message: error instanceof Error ? error.message : 'unknown',
      })
    }
  }
}

// Hard delete: drafts and posts alike. Links cascade; the cover is dropped from R2 too.
export async function removePost(id: string) {
  const row = await env.DB.prepare('SELECT image_r2_key FROM news_post WHERE id = ?')
    .bind(id)
    .first()

  if (!row) {
    throw new NewsError('Esta noticia ya no existe.')
  }

  const key = z.object({ image_r2_key: z.string().nullable() }).parse(row).image_r2_key

  await env.DB.prepare('DELETE FROM news_post WHERE id = ?').bind(id).run()

  if (key) {
    try {
      await deletePhoto(key)
    } catch (error) {
      logger.warn('news.cover_orphan', {
        key,
        message: error instanceof Error ? error.message : 'unknown',
      })
    }
  }
}

const listSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    published_at: z.string().nullable(),
    created_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  }))

// Newest activity first: publication date for posts, creation for drafts.
export async function selectPosts(limit: number) {
  const { results } = await env.DB.prepare(
    `SELECT id, title, slug, published_at, created_at FROM news_post
     ORDER BY COALESCE(published_at, created_at) DESC
     LIMIT ?`,
  )
    .bind(limit)
    .all()

  return z.array(listSchema).parse(results)
}

const detailSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    body: z.string(),
    image_r2_key: z.string().nullable(),
    tags: tagsSchema,
    published_at: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    body: row.body,
    imageKey: row.image_r2_key ?? '',
    tags: row.tags,
    published: row.published_at !== null,
  }))

const linkedSchema = z
  .object({ id: z.string(), name: z.string().nullable() })
  .transform((row) => ({ id: row.id, name: row.name ?? 'Sin nombre' }))

export async function selectPostForEdit(id: string) {
  const row = await env.DB.prepare(
    'SELECT id, title, slug, body, image_r2_key, tags, published_at FROM news_post WHERE id = ?',
  )
    .bind(id)
    .first()

  if (!row) {
    return null
  }

  const { results } = await env.DB.prepare(
    `SELECT a.id, a.name FROM news_post_animal l JOIN animal a ON a.id = l.animal_id
     WHERE l.news_post_id = ? AND a.discarded_at IS NULL ORDER BY a.name`,
  )
    .bind(id)
    .all()

  return { post: detailSchema.parse(row), animals: z.array(linkedSchema).parse(results) }
}
