import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { EMPTY_GOAL, GoalForm } from '@/components/panel/goal-form'
import { PanelHeader } from '@/components/panel/panel-page'
import { createGoal } from '@/lib/goals'

export const Route = createFileRoute('/_private/panel/_admin/metas/nueva')({ component: NewGoal })

function NewGoal() {
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl">
      <Link
        to="/panel/metas"
        className="mb-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Metas
      </Link>
      <PanelHeader
        title="Nueva meta"
        description="Se publica en Doná apenas la guardás."
        help="crear-meta"
      />
      <div className="mt-6">
        <GoalForm
          initial={EMPTY_GOAL}
          submitLabel="Crear meta"
          showStatus={false}
          onSave={async (input) => {
            const { id } = await createGoal({ data: input })
            await navigate({ to: '/panel/metas/$goalId', params: { goalId: id } })
          }}
        />
      </div>
    </div>
  )
}
