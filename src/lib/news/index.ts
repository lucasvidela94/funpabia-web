import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { userMiddleware } from '@/lib/auth/session'
import { guarded } from '@/lib/guarded'
import { NewsError } from './lib/errors'
import { newsInputSchema } from './lib/schema'

export { NEWS_TAGS, NEWS_TAG_LABEL, newsInputSchema, type NewsInput } from './lib/schema'

export const getNews = createServerFn({ method: 'GET' }).handler(async () => {
  const { selectPublished } = await import('./lib/queries')

  return selectPublished(50)
})

export const getNewsPost = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1).max(160) }))
  .handler(async ({ data }) => {
    const { selectPost } = await import('./lib/queries')
    const post = await selectPost(data.slug)

    if (!post) {
      throw notFound()
    }

    return post
  })

// Panel (spec 6.7). Any panel role can manage the news; drafts are posts with no publish date.

export type NewsListPost = Awaited<ReturnType<typeof listNewsPosts>>[number]

export type EditablePost = Awaited<ReturnType<typeof getNewsForEdit>>

// Ids are random UUIDs from the app; the dev seed uses readable ones ("seed-lobito").
const idSchema = z.object({ id: z.string().min(1).max(64) })

export const listNewsPosts = createServerFn({ method: 'GET' })
  .middleware([userMiddleware])
  .handler(async () => {
    const { selectPosts } = await import('./lib/panel')

    return selectPosts(200)
  })

export const getNewsForEdit = createServerFn({ method: 'GET' })
  .middleware([userMiddleware])
  .validator(idSchema)
  .handler(async ({ data }) => {
    const { selectPostForEdit } = await import('./lib/panel')
    const found = await selectPostForEdit(data.id)

    if (!found) {
      throw notFound()
    }

    return found
  })

export const createNewsPost = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(newsInputSchema)
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: NewsError, event: 'news.write_failed' }, async () => ({
      id: await (await import('./lib/panel')).insertPost(data, user.id),
    })),
  )

export const editNewsPost = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(z.object({ id: idSchema.shape.id, values: newsInputSchema }))
  .handler(async ({ data }) =>
    guarded({ error: NewsError, event: 'news.write_failed' }, async () =>
      (await import('./lib/panel')).updatePost(data.id, data.values),
    ),
  )

export const removeNewsPost = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(idSchema)
  .handler(async ({ data }) =>
    guarded({ error: NewsError, event: 'news.write_failed' }, async () =>
      (await import('./lib/panel')).removePost(data.id),
    ),
  )
