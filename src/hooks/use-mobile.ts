import { useSyncExternalStore } from 'react'

// shadcn's use-mobile, read as an external store so it never sets state inside an effect.
// The server renders the desktop layout; the client corrects it on hydration.
const QUERY = '(max-width: 767px)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)

  return () => media.removeEventListener('change', onChange)
}

export function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
