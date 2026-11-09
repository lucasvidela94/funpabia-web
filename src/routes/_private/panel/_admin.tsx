import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

// Every panel route an editor may not open hangs here (spec 4: no adopter data, no accounting).
// Server functions behind these pages check the permission table again (src/lib/auth/lib/permissions.ts).
export const Route = createFileRoute('/_private/panel/_admin')({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw redirect({ to: '/panel/sin-permiso' })
    }
  },
  component: Outlet,
})
