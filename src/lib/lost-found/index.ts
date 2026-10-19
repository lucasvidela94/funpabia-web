import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { PRIVACY_POLICY_VERSION } from '@/lib/applications'
import { userMiddleware } from '@/lib/auth/session'
import { guarded } from '@/lib/guarded'
import { logger } from '@/lib/logger'
import { ReportError } from './lib/errors'
import { reportInputSchema, reportSearchSchema, statusSchema } from './lib/schema'

// Lost and found reports (spec 6.6, 8.2). A visitor reports without an account and keeps an edit
// link; the committee approves each report before it is public. The location is a zone, never a
// street or a pin.

export {
  KIND_LABEL,
  REPORT_SEX_LABEL,
  REPORT_SIZE_LABEL,
  REPORT_SPECIES_LABEL,
  REPORT_STATUS_LABEL,
} from './lib/labels'

export {
  MAX_REPORT_PHOTOS,
  reportInputSchema,
  reportSearchSchema,
  type ReportKind,
  type ReportSearch,
  type ReportStatus,
} from './lib/schema'

export type ReportSummary = Awaited<ReturnType<typeof getReports>>[number]

export type ReportDetail = Awaited<ReturnType<typeof getReport>>

export type PanelReport = Awaited<ReturnType<typeof listPanelReports>>[number]

export type SubmitOutcome = { status: 'sent'; id: string; token: string } | { status: 'limited' }

const REPORTS_PER_HOUR = 3

const REUNITES_PER_HOUR = 20

const PAGE = 60

export const getZones = createServerFn({ method: 'GET' }).handler(async () => {
  const { selectZones } = await import('./lib/queries')

  return selectZones()
})

export const getReports = createServerFn({ method: 'GET' })
  .validator(reportSearchSchema)
  .handler(async ({ data }) => {
    const { selectReports } = await import('./lib/queries')

    return selectReports(data, PAGE)
  })

// The token of the owner's edit link, when the page was opened with one. Anything of a sensible
// length is accepted here and judged by the server: a wrong one is "invalid", not an error.
const tokenSchema = z.string().max(100)

// `owner` says what the link in the address bar is worth: 'none' (opened without one), 'valid'
// (it can close this report) or 'invalid' (wrong, or the report is already closed).
export const getReport = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string().min(1).max(64), token: tokenSchema.optional() }))
  .handler(async ({ data }) => {
    const { selectReport, tokenOpensReport } = await import('./lib/queries')
    const { hashEditToken } = await import('./lib/token')
    const { getRequestUrl } = await import('@tanstack/react-start/server')
    const tokenHash = data.token === undefined ? null : await hashEditToken(data.token)
    const report = await selectReport(data.id, tokenHash)

    if (!report) {
      throw notFound()
    }

    const { origin } = getRequestUrl()

    const owner =
      tokenHash === null
        ? 'none'
        : (await tokenOpensReport(data.id, tokenHash))
          ? 'valid'
          : 'invalid'

    return { ...report, owner, url: `${origin}/perdidos/${data.id}`, origin }
  })

// The token comes back once, to build the owner's edit link; only its hash is stored.
export const submitReport = createServerFn({ method: 'POST' })
  .validator(reportInputSchema)
  .handler(async ({ data }): Promise<SubmitOutcome> => {
    if (data.website !== '') {
      logger.warn('report.honeypot')

      // A bot gets the same answer as a person, and nothing is stored.
      return { status: 'sent', id: crypto.randomUUID(), token: crypto.randomUUID() }
    }

    const { allowRequest } = await import('@/lib/rate-limit')

    if (!(await allowRequest('report', REPORTS_PER_HOUR, 60 * 60))) {
      logger.warn('report.rate_limited')

      return { status: 'limited' }
    }

    const { insertReport } = await import('./lib/queries')
    const { hashEditToken, newEditToken } = await import('./lib/token')
    const token = newEditToken()
    const id = await insertReport(data, await hashEditToken(token), PRIVACY_POLICY_VERSION)

    if (!id) {
      throw new ReportError('Esa zona no existe. Elegí otra.')
    }

    logger.info('report.created', { kind: data.kind, species: data.species })

    return { status: 'sent', id, token }
  })

// The owner closes the report with the secret in their link.
export const markReunited = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1).max(64), token: tokenSchema }))
  .handler(async ({ data }): Promise<{ outcome: 'closed' | 'invalid' | 'limited' }> => {
    const { allowRequest } = await import('@/lib/rate-limit')

    if (!(await allowRequest('report-edit', REUNITES_PER_HOUR, 60 * 60))) {
      return { outcome: 'limited' }
    }

    const { reuniteWithToken } = await import('./lib/queries')
    const { hashEditToken } = await import('./lib/token')

    if (!(await reuniteWithToken(data.id, await hashEditToken(data.token)))) {
      return { outcome: 'invalid' }
    }

    logger.info('report.reunited', { by: 'owner' })

    return { outcome: 'closed' }
  })

// Panel: any panel role moderates (docs/routes.md).

export const listPanelReports = createServerFn({ method: 'GET' })
  .middleware([userMiddleware])
  .handler(async () => {
    const { selectPanelReports } = await import('./lib/panel')

    return selectPanelReports()
  })

export const deleteReport = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(z.object({ id: z.string().min(1).max(64) }))
  .handler(async ({ data }) =>
    guarded({ error: ReportError, event: 'report.write_failed' }, async () => {
      await (await import('./lib/panel')).deleteReport(data.id)
      logger.info('report.deleted')
    }),
  )

export const moderateReport = createServerFn({ method: 'POST' })
  .middleware([userMiddleware])
  .validator(z.object({ id: z.string().min(1).max(64), status: statusSchema }))
  .handler(async ({ data }) =>
    guarded({ error: ReportError, event: 'report.write_failed' }, async () => {
      await (await import('./lib/panel')).changeStatus(data.id, data.status)
      logger.info('report.moderated', { status: data.status })
    }),
  )
