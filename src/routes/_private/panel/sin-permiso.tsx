import { Link, createFileRoute } from '@tanstack/react-router'
import { ShieldX } from 'lucide-react'
import { roleLabel } from '@/lib/auth/session'

// Where the panel sends a role that types a URL it may not open. The route has its own page so the
// answer is explicit instead of a silent bounce back to the dashboard.
export const Route = createFileRoute('/_private/panel/sin-permiso')({
  component: Forbidden,
})

function Forbidden() {
  const { user } = Route.useRouteContext()

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <ShieldX className="mx-auto size-10 text-lost" aria-hidden="true" />
      <h1 className="mt-4 font-heading text-3xl font-bold">No tenés permiso para ver esto</h1>
      <p className="mt-2 text-ink-2">
        Tu rol ({roleLabel(user.role)}) no puede abrir esa página. Si necesitás entrar, pedíselo a
        la comisión.
      </p>
      <Link
        to="/panel"
        className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-5 font-bold text-primary-foreground"
      >
        Volver al tablero
      </Link>
    </div>
  )
}
