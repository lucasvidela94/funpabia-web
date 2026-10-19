import { env } from 'cloudflare:workers'
import { z } from 'zod'

// sitemap.xml, robots.txt and where the site lives (spec 12). Server only: callers load it lazily.
// Everything is built per request because the sitemap follows what is published right now and the
// domain is still to be chosen (spec 17).

// `analyticsToken` is the Cloudflare Web Analytics token (ANALYTICS_TOKEN), or null while there is
// none: the site then loads no analytics script at all.
export type SiteInfo = { origin: string; indexable: boolean; analyticsToken: string | null }

// The public origin is PUBLIC_SITE_URL. While it is a *.workers.dev address nothing is indexable,
// and neither is any other host that serves the site (the old address after the domain changes).
// Local dev uses the request's own origin because the port changes.
export function siteInfo(requestUrl: URL): SiteInfo {
  const origin = import.meta.env.PROD ? env.PUBLIC_SITE_URL : requestUrl.origin
  const { hostname } = new URL(origin)

  return {
    origin,
    indexable: requestUrl.hostname === hostname && !hostname.endsWith('.workers.dev'),
    analyticsToken: import.meta.env.PROD && env.ANALYTICS_TOKEN ? env.ANALYTICS_TOKEN : null,
  }
}

// Public pages that always exist (docs/routes.md). Forms are left out: they are noindex.
const STATIC_PATHS = [
  '/',
  '/adopta',
  '/como-adoptar',
  '/transito',
  '/dona',
  '/agenda',
  '/perdidos',
  '/noticias',
  '/quienes-somos',
  '/contacto',
  '/preguntas',
  '/privacidad',
]

const entrySchema = z.object({ path: z.string(), updated_at: z.string() })

// Adopted animals stay listed: their profiles become happy stories and keep their shared links
// (spec 12, "sin desindexar de golpe").
async function dynamicEntries() {
  const { results } = await env.DB.prepare(
    `SELECT '/adopta/' || slug AS path, updated_at FROM animal WHERE published = 1
     UNION ALL
     SELECT '/dona/' || slug, updated_at FROM goal WHERE status IN ('active', 'fulfilled')
     UNION ALL
     SELECT '/perdidos/' || id, updated_at FROM lost_found_report
       WHERE status = 'active' AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     UNION ALL
     SELECT '/noticias/' || slug, updated_at FROM news_post
       WHERE published_at IS NOT NULL AND published_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  ).all()

  return z.array(entrySchema).parse(results)
}

function escapeXml(text: string) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export async function buildSitemap({ origin }: SiteInfo) {
  const entries = [
    ...STATIC_PATHS.map((path) => `  <url><loc>${escapeXml(origin + path)}</loc></url>`),
    ...(await dynamicEntries()).map(
      (entry) =>
        `  <url><loc>${escapeXml(origin + entry.path)}</loc><lastmod>${entry.updated_at.slice(0, 10)}</lastmod></url>`,
    ),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`
}

// The panel, the sign-in page, endpoints and the forms stay out of search engines. A site that is
// not indexable yet stays out entirely and advertises no sitemap.
export function buildRobots({ origin, indexable }: SiteInfo) {
  if (!indexable) {
    return `User-agent: *
Disallow: /
`
  }

  return `User-agent: *
Disallow: /panel
Disallow: /login
Disallow: /api/
Disallow: /adopta/solicitud
Disallow: /transito/solicitud
Disallow: /perdidos/reportar

Sitemap: ${origin}/sitemap.xml
`
}
