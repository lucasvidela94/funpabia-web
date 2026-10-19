import { createServerFn } from '@tanstack/react-start'
import { isAdminRole, userMiddleware } from '@/lib/auth/session'

// Spec 6.3: counts by status, urgent animals, new requests and overdue follow-ups. Request and
// follow-up counts only reach admins (spec 4).
export const getDashboard = createServerFn({ method: 'GET' })
  .middleware([userMiddleware])
  .handler(async ({ context: { user } }) => {
    const queries = await import('./lib/queries')
    const admin = isAdminRole(user.role)

    const [
      byStatus,
      urgent,
      unpublished,
      pendingReports,
      newApplications,
      overdueFollowUps,
      setup,
    ] = await Promise.all([
      queries.selectStatusCounts(),
      queries.countUrgent(),
      queries.countUnpublished(),
      queries.countPendingReports(),
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
