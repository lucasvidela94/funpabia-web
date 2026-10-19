import { createFileRoute } from '@tanstack/react-router'

// Photo keys are random ids, so a stored object never changes: cache it for a year.
// The handler loads the R2 reader lazily so it stays out of the client bundle.
export const Route = createFileRoute('/api/photos/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { readPhoto } = await import('@/lib/photos/server')
        const object = await readPhoto(params._splat ?? '')

        if (!object) {
          return new Response('Not found', { status: 404 })
        }

        const headers = new Headers()
        object.writeHttpMetadata(headers)
        headers.set('etag', object.httpEtag)
        headers.set('cache-control', 'public, max-age=31536000, immutable')

        return new Response(object.body, { headers })
      },
    },
  },
})
