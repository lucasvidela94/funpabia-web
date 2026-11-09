import type { LinkProps } from '@tanstack/react-router'
import {
  CalendarCheck,
  CalendarDays,
  House,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Newspaper,
  PawPrint,
  Search,
  Settings,
  Target,
  Ticket,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { can, type Action } from '@/lib/auth/lib/permissions'
import { isAdminRole } from '@/lib/auth/session'

// The panel menu (docs/routes.md, "Sidebar"). `action` items follow the permission table; `admin`
// items are the routes under the _admin layout, so the menu and the guards never disagree.

type PanelNavItem = {
  label: string
  to: LinkProps['to']
  icon: LucideIcon
  action?: Action
  admin?: boolean
}

// `collapsible` groups open where `defaultOpen` says; the current page also opens its group. The
// rest of the panel fits without scrolling either way.
type PanelNavGroup = {
  label: string | null
  collapsible?: boolean
  defaultOpen?: boolean
  items: PanelNavItem[]
}

const PANEL_NAV: PanelNavGroup[] = [
  {
    label: null,
    items: [
      { label: 'Tablero', to: '/panel', icon: LayoutDashboard, action: 'dashboard:read' },
      { label: 'Animales', to: '/panel/animales', icon: PawPrint, action: 'animal:read' },
    ],
  },
  {
    label: 'Adopciones',
    items: [
      { label: 'Solicitudes', to: '/panel/solicitudes', icon: Inbox, admin: true },
      { label: 'Tránsitos', to: '/panel/transitos', icon: House, admin: true },
      { label: 'Seguimientos', to: '/panel/seguimientos', icon: CalendarCheck, admin: true },
      { label: 'Personas', to: '/panel/personas', icon: Users, admin: true },
    ],
  },
  {
    label: 'Donaciones',
    items: [
      { label: 'Metas', to: '/panel/metas', icon: Target, admin: true },
      { label: 'Rifas', to: '/panel/rifas', icon: Ticket, admin: true },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { label: 'Agenda', to: '/panel/agenda', icon: CalendarDays, action: 'agenda:read' },
      { label: 'Noticias', to: '/panel/noticias', icon: Newspaper, action: 'news:read' },
      { label: 'Perdidos', to: '/panel/perdidos', icon: Search, action: 'lost-found:moderate' },
    ],
  },
  {
    label: 'Administración',
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: 'Usuarios', to: '/panel/usuarios', icon: UserCog, action: 'users:manage' },
      { label: 'API', to: '/panel/api', icon: KeyRound, action: 'api:manage' },
      {
        label: 'Configuración',
        to: '/panel/configuracion',
        icon: Settings,
        action: 'settings:manage',
      },
    ],
  },
]

export function navForRole(role: string): PanelNavGroup[] {
  return PANEL_NAV.flatMap((group) => {
    const items = group.items.filter((item) =>
      item.action ? can(role, item.action) : !item.admin || isAdminRole(role),
    )

    return items.length > 0 ? [{ ...group, items }] : []
  })
}
