import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { formatDate, formatMoney } from '@/lib/format'
import type { Goal } from '@/lib/goals'

// Design system 6, "barra de meta": every crisis becomes a visible goal instead of a lost post.
export function GoalProgress({
  goal,
  headingLevel = 'h3',
}: {
  goal: Goal
  headingLevel?: 'h2' | 'h3'
}) {
  const Heading = headingLevel
  const progressId = `goal-${goal.id}`

  return (
    <article className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-card sm:p-6">
      <div>
        <Heading id={progressId} className="font-heading text-2xl font-bold tracking-tight">
          <Link to="/dona/$slug" params={{ slug: goal.slug }} className="hover:underline">
            {goal.title}
          </Link>
        </Heading>
        {goal.description ? (
          <p className="mt-1 line-clamp-2 max-w-prose text-ink-2">{goal.description}</p>
        ) : null}
      </div>

      <div>
        <div
          role="progressbar"
          aria-labelledby={progressId}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={goal.percent}
          aria-valuetext={`${formatMoney(goal.raised)} de ${formatMoney(goal.target)}`}
          className="h-3 overflow-hidden rounded-pill bg-sand"
        >
          <div className="h-full rounded-pill bg-teal-600" style={{ width: `${goal.percent}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p>
            <strong className="text-lg">{formatMoney(goal.raised)}</strong>{' '}
            <span className="text-ink-2">de {formatMoney(goal.target)}</span>
          </p>
          <p className="text-sm text-ink-2">
            {goal.percent} %, {goal.donations} {goal.donations === 1 ? 'aporte' : 'aportes'}
          </p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Actualizado el {formatDate(goal.updatedAt)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {goal.mercadoPagoUrl ? (
          <Button asChild className="h-11 px-6 text-base font-bold">
            <a href={goal.mercadoPagoUrl} rel="noopener">
              Donar con Mercado Pago
            </a>
          </Button>
        ) : null}
        <Button
          asChild
          variant="outline"
          className="h-11 border-primary px-5 text-base font-semibold text-primary"
        >
          <Link to="/dona" hash="alias">
            Alias y CBU
          </Link>
        </Button>
      </div>
    </article>
  )
}
