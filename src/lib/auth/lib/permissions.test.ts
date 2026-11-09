import { describe, expect, it } from 'vitest'
import { ASSIGNABLE_ROLES, can, canAssignRole, canManageUser, mayHoldToken } from './permissions'
import { ROLES } from './roles'

describe('can', () => {
  it('only lets the committee archive and delete animals', () => {
    for (const role of ['editor', 'veterinarian', 'municipality']) {
      expect(can(role, 'animal:archive')).toBe(false)
      expect(can(role, 'animal:delete')).toBe(false)
    }

    expect(can('admin', 'animal:archive')).toBe(true)
    expect(can('superadmin', 'animal:delete')).toBe(true)
  })

  it('lets the editor load and edit animals, but not the veterinarian or the municipality', () => {
    expect(can('editor', 'animal:create')).toBe(true)
    expect(can('editor', 'animal:update')).toBe(true)
    expect(can('veterinarian', 'animal:read')).toBe(true)
    expect(can('veterinarian', 'animal:create')).toBe(false)
    expect(can('municipality', 'animal:read')).toBe(false)
  })

  it('leaves lost and found moderation to the committee', () => {
    for (const role of ROLES) {
      expect(can(role, 'lost-found:moderate')).toBe(role === 'admin' || role === 'superadmin')
    }
  })

  it('lets the municipality work only on the agenda', () => {
    expect(can('municipality', 'agenda:read')).toBe(true)
    expect(can('municipality', 'agenda:write')).toBe(true)
    expect(can('municipality', 'news:read')).toBe(false)
    expect(can('municipality', 'photo:upload')).toBe(false)
    expect(can('municipality', 'lost-found:moderate')).toBe(false)
    expect(can('municipality', 'users:manage')).toBe(false)
  })
})

describe('canAssignRole', () => {
  it('lets an admin hand out every role except admin', () => {
    expect(canAssignRole('admin', 'editor')).toBe(true)
    expect(canAssignRole('admin', 'veterinarian')).toBe(true)
    expect(canAssignRole('admin', 'municipality')).toBe(true)
    expect(canAssignRole('admin', 'admin')).toBe(false)
    expect(canAssignRole('superadmin', 'admin')).toBe(true)
    expect(canAssignRole('editor', 'admin')).toBe(false)
  })

  it('an admin cannot turn a veterinarian into another admin', () => {
    expect(canManageUser('admin', 'veterinarian')).toBe(true)
    expect(canAssignRole('admin', 'admin')).toBe(false)
  })

  it('never hands out the technical superadmin from the panel', () => {
    for (const actor of ROLES) {
      expect(canAssignRole(actor, 'superadmin')).toBe(false)
    }
  })
})

describe('canManageUser', () => {
  it('keeps an admin away from another admin and from the superadmin', () => {
    expect(canManageUser('admin', 'admin')).toBe(false)
    expect(canManageUser('admin', 'superadmin')).toBe(false)
    expect(canManageUser('admin', 'editor')).toBe(true)
    expect(canManageUser('admin', 'veterinarian')).toBe(true)
    expect(canManageUser('admin', 'municipality')).toBe(true)
  })

  it('lets the superadmin manage admins but never a superadmin row', () => {
    expect(canManageUser('superadmin', 'admin')).toBe(true)
    expect(canManageUser('superadmin', 'superadmin')).toBe(false)
  })
})

describe('mayHoldToken', () => {
  it('uses one list for creating and validating tokens', () => {
    expect(mayHoldToken('municipality')).toBe(true)
    expect(mayHoldToken('admin')).toBe(true)
    expect(mayHoldToken('superadmin')).toBe(true)
    expect(mayHoldToken('editor')).toBe(false)
  })
})

describe('ASSIGNABLE_ROLES', () => {
  it('does not include the technical superadmin', () => {
    expect(ASSIGNABLE_ROLES).not.toContain('superadmin')
  })
})
