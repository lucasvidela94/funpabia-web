import { createMiddleware } from '@tanstack/react-start'

// Headers every response from the Worker carries. Static files under /assets get theirs from
// public/_headers: they never reach the Worker.

// TanStack Start inlines the hydration script, so script-src needs 'unsafe-inline' until the
// scripts get a nonce. Everything else (photos, fonts, API) is served from this origin, except the
// map tiles of /perdidos (OpenStreetMap) and, only once ANALYTICS_TOKEN is set, Cloudflare Web
// Analytics.
function contentSecurityPolicy(analytics: boolean) {
  return [
    "default-src 'self'",
    "img-src 'self' data: blob: https://tile.openstreetmap.org",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${analytics ? ' https://static.cloudflareinsights.com' : ''}`,
    `connect-src 'self'${analytics ? ' https://cloudflareinsights.com' : ''}`,
    "font-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

// The camera is for photographing animals from the panel; geolocation is for lost and found
// animals (spec 6.6). The microphone is never used.
const SECURITY_HEADERS = {
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(self), geolocation=(self), microphone=()',
}

// Registered in src/start.ts. Not applied in dev: Vite's own scripts and websocket would break
// the policy.
export const responseHeaders = createMiddleware({ type: 'request' }).server(
  async ({ next, request }) => {
    const result = await next()

    if (!import.meta.env.PROD) {
      return result
    }

    const { siteInfo } = await import('@/lib/seo/server')
    const site = siteInfo(new URL(request.url))
    // Headers of a Response can be read-only, so the response is copied before changing them.
    const response = new Response(result.response.body, result.response)

    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(name, value)
    }

    response.headers.set(
      'content-security-policy',
      contentSecurityPolicy(site.analyticsToken !== null),
    )

    if (!site.indexable) {
      response.headers.set('x-robots-tag', 'noindex, nofollow')
    }

    return { ...result, response }
  },
)
