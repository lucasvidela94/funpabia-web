import { z } from 'zod'

// URL filters of the panel's people list. A second entry besides index.ts: the route's
// validateSearch stays in the router bundle, and this keeps the rest of the module out of it.

export const peopleSearchSchema = z.object({
  q: z.string().trim().max(60).optional().catch(undefined),
})
