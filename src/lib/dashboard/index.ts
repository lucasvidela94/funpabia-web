import { createServerFn } from '@tanstack/react-start'
import { can, isAdminRole, userMiddleware } from '@/lib/auth/session'

// Spec 6.3: counts by status, urgent animals, new requests and overdue follow-ups. Each block
// only reaches the roles that can open it (spec 4 and the permission table).
export const getDashboard = createServerFn({ method: 'GET' })
  .middleware([userMiddleware])
  .handler(async ({ context: { user } }) => {
    const queries = await import('./lib/queries')
    const admin = isAdminRole(user.role)
    const showAnimals = can(user.role, 'animal:read')
    const moderateReports = can(user.role, 'lost-found:moderate')

    const [
      byStatus,
      urgent,
      unpublished,
      pendingReports,
      newApplications,
      overdueFollowUps,
      setup,
    ] = await Promise.all([
      showAnimals ? queries.selectStatusCounts() : [],
      showAnimals ? queries.countUrgent() : 0,
      showAnimals ? queries.countUnpublished() : 0,
      moderateReports ? queries.countPendingReports() : null,
      admin ? queries.countNewApplications() : null,
      admin ? queries.countOverdueFollowUps() : null,
      // The first steps are the committee's to take: money accounts, goals and people.
      admin ? queries.selectSetup() : null,
    ])

    return {
      byStatus,
      urgent,
      unpublished,
      pendingReports,
      newApplications,
      overdueFollowUps,
      setup,
    }
  })
