import type { z } from 'zod'

// The API error shape (docs/spec/api-rest.md, section 4): status codes with short English codes
// and messages. Details only carry zod paths and codes: the messages are the panel's Spanish
// texts, so they never leave the server.

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

// Domain error for token management. It lives here, apart from tokens.ts, so client code can
// match on it without pulling `cloudflare:workers` into the browser bundle.
export class TokenError extends Error {}

export type ErrorDetails = { path: string; code: string }[]

export function apiError(status: number, code: string, message: string, details?: ErrorDetails) {
  const error = details === undefined ? { code, message } : { code, message, details }

  return Response.json({ error }, { status })
}

// One entry per zod issue: { "path": "startsAt", "code": "invalid_format" }.
export function zodDetails(error: z.ZodError) {
  return error.issues.map((issue) => ({ path: issue.path.join('.'), code: issue.code }))
}
