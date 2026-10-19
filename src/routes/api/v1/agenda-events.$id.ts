import { createFileRoute } from '@tanstack/react-router'

// Public REST API v1, one event (docs/spec/api-rest.md and docs/api.md). PATCH and DELETE only
// touch events the token's own user created; anything else is a 404 so ownership never leaks.

const SCOPE = 'agenda-events:write'

export const Route = createFileRoute('/api/v1/agenda-events/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { withApi } = await import('@/lib/api/server')

        return withApi(
          request,
          { auth: 'public', cors: true, limit: { max: 30, windowSeconds: 60 } },
          async () => {
            const { ApiError } = await import('@/lib/api/server')
            const { apiGetEvent } = await import('@/lib/agenda/server')
            const event = await apiGetEvent(params.id)

            if (!event) {
              throw new ApiError(404, 'not_found', 'There is no such event.')
            }

            return Response.json({ data: event })
          },
        )
      },
      PATCH: async ({ request, params }) => {
        const { ApiError, readJsonBody, withApi } = await import('@/lib/api/server')

        return withApi(
          request,
          { auth: 'token', scope: SCOPE, limit: { max: 20, windowSeconds: 60 } },
          async ({ token }) => {
            const { AgendaError, agendaInputSchema, apiGetEvent, apiUpdateEvent } =
              await import('@/lib/agenda/server')

            const input = await readJsonBody(request, agendaInputSchema)

            try {
              await apiUpdateEvent(params.id, input, token.userId)
            } catch (error) {
              if (error instanceof AgendaError) {
                throw new ApiError(404, 'not_found', 'There is no such event.')
              }

              throw error
            }

            const updated = await apiGetEvent(params.id)

            if (!updated) {
              throw new ApiError(404, 'not_found', 'There is no such event.')
            }

            return Response.json({ data: updated })
          },
        )
      },
      DELETE: async ({ request, params }) => {
        const { ApiError, withApi } = await import('@/lib/api/server')

        return withApi(
          request,
          { auth: 'token', scope: SCOPE, limit: { max: 20, windowSeconds: 60 } },
          async ({ token }) => {
            const { AgendaError, apiDiscardEvent } = await import('@/lib/agenda/server')

            try {
              await apiDiscardEvent(params.id, token.userId)
            } catch (error) {
              if (error instanceof AgendaError) {
                throw new ApiError(404, 'not_found', 'There is no such event.')
              }

              throw error
            }

            return Response.json({ data: { id: params.id } })
          },
        )
      },
    },
  },
})
