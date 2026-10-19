import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { GoalProgress } from '@/components/shared/goal-progress'
import { GoalDonations } from '@/components/panel/goal-donations'
import { GoalForm } from '@/components/panel/goal-form'
import { editGoal, getGoalDetail } from '@/lib/goals'

export const Route = createFileRoute('/_private/panel/_admin/metas/$goalId')({
  loader: ({ params }) => getGoalDetail({ data: { id: params.goalId } }),
  component: GoalPage,
  notFoundComponent: () => (
    <div>
      <h1 className="font-heading text-3xl font-bold">Esta meta no existe</h1>
      <Link
        to="/panel/metas"
        className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline"
      >
        Volver a las metas
      </Link>
    </div>
  ),
})

function GoalPage() {
  const detail = Route.useLoaderData()
  const router = useRouter()
  const { goal } = detail

  return (
    <div>
      <Link
        to="/panel/metas"
        className="mb-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Metas
      </Link>
      <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{goal.title}</h1>
      {goal.status === 'active' ? (
        <Link
          to="/dona/$slug"
          params={{ slug: goal.slug }}
          target="_blank"
          className="mt-1 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
        >
          Ver cómo se ve en el sitio
        </Link>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          {/* The same bar visitors see. */}
          <GoalProgress goal={goal} headingLevel="h2" />
          <GoalDonations detail={detail} />
        </div>
        <section aria-labelledby="editar">
          <h2 id="editar" className="mb-3 font-heading text-xl font-bold">
            Editar la meta
          </h2>
          {/* Remounts when the stored status changes (a donation can fulfil the goal), so the form
              never saves back a stale status. */}
          <GoalForm
            key={`${goal.id}:${goal.status}`}
            initial={{
              title: goal.title,
              description: goal.description ?? '',
              target: String(goal.target),
              deadlineOn: goal.deadlineOn ?? '',
              mercadoPagoUrl: goal.mercadoPagoUrl ?? '',
              status: goal.status,
            }}
            submitLabel="Guardar cambios"
            showStatus
            onSave={async (input) => {
              await editGoal({ data: { ...input, id: goal.id } })
              await router.invalidate({ sync: true })
            }}
          />
        </section>
      </div>
    </div>
  )
}
