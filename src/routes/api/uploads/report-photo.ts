import { createFileRoute } from '@tanstack/react-router'

// Photos of a lost or found report (spec 6.6), from visitors with no account. Same checks as the
// panel's endpoint, but open: the protection is the origin check and a limit per connection. A
// photo uploaded and never reported stays in R2 under reports/; the limit keeps those few.

const PHOTOS_PER_HOUR = 12

export const Route = createFileRoute('/api/uploads/report-photo')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { receiveUpload } = await import('@/lib/photos/server')
        const { allowRequest } = await import('@/lib/rate-limit')

        // CSRF: only the site's own pages may post here.
        if (request.headers.get('origin') !== new URL(request.url).origin) {
          return Response.json({ error: 'Origen no permitido.' }, { status: 403 })
        }

        if (!(await allowRequest('report-photo', PHOTOS_PER_HOUR, 60 * 60))) {
          return Response.json(
            { error: 'Subiste muchas fotos seguidas. Probá de nuevo en un rato.' },
            { status: 429 },
          )
        }

        const result = await receiveUpload(await request.formData(), 'reports')

        return Response.json(result.body, { status: result.status })
      },
    },
  },
})
