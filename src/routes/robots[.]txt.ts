import { createFileRoute } from '@tanstack/react-router'

// Spec 12: robots.txt. An endpoint, not a page, so it sits outside the layouts (like api/**).
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { buildRobots, siteInfo } = await import('@/lib/seo/server')

        return new Response(buildRobots(siteInfo(new URL(request.url))), {
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=86400',
          },
        })
      },
    },
  },
})
