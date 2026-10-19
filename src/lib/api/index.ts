import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { adminMiddleware } from '@/lib/auth/session'
import { guarded } from '@/lib/guarded'
import { logger } from '@/lib/logger'
import { TokenError } from './lib/errors'

// Token management for the panel (admin only). The value is returned only by createApiToken,
// right after creation; listings never include it. The REST handlers live in server.ts.

// What the panel lists and edits. The client bundle only sees these server functions, the
// schema below and the summary type: D1 code stays behind dynamic imports in the handlers.
export type ApiTokenSummary = Awaited<ReturnType<typeof listApiTokens>>[number]

export const newTokenSchema = z.object({
  userId: z.string().min(1).max(64),
  name: z.string().trim().min(2, 'Escribí un nombre.').max(60),
})

// Ids are random UUIDs from the app; the dev seed uses readable ones ("seed-lobito").
const idSchema = z.object({ id: z.string().min(1).max(64) })

export const listApiTokens = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    const { selectTokens } = await import('./lib/tokens')

    return selectTokens()
  })

export const createApiToken = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(newTokenSchema)
  .handler(async ({ data }) => {
    const created = await guarded({ error: TokenError, event: 'api.token_failed' }, async () =>
      (await import('./lib/tokens')).insertToken(data),
    )

    logger.info('api.token_created', { tokenId: created.id })

    return created
  })

export const revokeApiToken = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(idSchema)
  .handler(async ({ data }) => {
    await guarded({ error: TokenError, event: 'api.token_failed' }, async () =>
      (await import('./lib/tokens')).revokeToken(data.id),
    )
    logger.info('api.token_revoked', { tokenId: data.id })
  })
