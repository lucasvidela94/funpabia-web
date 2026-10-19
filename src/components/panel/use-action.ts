import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

// One panel write: tracks pending and the error message, and reloads the route's data when it
// succeeds so the page shows what is now stored. Resolves with the work's result, or undefined
// when it failed (the error is in `error`).
export function useAction() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function run<T>(work: () => Promise<T>): Promise<T | undefined> {
    setPending(true)
    setError(null)
    setDone(false)

    try {
      const result = await work()
      // sync: resolve only once the fresh data is on screen, so `done` never shows over stale data.
      await router.invalidate({ sync: true })
      setDone(true)

      return result
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar.')

      return undefined
    } finally {
      setPending(false)
    }
  }

  return { run, pending, error, done }
}
