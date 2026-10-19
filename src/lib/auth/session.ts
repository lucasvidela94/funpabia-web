import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { ROLES, type Role } from './lib/roles'

// The session of the current request, or null. Discarded (soft-deleted) users never count as signed in.
export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const { auth } = await import('./server')
  const session = await auth.api.getSession({ headers: getRequestHeaders() })

  if (!session || session.user.discardedAt) {
    return null
  }

  return session
})

// Roles that see adopters' data and money (spec 4: the editor sees neither).
const ADMIN_ROLES = new Set(['admin', 'superadmin'])

export function isAdminRole(role: string) {
  return ADMIN_ROLES.has(role)
}

const ROLE_LABEL = {
  superadmin: 'Soporte técnico',
  admin: 'Comisión',
  editor: 'Editora',
  veterinarian: 'Veterinaria',
  municipality: 'Municipio',
} satisfies Record<Role, string>

function isRole(value: string): value is Role {
  return ROLES.some((role) => role === value)
}

// The role as the panel shows it, in Spanish.
export function roleLabel(role: string) {
  return isRole(role) ? ROLE_LABEL[role] : role
}

// For panel server functions, which can be called over HTTP without going through a route:
// the route's beforeLoad is not enough. Server only.
export async function requireUser(access: 'any' | 'admin' = 'any') {
  const session = await getSession()

  if (!session || (access === 'admin' && !isAdminRole(session.user.role))) {
    throw new Error('Forbidden')
  }

  return session.user
}

// The same checks as middleware, for panel server functions. Middleware runs before the function's
// own validator, so a caller without access gets Forbidden and never learns the input schema.
// The user lands in `context.user`.
export const userMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) =>
  next({ context: { user: await requireUser() } }),
)

export const adminMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) =>
  next({ context: { user: await requireUser('admin') } }),
)
