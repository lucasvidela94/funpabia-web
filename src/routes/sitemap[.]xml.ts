import { createFileRoute } from '@tanstack/react-router'

// Spec 12: sitemap.xml. An endpoint, not a page, so it sits outside the layouts (like api/**).
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { buildSitemap, siteInfo } = await import('@/lib/seo/server')

        return new Response(await buildSitemap(siteInfo(new URL(request.url))), {
          headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
