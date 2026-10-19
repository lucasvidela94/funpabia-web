import { env } from 'cloudflare:workers'
import { hashPassword } from 'better-auth/crypto'
import { z } from 'zod'
import { UserError } from './errors'

// Panel users (spec 4). The same rows Better Auth reads to sign in: `app_user` plus a `credential`
// account with the password hash, exactly as tools/create-admin.ts writes them.

const rowSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
    last_seen: z.string().nullable(),
    discarded_at: z.string().nullable(),
    created_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    lastSeen: row.last_seen,
    active: row.discarded_at === null,
    createdAt: row.created_at,
  }))

// "Last seen" is the newest session update: Better Auth refreshes it once a day (session.updateAge).
export async function selectUsers() {
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.discarded_at, u.created_at,
       (SELECT MAX(s.updated_at) FROM session s WHERE s.user_id = u.id) AS last_seen
     FROM app_user u
     ORDER BY u.discarded_at IS NOT NULL, u.name`,
  ).all()

  return z.array(rowSchema).parse(results)
}

const targetSchema = z.object({ role: z.string(), discarded_at: z.string().nullable() })

async function target(id: string) {
  const row = await env.DB.prepare('SELECT role, discarded_at FROM app_user WHERE id = ?')
    .bind(id)
    .first()

  if (!row) {
    throw new UserError('Esta usuaria ya no existe.')
  }

  return targetSchema.parse(row)
}

// The technical superadmin (spec 4) can only be changed by another superadmin.
function guardSuperadmin(targetRole: string, actorRole: string) {
  if (targetRole === 'superadmin' && actorRole !== 'superadmin') {
    throw new UserError(
      'La cuenta de soporte técnico solo la puede cambiar otra cuenta de soporte.',
    )
  }
}

export async function insertUser(input: {
  name: string
  email: string
  role: string
  password: string
}) {
  const email = input.email.toLowerCase()
  const taken = await env.DB.prepare('SELECT 1 FROM app_user WHERE email = ?').bind(email).first()

  if (taken) {
    throw new UserError('Ya hay una cuenta con ese email.')
  }

  const id = crypto.randomUUID()
  const at = new Date().toISOString()
  const hash = await hashPassword(input.password)

  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO app_user (id, email, name, role, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)',
    ).bind(id, email, input.name, input.role, at, at),
    env.DB.prepare(
      "INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at) VALUES (?, ?, ?, 'credential', ?, ?, ?)",
    ).bind(crypto.randomUUID(), id, id, hash, at, at),
  ])
}

export async function updateRole(id: string, role: string, actor: { id: string; role: string }) {
  if (id === actor.id) {
    throw new UserError('No podés cambiar tu propio rol: pedíselo a otra persona de la comisión.')
  }

  const current = await target(id)
  guardSuperadmin(current.role, actor.role)

  await env.DB.prepare('UPDATE app_user SET role = ?, updated_at = ? WHERE id = ?')
    .bind(role, new Date().toISOString(), id)
    .run()
}

// Deactivating keeps the account and its history (who changed what) and closes its sessions at
// once; the session helper already treats discarded users as signed out.
export async function updateActive(
  id: string,
  active: boolean,
  actor: { id: string; role: string },
) {
  if (id === actor.id) {
    throw new UserError('No podés darte de baja a vos misma.')
  }

  const current = await target(id)
  guardSuperadmin(current.role, actor.role)
  const at = new Date().toISOString()

  await env.DB.batch([
    env.DB.prepare('UPDATE app_user SET discarded_at = ?, updated_at = ? WHERE id = ?').bind(
      active ? null : at,
      at,
      id,
    ),
    ...(active ? [] : [env.DB.prepare('DELETE FROM session WHERE user_id = ?').bind(id)]),
  ])
}
