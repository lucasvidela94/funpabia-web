import { Outlet, createFileRoute } from '@tanstack/react-router'
import { getPublicSettings } from '@/lib/settings'
import { SiteFooter } from '../components/site/site-footer'
import { SiteHeader } from '../components/site/site-header'

export const Route = createFileRoute('/_public')({
  loader: () => getPublicSettings(),
  staleTime: 5 * 60_000,
  component: PublicLayout,
})

function PublicLayout() {
  const settings = Route.useLoaderData()

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only z-50 bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter contact={settings.contact} />
    </div>
  )
}
