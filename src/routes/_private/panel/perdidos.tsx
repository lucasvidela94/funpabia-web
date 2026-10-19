import { createFileRoute } from '@tanstack/react-router'
import { PanelHeader } from '@/components/panel/panel-page'
import { ReportRow } from '@/components/panel/report-row'
import { listPanelReports } from '@/lib/lost-found'

// Spec 6.6: the committee moderates what visitors report. Any panel role can; pending reports come
// first because nothing is public until one is approved.
export const Route = createFileRoute('/_private/panel/perdidos')({
  loader: () => listPanelReports(),
  component: LostAndFoundPanel,
})

function LostAndFoundPanel() {
  const reports = Route.useLoaderData()
  const pending = reports.filter((report) => report.status === 'pending').length

  return (
    <div>
      <PanelHeader
        title="Perdidos y encontrados"
        description={
          pending > 0
            ? `${pending} por revisar. Nada se ve en el sitio hasta que lo apruebes.`
            : 'Reportes de vecinos. Los nuevos aparecen acá para revisarlos.'
        }
      />

      {reports.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-4">
          {reports.map((report) => (
            <li key={report.id}>
              <ReportRow report={report} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-input bg-card p-8">
          <p className="font-heading text-xl font-bold">Todavía no hay reportes</p>
          <p className="mt-1 text-ink-2">
            Cuando alguien reporte un animal perdido o encontrado, lo vas a ver acá.
          </p>
        </div>
      )}
    </div>
  )
}
