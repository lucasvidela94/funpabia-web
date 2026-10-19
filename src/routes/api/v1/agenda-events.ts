import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// Public REST API v1, event collection (docs/spec/api-rest.md and docs/api.md). Handlers call
// the agenda module through withApi; no D1 code lives here.

const SCOPE = 'agenda-events:write'

const listSearchSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20).catch(20),
})

export const Route = createFileRoute('/api/v1/agenda-events')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { withApi } = await import('@/lib/api/server')

        return withApi(
          request,
          { auth: 'public', cors: true, limit: { max: 30, windowSeconds: 60 } },
          async () => {
            const { apiListEvents } = await import('@/lib/agenda/server')

            const search = listSearchSchema.parse(
              Object.fromEntries(new URL(request.url).searchParams),
            )

            return Response.json({ data: await apiListEvents(search.limit) })
          },
        )
      },
      POST: async ({ request }) => {
        const { ApiError, readJsonBody, withApi } = await import('@/lib/api/server')

        return withApi(
          request,
          { auth: 'token', scope: SCOPE, limit: { max: 20, windowSeconds: 60 } },
          async ({ token }) => {
            const { agendaInputSchema, apiGetEvent, apiInsertEvent } =
              await import('@/lib/agenda/server')

            const input = await readJsonBody(request, agendaInputSchema)
            const id = await apiInsertEvent(input, token.userId)
            const created = await apiGetEvent(id)

            if (!created) {
              throw new ApiError(500, 'internal_error', 'Something went wrong.')
            }

            return Response.json({ data: created }, { status: 201 })
          },
        )
      },
    },
  },
})
