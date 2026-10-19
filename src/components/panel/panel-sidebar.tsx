import { Link } from '@tanstack/react-router'
import { ExternalLink, LogOut } from 'lucide-react'
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
      <SidebarHeader className="px-6 pt-5 pb-3">
        <Link to="/panel" onClick={closeOnMobile} className="leading-none">
          <span className="block font-heading text-2xl font-bold tracking-tight">Funpabia</span>
          <span className="mt-1 block text-sm text-sidebar-foreground/75">Panel de gestión</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Panel">
          {navForRole(isAdmin).map((group) => (
            <SidebarGroup key={group.label ?? 'inicio'}>
              {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.to}
                        activeOptions={{ exact: item.to === '/panel' }}
                        onClick={closeOnMobile}
                      >
                        <item.icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-3 py-1">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="text-sm text-sidebar-foreground/75">{roleLabel(user.role)}</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/" target="_blank" rel="noopener">
                <ExternalLink aria-hidden="true" />
                <span>Ver el sitio</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSignOut}>
              <LogOut aria-hidden="true" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
