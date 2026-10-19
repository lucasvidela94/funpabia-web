import { Link } from '@tanstack/react-router'
import { CircleHelp } from 'lucide-react'
import type { ReactNode } from 'react'

// The top of every panel page: title, one line of context and the page's main actions. `help` is
// the slug of the guide for this screen (src/lib/help): it adds a "Cómo se hace" link to it.
export function PanelHeader({
  title,
  description,
  actions,
  help,
}: {
  title: string
  description?: string
  actions?: ReactNode
  help?: string
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description ? <p className="mt-1 text-ink-2">{description}</p> : null}
        {help ? (
          <Link
            to="/panel/ayuda"
            hash={help}
            className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            <CircleHelp className="size-4" aria-hidden="true" />
            Cómo se hace
          </Link>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}
