import { createServerFn } from '@tanstack/react-start'
import type { SiteInfo } from './server'

// What search engines and link previews read (spec 12): structured data, canonical and Open Graph
// tags. The sitemap and robots.txt are server only: see ./server.ts.

export type { SiteInfo } from './server'

type JsonLdValue = string | string[] | { [key: string]: string }

// A <script type="application/ld+json"> for a route's head. "<" is escaped so no value typed in
// the panel can close the script tag.
export function jsonLd(data: { [key: string]: JsonLdValue }) {
  return {
    type: 'application/ld+json',
    children: JSON.stringify({ '@context': 'https://schema.org', ...data }).replaceAll(
      '<',
      '\\u003c',
    ),
  }
}

// The public origin and whether the site may be indexed. The root route loads it once and the
// head of every page builds its absolute URLs from it.
export const getSiteInfo = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SiteInfo> => {
    const { siteInfo } = await import('./server')
    const { getRequestUrl } = await import('@tanstack/react-start/server')

    return siteInfo(getRequestUrl())
  },
)

// Tags every page shares. The root route adds them; a page overrides any of them by repeating the
// name (the deepest route wins), which is how a profile swaps in its own photo and URL.
export function siteHead(site: SiteInfo, pathname: string) {
  const url = `${site.origin}${pathname}`

  // Visits are counted on the public site only, never in the panel.
  const counted = site.analyticsToken !== null && !/^\/(panel|login)(\/|$)/.test(pathname)

  return {
    scripts: counted
      ? [
          {
            src: 'https://static.cloudflareinsights.com/beacon.min.js',
            defer: true,
            'data-cf-beacon': JSON.stringify({ token: site.analyticsToken }),
          },
        ]
      : [],
    meta: [
      ...(site.indexable ? [] : [{ name: 'robots', content: 'noindex, nofollow' }]),
      { property: 'og:site_name', content: 'Funpabia' },
      { property: 'og:locale', content: 'es_AR' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url },
      { property: 'og:image', content: `${site.origin}/og/default.png` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'Logo de Funpabia, Fundación para el Bienestar Animal' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}

// Text from the panel or from visitors, ready for a description tag: markup removed, whitespace
// collapsed, cut at a word with an ellipsis. (Attributes are escaped by React, so this is about
// what the preview shows, not about safety.)
export function plainText(text: string, max: number) {
  const clean = text
    .replaceAll(/<[^>]*>/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()

  if (clean.length <= max) {
    return clean
  }

  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

// The page's own image for link previews, with its size. It replaces the site's default image
// (name and size together, so the two never disagree); a photo of unknown size is not used, the
// default stays.
export function imageMeta(
  url: string,
  photo: { alt: string; width: number | null; height: number | null },
) {
  if (photo.width === null || photo.height === null) {
    return []
  }

  return [
    { property: 'og:image', content: url },
    { property: 'og:image:width', content: String(photo.width) },
    { property: 'og:image:height', content: String(photo.height) },
    { property: 'og:image:alt', content: photo.alt },
  ]
}

// Title and description for a page, repeated for link previews.
export function pageMeta(title: string, description: string) {
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
  ]
}
