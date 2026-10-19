import { Link, Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { CircleHelp, Plus } from 'lucide-react'
import { PanelSidebar } from '@/components/panel/panel-sidebar'
import { Button } from '@/components/ui/button'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth/client'
import { getSession, isAdminRole } from '@/lib/auth/session'

export const Route = createFileRoute('/_private')({
  beforeLoad: async () => {
    const session = await getSession()

    if (!session) {
      throw redirect({ to: '/login' })
    }

    return { user: session.user, isAdmin: isAdminRole(session.user.role) }
  },
  head: () => ({ meta: [{ title: 'Panel | Funpabia' }, { name: 'robots', content: 'noindex' }] }),
  component: PrivateLayout,
})

function PrivateLayout() {
  const { user, isAdmin } = Route.useRouteContext()
  const navigate = useNavigate()

  async function signOut() {
    await authClient.signOut()
    await navigate({ to: '/login' })
  }

  return (
    <SidebarProvider>
      <PanelSidebar user={user} isAdmin={isAdmin} onSignOut={signOut} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background px-3 md:px-6">
          <SidebarTrigger />
          <span className="font-heading text-lg font-bold md:hidden">Funpabia</span>
          {/* In the top bar rather than the sidebar: reachable from any page, and the menu keeps
              fitting without scrolling. */}
          <Button asChild variant="ghost" className="ml-auto h-11 px-3 font-semibold">
            <Link to="/panel/ayuda" aria-label="Ayuda">
              <CircleHelp className="size-5" aria-hidden="true" />
              <span className="hidden sm:inline">Ayuda</span>
            </Link>
          </Button>
          {/* Spec 8.4: adding an animal is always one tap away, from any panel page. */}
          <Button asChild className="h-11 px-4 text-base font-bold">
            <Link to="/panel/animales/nuevo">
              <Plus className="size-5" aria-hidden="true" />
              Animal
            </Link>
          </Button>
        </header>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
