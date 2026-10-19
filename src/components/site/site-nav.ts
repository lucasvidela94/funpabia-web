import type { LinkProps } from '@tanstack/react-router'

// One list for the header, the mobile menu and the footer (docs/routes.md).

type NavItem = { label: string; to: LinkProps['to'] }

export const HEADER_NAV: NavItem[] = [
  { label: 'Adoptá', to: '/adopta' },
  { label: 'Cómo adoptar', to: '/como-adoptar' },
  { label: 'Sé tránsito', to: '/transito' },
  { label: 'Agenda', to: '/agenda' },
  { label: 'Quiénes somos', to: '/quienes-somos' },
]

export const FOOTER_NAV: { title: string; items: NavItem[] }[] = [
  {
    title: 'Adopción',
    items: [
      { label: 'Animales en adopción', to: '/adopta' },
      { label: 'Cómo adoptar', to: '/como-adoptar' },
      { label: 'Ser tránsito', to: '/transito' },
    ],
  },
  {
    title: 'Ayudar',
    items: [
      { label: 'Doná a una meta', to: '/dona' },
      { label: 'Agenda de castración', to: '/agenda' },
      { label: 'Perdidos y encontrados', to: '/perdidos' },
      { label: 'Noticias', to: '/noticias' },
    ],
  },
  {
    title: 'La fundación',
    items: [
      { label: 'Quiénes somos', to: '/quienes-somos' },
      { label: 'Contacto', to: '/contacto' },
      { label: 'Preguntas frecuentes', to: '/preguntas' },
      { label: 'Privacidad', to: '/privacidad' },
    ],
  },
]
