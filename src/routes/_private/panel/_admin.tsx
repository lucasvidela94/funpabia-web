import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

// Every panel route an editor may not open hangs here (spec 4: no adopter data, no accounting).
// Server functions behind these pages check the role again with adminMiddleware.
export const Route = createFileRoute('/_private/panel/_admin')({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw redirect({ to: '/panel' })
    }
  },
  component: Outlet,
})
