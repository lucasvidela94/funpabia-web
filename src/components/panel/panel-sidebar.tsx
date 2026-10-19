import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronRight, ChevronsUpDown, ExternalLink, LogOut } from 'lucide-react'
import { Collapsible } from 'radix-ui'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { roleLabel } from '@/lib/auth/session'
import { navForRole } from './nav'

type Group = ReturnType<typeof navForRole>[number]

export function PanelSidebar({
  user,
  isAdmin,
  onSignOut,
}: {
  user: { name: string; role: string }
  isAdmin: boolean
  onSignOut: () => void
}) {
  const { isMobile, setOpenMobile } = useSidebar()
  const closeOnMobile = () => (isMobile ? setOpenMobile(false) : undefined)

  return (
    <Sidebar className="on-dark">
      <SidebarHeader className="px-6 pt-4 pb-2">
        <Link to="/panel" onClick={closeOnMobile} className="leading-none">
          <span className="block font-heading text-2xl font-bold tracking-tight">Funpabia</span>
          <span className="mt-1 block text-sm text-sidebar-foreground/75">Panel de gestión</span>
        </Link>
      </SidebarHeader>

      {/* A thin scrollbar in the sidebar's own colors, for short screens. */}
      <SidebarContent className="[scrollbar-color:var(--color-teal-600)_transparent] [scrollbar-width:thin]">
        <nav aria-label="Panel">
          {navForRole(isAdmin).map((group) =>
            group.collapsible ? (
              <CollapsibleGroup key={group.label} group={group} onNavigate={closeOnMobile} />
            ) : (
              <SidebarGroup key={group.label ?? 'inicio'}>
                {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
                <NavItems group={group} onNavigate={closeOnMobile} />
              </SidebarGroup>
            ),
          )}
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser user={user} onSignOut={onSignOut} />
      </SidebarFooter>
    </Sidebar>
  )
}

function NavItems({ group, onNavigate }: { group: Group; onNavigate: () => void }) {
  return (
    <SidebarMenu>
      {group.items.map((item) => (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton asChild>
            <Link to={item.to} activeOptions={{ exact: item.to === '/panel' }} onClick={onNavigate}>
              <item.icon aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

// Closed by default; always open while the current page is one of its items.
function CollapsibleGroup({ group, onNavigate }: { group: Group; onNavigate: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const containsCurrent = group.items.some((item) => item.to && pathname.startsWith(item.to))
  const [opened, setOpened] = useState(false)
  const open = containsCurrent || opened

  return (
    <Collapsible.Root open={open} onOpenChange={setOpened} asChild>
      <SidebarGroup>
        <SidebarGroupLabel className="p-0">
          <Collapsible.Trigger className="flex h-full w-full items-center justify-between rounded-md px-3 hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring">
            {group.label}
            <ChevronRight
              aria-hidden="true"
              className="size-4 transition-transform duration-150 data-[open=true]:rotate-90 motion-reduce:transition-none"
              data-open={open}
            />
          </Collapsible.Trigger>
        </SidebarGroupLabel>
        <Collapsible.Content>
          <NavItems group={group} onNavigate={onNavigate} />
        </Collapsible.Content>
      </SidebarGroup>
    </Collapsible.Root>
  )
}

// shadcn's NavUser: one row with who is signed in; the account actions open from it.
function NavUser({
  user,
  onSignOut,
}: {
  user: { name: string; role: string }
  onSignOut: () => void
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="h-auto py-2 data-[state=open]:bg-sidebar-accent">
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate">{user.name}</span>
                <span className="truncate text-sm font-normal text-sidebar-foreground/75">
                  {roleLabel(user.role)}
                </span>
              </span>
              <ChevronsUpDown aria-hidden="true" className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width)"
          >
            <DropdownMenuLabel>
              <span className="block truncate font-semibold">{user.name}</span>
              <span className="block text-sm text-muted-foreground">{roleLabel(user.role)}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/" target="_blank" rel="noopener">
                <ExternalLink aria-hidden="true" />
                Ver el sitio
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onSignOut}>
              <LogOut aria-hidden="true" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
