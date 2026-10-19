import { createServerFn } from '@tanstack/react-start'
import { isAdminRole, userMiddleware } from '@/lib/auth/session'

// Spec 6.3: counts by status, urgent animals, new requests and overdue follow-ups. Request and
// follow-up counts only reach admins (spec 4).
export const getDashboard = createServerFn({ method: 'GET' })
  .middleware([userMiddleware])
  .handler(async ({ context: { user } }) => {
    const queries = await import('./lib/queries')
    const admin = isAdminRole(user.role)

    const [byStatus, urgent, unpublished, pendingReports, newApplications, overdueFollowUps] =
      await Promise.all([
        queries.selectStatusCounts(),
        queries.countUrgent(),
        queries.countUnpublished(),
        queries.countPendingReports(),
        admin ? queries.countNewApplications() : null,
        admin ? queries.countOverdueFollowUps() : null,
      ])

    return {
      byStatus,
      urgent,
      unpublished,
      pendingReports,
      newApplications,
      overdueFollowUps,
    }
  })
