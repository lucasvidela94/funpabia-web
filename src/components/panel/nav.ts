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

// The panel menu (docs/routes.md, "Sidebar"). `admin` items are the routes under the _admin
// layout; the sidebar hides them from editors so the menu and the guard never disagree.

type PanelNavItem = { label: string; to: LinkProps['to']; icon: LucideIcon; admin: boolean }

type PanelNavGroup = { label: string | null; items: PanelNavItem[] }

const PANEL_NAV: PanelNavGroup[] = [
  { label: null, items: [{ label: 'Tablero', to: '/panel', icon: LayoutDashboard, admin: false }] },
  {
    label: 'Animales',
    items: [{ label: 'Animales', to: '/panel/animales', icon: PawPrint, admin: false }],
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
      { label: 'Agenda', to: '/panel/agenda', icon: CalendarDays, admin: false },
      { label: 'Noticias', to: '/panel/noticias', icon: Newspaper, admin: false },
      { label: 'Perdidos', to: '/panel/perdidos', icon: Search, admin: false },
    ],
  },
  {
    label: 'Administración',
    items: [
      { label: 'Usuarios', to: '/panel/usuarios', icon: UserCog, admin: true },
      { label: 'API', to: '/panel/api', icon: KeyRound, admin: true },
      { label: 'Configuración', to: '/panel/configuracion', icon: Settings, admin: true },
    ],
  },
]

export function navForRole(isAdmin: boolean): PanelNavGroup[] {
  return PANEL_NAV.flatMap((group) => {
    const items = group.items.filter((item) => isAdmin || !item.admin)

    return items.length > 0 ? [{ ...group, items }] : []
  })
}
