import { Link, createFileRoute } from '@tanstack/react-router'
import { ChevronRight, Plus } from 'lucide-react'
import { PanelHeader } from '@/components/panel/panel-page'
import { formatDate, formatMoney } from '@/lib/format'
import { GOAL_STATUS_LABEL, listAllGoals } from '@/lib/goals'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_private/panel/_admin/metas/')({
  loader: () => listAllGoals(),
  component: Goals,
})

const STATUS_STYLE = {
  active: 'bg-teal-100 text-teal-900',
  fulfilled: 'bg-adopted-soft text-adopted',
  closed: 'bg-sand text-ink-2',
}

function Goals() {
  const goals = Route.useLoaderData()

  return (
    <div>
      <PanelHeader
        title="Metas"
        help="registrar-donacion"
        description="Cada necesidad grande, con su avance público."
        actions={
          <Link
            to="/panel/metas/nueva"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 font-bold text-primary-foreground hover:bg-teal-900"
          >
            <Plus className="size-5" aria-hidden="true" />
            Nueva meta
          </Link>
        }
      />

      {goals.length > 0 ? (
        <ul className="mt-6 divide-y overflow-hidden rounded-lg border bg-card">
          {goals.map((goal) => (
            <li key={goal.id}>
              <Link
                to="/panel/metas/$goalId"
                params={{ goalId: goal.id }}
                className="flex items-center gap-4 px-4 py-4 hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading text-lg font-bold">{goal.title}</p>
                    <span
                      className={cn(
                        'inline-flex h-7 items-center rounded-pill px-2.5 text-[0.8125rem] font-semibold',
                        STATUS_STYLE[goal.status],
                      )}
                    >
                      {GOAL_STATUS_LABEL[goal.status]}
                    </span>
                  </div>
                  <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-pill bg-sand">
                    <div
                      className="h-full rounded-pill bg-teal-600"
                      style={{ width: `${goal.percent}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-sm text-ink-2">
                    <strong className="text-ink tabular-nums">{formatMoney(goal.raised)}</strong> de{' '}
                    {formatMoney(goal.target)} ({goal.percent} %), {goal.donations}{' '}
                    {goal.donations === 1 ? 'aporte' : 'aportes'}
                    {goal.deadlineOn ? `. Hasta el ${formatDate(goal.deadlineOn)}` : ''}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-gray-500" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-input bg-card p-8">
          <p className="font-heading text-xl font-bold">Todavía no hay metas</p>
          <p className="mt-1 text-ink-2">
            Una meta convierte una necesidad en algo que se puede seguir: cuánto hace falta y cuánto
            se juntó.
          </p>
        </div>
      )}
    </div>
  )
}
