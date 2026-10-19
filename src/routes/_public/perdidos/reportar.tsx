import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageIntro } from '@/components/site/page-intro'
import { ReportForm } from '@/components/site/report-form'
import { getZones } from '@/lib/lost-found'

// Spec 6.6: report a lost or found animal, no account. `?tipo=` says which one (the buttons of
// /perdidos set it); without it the visitor is asked to pick.
export const Route = createFileRoute('/_public/perdidos/reportar')({
  validateSearch: z.object({ tipo: z.enum(['perdido', 'encontrado']).optional().catch(undefined) }),
  loader: () => getZones(),
  head: () => ({
    meta: [{ title: 'Reportar un animal | Funpabia' }, { name: 'robots', content: 'noindex' }],
  }),
  component: Report,
})

function Report() {
  const { tipo } = Route.useSearch()
  const zones = Route.useLoaderData()
  const navigate = Route.useNavigate()

  if (!tipo) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:pt-14">
        <PageIntro title="Reportar un animal">
          <p>Es un minuto y no hace falta tener cuenta. ¿Qué pasó?</p>
        </PageIntro>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate({ search: { tipo: 'encontrado' } })}
            className="h-12 rounded-md bg-primary px-6 text-base font-bold text-primary-foreground"
          >
            Encontré un animal
          </button>
          <button
            type="button"
            onClick={() => navigate({ search: { tipo: 'perdido' } })}
            className="h-12 rounded-md border border-primary px-6 text-base font-semibold text-primary"
          >
            Perdí un animal
          </button>
        </div>
      </div>
    )
  }

  const kind = tipo === 'perdido' ? 'lost' : 'found'

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:pt-14">
      <PageIntro title={kind === 'lost' ? 'Perdí un animal' : 'Encontré un animal'}>
        <p>
          Con una foto y la zona alcanza. Publicamos el reporte después de revisarlo, sin tu
          dirección.
        </p>
      </PageIntro>
      <div className="mt-8">
        <ReportForm kind={kind} zones={zones} />
      </div>
    </div>
  )
}
