import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { PanelHeader } from '@/components/panel/panel-page'
import { EMPTY_RAFFLE, RaffleForm } from '@/components/panel/raffle-form'
import { createRaffle, getRaffleGoalOptions } from '@/lib/raffles'

export const Route = createFileRoute('/_private/panel/_admin/rifas/nueva')({
  loader: () => getRaffleGoalOptions(),
  component: NewRaffle,
})

function NewRaffle() {
  const goals = Route.useLoaderData()
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl">
      <Link
        to="/panel/rifas"
        className="mb-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Rifas
      </Link>
      <PanelHeader
        title="Nueva rifa"
        description="Queda en borrador hasta que abras la venta. No se publica en el sitio."
      />
      <div className="mt-6">
        <RaffleForm
          initial={EMPTY_RAFFLE}
          goals={goals}
          sizeLocked={false}
          submitLabel="Crear rifa"
          onSave={async (input) => {
            const { id } = await createRaffle({ data: input })
            await navigate({ to: '/panel/rifas/$raffleId', params: { raffleId: id } })
          }}
        />
      </div>
    </div>
  )
}
