import { createFileRoute } from '@tanstack/react-router'

// Handlers load the server config lazily so it stays out of the client bundle.
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => (await import('@/lib/auth/server')).auth.handler(request),
      POST: async ({ request }) => (await import('@/lib/auth/server')).auth.handler(request),
    },
  },
})
