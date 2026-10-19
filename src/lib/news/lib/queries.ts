import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { photoUrl } from '@/lib/photos'

const tagsSchema = z.string().transform((text) => z.array(z.string()).parse(JSON.parse(text)))

const summarySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    excerpt: z.string(),
    image_r2_key: z.string().nullable(),
    tags: tagsSchema,
    published_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    image: row.image_r2_key ? photoUrl(row.image_r2_key) : null,
    tags: row.tags,
    publishedAt: row.published_at,
  }))

const postSchema = z
  .object({
    title: z.string(),
    body: z.string(),
    image_r2_key: z.string().nullable(),
    tags: tagsSchema,
    published_at: z.string(),
  })
  .transform((row) => ({
    title: row.title,
    paragraphs: row.body.split(/\n\s*\n/).filter((text) => text.trim() !== ''),
    image: row.image_r2_key ? photoUrl(row.image_r2_key) : null,
    tags: row.tags,
    publishedAt: row.published_at,
  }))

const PUBLISHED =
  "published_at IS NOT NULL AND published_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')"

export async function selectPublished(limit: number) {
  const { results } = await env.DB.prepare(
    `SELECT id, title, slug, substr(body, 1, 220) AS excerpt, image_r2_key, tags, published_at
     FROM news_post WHERE ${PUBLISHED} ORDER BY published_at DESC LIMIT ?`,
  )
    .bind(limit)
    .all()

  return z.array(summarySchema).parse(results)
}

export async function selectPost(slug: string) {
  const row = await env.DB.prepare(
    `SELECT title, body, image_r2_key, tags, published_at FROM news_post WHERE slug = ? AND ${PUBLISHED}`,
  )
    .bind(slug)
    .first()

  return row ? postSchema.parse(row) : null
}
