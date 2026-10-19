import { createStart } from '@tanstack/react-start'
import { responseHeaders } from '@/lib/response-headers'

export const startInstance = createStart(() => ({
  requestMiddleware: [responseHeaders],
}))
