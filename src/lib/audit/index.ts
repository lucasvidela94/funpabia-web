import { env } from 'cloudflare:workers'

// Who changed what and when (spec section 7, "Auditoría"), on animals, applications, donations,
// expenses and raffles. Returns a statement so callers put it in the same batch as the change itself.
// Server only. Never put personal data in `changes`: names of fields and enum values are enough.

type AuditEntry = {
  userId: string
  entity: 'animal' | 'application' | 'donation' | 'expense' | 'raffle'
  entityId: string
  action: 'create' | 'update' | 'delete'
  changes: { [field: string]: string | number | boolean | null }
}

export function auditStatement(entry: AuditEntry) {
  return auditInsert(
    'INSERT INTO audit_log (id, user_id, entity, entity_id, action, changes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    entry,
  )
}

// For a conditional write (an UPDATE or DELETE guarded by a WHERE): the entry is only written when
// the statement right before it in the batch changed a row, so a write that lost a race leaves no
// trace. Put it immediately after that statement.
export function auditIfChangedStatement(entry: AuditEntry) {
  return auditInsert(
    `INSERT INTO audit_log (id, user_id, entity, entity_id, action, changes, created_at)
     SELECT ?, ?, ?, ?, ?, ?, ? WHERE changes() > 0`,
    entry,
  )
}

function auditInsert(sql: string, entry: AuditEntry) {
  return env.DB.prepare(sql).bind(
    crypto.randomUUID(),
    entry.userId,
    entry.entity,
    entry.entityId,
    entry.action,
    JSON.stringify(entry.changes),
    new Date().toISOString(),
  )
}
