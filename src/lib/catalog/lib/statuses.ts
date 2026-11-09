import type { AnimalStatus } from './schema'

// The same groups the dashboard and the animal list show (spec 6.3): the pipeline an animal moves
// through, then the statuses that take it out of it. Kept here so both screens read one list.
export const PIPELINE_STATUSES = [
  'intake',
  'under_treatment',
  'available',
  'reserved',
  'adopted',
] as const satisfies readonly AnimalStatus[]

export const SIDE_STATUSES = [
  'fostered',
  'not_adoptable',
  'returned',
  'deceased',
] as const satisfies readonly AnimalStatus[]

export const PANEL_STATUSES: readonly AnimalStatus[] = [...PIPELINE_STATUSES, ...SIDE_STATUSES]
