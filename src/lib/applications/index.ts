import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { adminMiddleware } from '@/lib/auth/session'
import { guarded } from '@/lib/guarded'
import { logger } from '@/lib/logger'
import { ApplicationError } from './lib/errors'
import { STAGES } from './lib/labels'
import { evaluatePrescreen, type PrescreenResult } from './lib/prescreen'
import { submissionSchema } from './lib/schema'
import { applicationListSearchSchema } from './search'

export { COVERED_CITIES, evaluatePrescreen, type PrescreenResult } from './lib/prescreen'

export {
  OPEN_STAGES,
  PRESCREEN_LABEL,
  STAGES,
  STAGE_LABEL,
  TYPE_LABEL,
  type Stage,
} from './lib/labels'

export {
  contactSchema,
  motivationSchema,
  prescreenSchema,
  type ApplicationType,
} from './lib/schema'

// Version of the privacy policy the visitor accepts (spec 9: consent is stored with its version).
export const PRIVACY_POLICY_VERSION = 'borrador-2026-10-b'

const SUBMISSIONS_PER_HOUR = 5

// Spec 6.2: the request is stored as `new`. An ineligible pre-screen is never sent: the form stops
// at step 1 and suggests other ways to help, so the server only re-checks it.
export const submitApplication = createServerFn({ method: 'POST' })
  .validator(submissionSchema)
  .handler(async ({ data }): Promise<PrescreenResult & { limited: boolean }> => {
    const prescreen = evaluatePrescreen(data.prescreen, data.type)

    if (data.website !== '') {
      logger.warn('application.honeypot', { type: data.type })

      return { ...prescreen, limited: false }
    }

    if (prescreen.result === 'ineligible') {
      return { ...prescreen, limited: false }
    }

    // Spec 6.2: a limit per connection instead of a captcha. A family sending a few requests for
    // different animals fits; a script does not.
    const { allowRequest } = await import('@/lib/rate-limit')

    if (!(await allowRequest('application', SUBMISSIONS_PER_HOUR, 60 * 60))) {
      logger.warn('application.rate_limited', { type: data.type })

      return { ...prescreen, limited: true }
    }

    const { insertApplication } = await import('./lib/queries')
    await insertApplication(data, prescreen, PRIVACY_POLICY_VERSION)
    logger.info('application.created', {
      type: data.type,
      prescreen: prescreen.result,
      withAnimal: Boolean(data.animalSlug),
    })

    return { ...prescreen, limited: false }
  })

// Panel: everything below is for the committee only (spec 4: the editor sees no adopter data).

export type ApplicationSummary = Awaited<ReturnType<typeof listApplications>>[number]

export type ApplicationDetail = Awaited<ReturnType<typeof getApplication>>

// Ids are random UUIDs from the app; the dev seed uses readable ones ("seed-lobito").
const idSchema = z.object({ id: z.string().min(1).max(64) })

export const listApplications = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .validator(applicationListSearchSchema)
  .handler(async ({ data }) => {
    const { selectApplications } = await import('./lib/panel-queries')

    return selectApplications({
      stage: data.etapa,
      type: data.tipo,
      closed: data.cerradas ?? false,
    })
  })

export const getApplication = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .validator(idSchema)
  .handler(async ({ data }) => {
    const { selectApplication, selectAssignableAnimals } = await import('./lib/panel-queries')

    const [application, assignable] = await Promise.all([
      selectApplication(data.id),
      selectAssignableAnimals(),
    ])

    if (!application) {
      throw notFound()
    }

    return { ...application, assignable }
  })

export const setApplicationStage = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(
    idSchema.extend({ stage: z.enum(STAGES), reason: z.string().trim().max(400).optional() }),
  )
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: ApplicationError, event: 'application.write_failed' }, async () =>
      (await import('./lib/panel-mutations')).changeStage(
        data.id,
        data.stage,
        data.reason || undefined,
        user.id,
      ),
    ),
  )

export const saveApplicationNotes = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(idSchema.extend({ notes: z.string().trim().max(4000) }))
  .handler(async ({ data }) =>
    guarded({ error: ApplicationError, event: 'application.write_failed' }, async () =>
      (await import('./lib/panel-mutations')).saveNotes(data.id, data.notes),
    ),
  )

export const assignApplicationAnimal = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(idSchema.extend({ animalId: z.string().min(1).max(64) }))
  .handler(async ({ data, context: { user } }) =>
    guarded({ error: ApplicationError, event: 'application.write_failed' }, async () =>
      (await import('./lib/panel-mutations')).assignAnimal(data.id, data.animalId, user.id),
    ),
  )
