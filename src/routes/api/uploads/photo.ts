import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// Receives one photo from the panel, already compressed on the phone in both sizes (spec 6.3), and
// stores it in R2. The photo is linked to an animal afterwards, by the server function that saves
// the form. Handlers load server code lazily so it stays out of the client bundle.

const folderSchema = z.enum(['animals', 'news']).catch('animals')

export const Route = createFileRoute('/api/uploads/photo')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { requireUser } = await import('@/lib/auth/session')
        const { receiveUpload } = await import('@/lib/photos/server')

        // CSRF: only the panel's own pages may post here.
        const origin = request.headers.get('origin')

        if (origin !== new URL(request.url).origin) {
          return Response.json({ error: 'Origen no permitido.' }, { status: 403 })
        }

        try {
          await requireUser()
        } catch {
          return Response.json({ error: 'Iniciá sesión de nuevo.' }, { status: 401 })
        }

        const form = await request.formData()
        const result = await receiveUpload(form, folderSchema.parse(form.get('folder')))

        return Response.json(result.body, { status: result.status })
      },
    },
  },
})
