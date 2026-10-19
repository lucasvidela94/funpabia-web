import { logger } from '@/lib/logger'

// One guarded write for panel server functions: domain errors carry the message the panel shows,
// anything else is logged and stays generic. Each module passes its own error class and event;
// nine modules share this shape, so it lives here instead of copied nine times.

export async function guarded<T>(
  options: { error: new (message?: string) => Error; event: string },
  work: () => Promise<T>,
): Promise<T> {
  try {
    return await work()
  } catch (caught) {
    if (caught instanceof options.error) {
      throw new Error(caught.message)
    }

    logger.error(options.event, {
      message: caught instanceof Error ? caught.message : 'unknown',
    })
    throw new Error('No se pudo guardar. Probá de nuevo en un momento.')
  }
}
