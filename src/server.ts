import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'
import { createServerEntry } from '@tanstack/react-start/server-entry'

// The Worker's entry point. It is TanStack Start's default one plus the cron handler, which Start
// has no hook for: `scheduled` runs on the schedule in wrangler.jsonc ("triggers").
const entry = createServerEntry({ fetch: createStartHandler(defaultStreamHandler) })

export default {
  ...entry,
  async scheduled(_controller: ScheduledController, _env: Cloudflare.Env, ctx: ExecutionContext) {
    // Imported here so the page-serving path never loads it.
    const { deleteOrphanPhotos } = await import('@/lib/photo-cleanup')

    ctx.waitUntil(deleteOrphanPhotos())
  },
}
