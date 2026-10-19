import { selectEvent, selectUpcoming } from './lib/queries'
import { discardEventOwned, insertEvent, updateEventOwned } from './lib/panel'
import type { AgendaInput } from './lib/schema'

export { AgendaError } from './lib/errors'

export { agendaInputSchema, type AgendaInput } from './lib/schema'

// Server-only entry point for the REST route handlers (docs/spec/api-rest.md). It is only ever
// loaded with a dynamic import from inside `server.handlers` (like `@/lib/photos/server`), so
// the D1 code here never reaches the browser bundle. Panel and site code goes through index.ts.

// Reads: upcoming events for the list, one event by id (null when missing or discarded).
export async function apiListEvents(limit: number) {
  return selectUpcoming(limit)
}

export async function apiGetEvent(id: string) {
  return selectEvent(id)
}

// Writes: insert stamps the token's owner; edits and discards only touch that owner's events.
export async function apiInsertEvent(values: AgendaInput, userId: string) {
  return insertEvent(values, userId)
}

export async function apiUpdateEvent(id: string, values: AgendaInput, userId: string) {
  return updateEventOwned(id, values, userId)
}

export async function apiDiscardEvent(id: string, userId: string) {
  return discardEventOwned(id, userId)
}
