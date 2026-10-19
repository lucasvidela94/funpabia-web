import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { House, Plus } from 'lucide-react'
import { useState } from 'react'
import { FosterForm } from '@/components/panel/foster-form'
import { PanelHeader } from '@/components/panel/panel-page'
import { useAction } from '@/components/panel/use-action'
import { ConfirmButton } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  assignFoster,
  endFoster,
  listPlacements,
  type AssignPlacement,
  type Placement,
} from '@/lib/fosters'
import { formatDate, todayCalendar } from '@/lib/format'

export const Route = createFileRoute('/_private/panel/_admin/transitos')({
  loader: () => listPlacements(),
  component: Fosters,
})

function Fosters() {
  const placements = Route.useLoaderData()
  const router = useRouter()
  const [assigning, setAssigning] = useState(false)
  const endAction = useAction()

  const active = placements.filter((placement) => !placement.endedOn)
  const history = placements.filter((placement) => placement.endedOn)

  async function save(input: AssignPlacement) {
    await assignFoster({ data: input })
    await router.invalidate({ sync: true })
    setAssigning(false)
  }

  async function end(placement: Placement) {
    await endAction.run(() => endFoster({ data: { id: placement.id, endedOn: todayCalendar() } }))
  }

  return (
    <div>
      <PanelHeader
        title="Tránsitos"
        description="Qué animal está en qué casa, desde cuándo."
        actions={
          assigning ? null : (
            <Button className="h-11 gap-2 px-4 font-bold" onClick={() => setAssigning(true)}>
              <Plus className="size-5" aria-hidden="true" />
              Asignar tránsito
            </Button>
          )
        }
      />

      {assigning ? (
        <section aria-labelledby="asignar" className="mt-6">
          <h2 id="asignar" className="mb-3 font-heading text-xl font-bold">
            Asignar un tránsito
          </h2>
          <FosterForm onSave={save} />
          <Button variant="ghost" className="mt-3 min-h-11" onClick={() => setAssigning(false)}>
            Cancelar
          </Button>
        </section>
      ) : null}

      <p aria-live="polite" className="mt-4 font-semibold text-lost">
        {endAction.error}
      </p>

      <section aria-labelledby="activos" className="mt-6">
        <h2 id="activos" className="font-heading text-xl font-bold">
          Activos ({active.length})
        </h2>
        {active.length > 0 ? (
          <ul className="mt-3 divide-y overflow-hidden rounded-lg border bg-card">
            {active.map((placement) => (
              <li key={placement.id} className="flex flex-wrap items-center gap-3 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-lg font-bold">
                    <Link
                      to="/panel/animales/$animalId"
                      params={{ animalId: placement.animalId }}
                      className="hover:underline"
                    >
                      {placement.animalName}
                    </Link>
                  </p>
                  <p className="text-sm text-ink-2">
                    En lo de{' '}
                    <Link
                      to="/panel/personas/$personId"
                      params={{ personId: placement.personId }}
                      className="font-semibold text-primary hover:underline"
                    >
                      {placement.personName}
                    </Link>{' '}
                    desde el {formatDate(placement.startedOn)}
                    {placement.endedOn ? ` hasta el ${formatDate(placement.endedOn)}` : ''}
                  </p>
                  {placement.notes ? (
                    <p className="mt-1 text-sm text-ink-2">{placement.notes}</p>
                  ) : null}
                </div>
                <ConfirmButton
                  variant="outline"
                  className="min-h-11 font-semibold"
                  disabled={endAction.pending}
                  title={`¿Terminar el tránsito de ${placement.animalName}?`}
                  description="Vuelve al refugio como disponible, con fecha de fin hoy."
                  confirmLabel="Terminar el tránsito"
                  onConfirm={() => void end(placement)}
                >
                  Terminar
                </ConfirmButton>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-input bg-card p-8">
            <House className="size-6 text-teal-700" aria-hidden="true" />
            <p className="mt-2 font-heading text-xl font-bold">Ningún tránsito activo</p>
            <p className="mt-1 text-ink-2">
              Los que asignes, o los que lleguen de solicitudes aprobadas, aparecen acá.
            </p>
          </div>
        )}
      </section>

      {history.length > 0 ? (
        <section aria-labelledby="historial" className="mt-8">
          <h2 id="historial" className="font-heading text-xl font-bold">
            Historial ({history.length})
          </h2>
          <ul className="mt-3 divide-y overflow-hidden rounded-lg border bg-card">
            {history.map((placement) => (
              <li key={placement.id} className="px-4 py-4">
                <p className="font-semibold">{placement.animalName}</p>
                <p className="text-sm text-ink-2">
                  Con {placement.personName} · {formatDate(placement.startedOn)}
                  {placement.endedOn ? ` al ${formatDate(placement.endedOn)}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
