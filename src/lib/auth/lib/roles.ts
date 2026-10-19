export const ROLES = ['superadmin', 'admin', 'editor', 'veterinarian', 'municipality'] as const

export type Role = (typeof ROLES)[number]
