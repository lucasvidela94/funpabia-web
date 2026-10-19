import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { adminMiddleware } from '@/lib/auth/session'
import { guarded } from '@/lib/guarded'
import { logger } from '@/lib/logger'
import { UserError } from './lib/errors'

// Panel users and their roles (spec 4). Committee only. The MVP has two roles to hand out:
// admin ("Comisión") and editor; the rest of the spec's roles come in later phases.

export const ASSIGNABLE_ROLES = ['admin', 'editor'] as const

// Better Auth's own minimum (src/lib/auth/server.ts).
export const MIN_PASSWORD_LENGTH = 12

export const newUserSchema = z.object({
  name: z.string().trim().min(2, 'Escribí el nombre.').max(60),
  email: z.email('Revisá el email.').trim().max(120),
  role: z.enum(ASSIGNABLE_ROLES, { error: 'Elegí un rol.' }),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    .max(128),
})

export type PanelUser = Awaited<ReturnType<typeof listUsers>>['users'][number]

// Ids are random UUIDs from the app; the dev seed uses readable ones ("seed-lobito").
const idSchema = z.string().min(1).max(64)

export const listUsers = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async ({ context: { user: me } }) => {
    const { selectUsers } = await import('./lib/queries')

    return { users: await selectUsers(), me: me.id }
  })

export const createUser = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(newUserSchema)
  .handler(async ({ data }) => {
    await guarded({ error: UserError, event: 'user.write_failed' }, async () =>
      (await import('./lib/queries')).insertUser(data),
    )
    logger.info('user.created', { role: data.role })
  })

export const setUserRole = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ id: idSchema, role: z.enum(ASSIGNABLE_ROLES) }))
  .handler(async ({ data, context: { user: me } }) =>
    guarded({ error: UserError, event: 'user.write_failed' }, async () =>
      (await import('./lib/queries')).updateRole(data.id, data.role, me),
    ),
  )

export const setUserActive = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ id: idSchema, active: z.boolean() }))
  .handler(async ({ data, context: { user: me } }) =>
    guarded({ error: UserError, event: 'user.write_failed' }, async () =>
      (await import('./lib/queries')).updateActive(data.id, data.active, me),
    ),
  )
