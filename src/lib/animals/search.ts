import { z } from 'zod'
import { statusSchema } from '@/lib/catalog'

// URL filters of the panel's animal list. A second entry besides index.ts: the route's
// validateSearch stays in the router bundle, and this keeps the rest of the module out of it.

export const animalListSearchSchema = z.object({
  estado: statusSchema.optional().catch(undefined),
  q: z.string().trim().max(60).optional().catch(undefined),
  // Archived animals live in their own view: they leave the main list but can come back or go.
  archivados: z.boolean().optional().catch(undefined),
})
