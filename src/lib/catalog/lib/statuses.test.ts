import { describe, expect, it } from 'vitest'
import { statusSchema } from './schema'
import { PANEL_STATUSES } from './statuses'

describe('PANEL_STATUSES', () => {
  it('covers every status the database accepts', () => {
    expect([...PANEL_STATUSES].sort()).toEqual([...statusSchema.options].sort())
  })

  it('does not repeat a status', () => {
    expect(new Set(PANEL_STATUSES).size).toBe(PANEL_STATUSES.length)
  })
})
