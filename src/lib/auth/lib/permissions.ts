import { ROLES, type Role } from './roles'

// One table for the panel: every server function and every menu entry asks this module, so a rule
// changes in a single place. Spec 4: the editor carries content, the veterinarian reads the
// animals and shares the agenda, the municipality only loads the agenda, the committee sees
// everything, and the technical superadmin keeps the maintenance.
export type Action =
  | 'dashboard:read'
  | 'animal:read'
  | 'animal:create'
  | 'animal:update'
  | 'animal:archive'
  | 'animal:delete'
  | 'agenda:read'
  | 'agenda:write'
  | 'news:read'
  | 'news:write'
  | 'photo:upload'
  | 'lost-found:moderate'
  | 'lost-found:delete'
  | 'users:manage'
  | 'users:manage-admins'
  | 'api:manage'
  | 'settings:manage'

const ALL = ROLES

const PERMISSIONS: Record<Action, readonly Role[]> = {
  'dashboard:read': ALL,
  'animal:read': ['editor', 'veterinarian', 'admin', 'superadmin'],
  'animal:create': ['editor', 'admin', 'superadmin'],
  'animal:update': ['editor', 'admin', 'superadmin'],
  'animal:archive': ['admin', 'superadmin'],
  'animal:delete': ['admin', 'superadmin'],
  'agenda:read': ALL,
  'agenda:write': ALL,
  'news:read': ['editor', 'admin', 'superadmin'],
  'news:write': ['editor', 'admin', 'superadmin'],
  'photo:upload': ['editor', 'admin', 'superadmin'],
  'lost-found:moderate': ['admin', 'superadmin'],
  'lost-found:delete': ['admin', 'superadmin'],
  'users:manage': ['admin', 'superadmin'],
  'users:manage-admins': ['superadmin'],
  'api:manage': ['admin', 'superadmin'],
  'settings:manage': ['admin', 'superadmin'],
}

export function can(role: string, action: Action) {
  const allowed: readonly string[] = PERMISSIONS[action]

  return allowed.includes(role)
}

// Roles the panel can hand out. The technical superadmin is never created from the panel.
export const ASSIGNABLE_ROLES = ['editor', 'veterinarian', 'municipality', 'admin'] as const

// An admin hands out editor, veterinarian and municipality; only a superadmin names another admin.
export function canAssignRole(actorRole: string, role: string) {
  const assignable: readonly string[] = ASSIGNABLE_ROLES

  if (!assignable.includes(role)) {
    return false
  }

  if (role === 'admin') {
    return can(actorRole, 'users:manage-admins')
  }

  return can(actorRole, 'users:manage')
}

// The row the actor may edit. Nobody touches a superadmin from the panel; an admin only reaches
// the rows below their own role.
export function canManageUser(actorRole: string, targetRole: string) {
  if (targetRole === 'superadmin') {
    return false
  }

  if (targetRole === 'admin') {
    return can(actorRole, 'users:manage-admins')
  }

  return can(actorRole, 'users:manage')
}

// Roles that may hold an API token (docs/spec/api-rest.md, section 5).
export const TOKEN_ROLES = ['municipality', 'admin', 'superadmin'] as const

export function mayHoldToken(role: string) {
  const eligible: readonly string[] = TOKEN_ROLES

  return eligible.includes(role)
}
