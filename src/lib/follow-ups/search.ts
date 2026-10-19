import { z } from 'zod'

// URL filters of the panel's follow-up list. A second entry besides index.ts: the route's
// validateSearch stays in the router bundle, and this keeps the rest of the module out of it.

export const followUpSearchSchema = z.object({
  vista: z.enum(['pendientes', 'hechos']).optional().catch(undefined),
})
