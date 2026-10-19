import { z } from 'zod'
import { STAGES } from './lib/labels'

// URL filters of the panel's request list. A second entry besides index.ts: the route's
// validateSearch stays in the router bundle, and this keeps the rest of the module out of it.

export const applicationListSearchSchema = z.object({
  etapa: z.enum(STAGES).optional().catch(undefined),
  tipo: z.enum(['adoption', 'foster']).optional().catch(undefined),
  cerradas: z.boolean().optional().catch(undefined),
})

export type ApplicationListSearch = z.infer<typeof applicationListSearchSchema>
