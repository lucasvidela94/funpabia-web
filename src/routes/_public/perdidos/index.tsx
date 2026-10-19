import { Link, createFileRoute } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { ReportCard } from '@/components/site/report-card'
import { ReportMap } from '@/components/site/report-map'
import { ReportFilters, activeReportFilters } from '@/components/site/report-filters'
import { Button } from '@/components/ui/button'
import { getReports, getZones, reportSearchSchema } from '@/lib/lost-found'
import { pageMeta } from '@/lib/seo'

// Spec 6.6: lost and found animals by zone. Filters live in the URL, so a search can be shared.
export const Route = createFileRoute('/_public/perdidos/')({
  validateSearch: reportSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [reports, zones] = await Promise.all([getReports({ data: deps }), getZones()])

    return { reports, zones }
  },
  head: () => ({
    meta: pageMeta(
      'Perros y gatos perdidos y encontrados en Cipolletti | Funpabia',
      'Reportá o buscá un perro o un gato perdido o encontrado en Cipolletti y el Alto Valle, por zona.',
    ),
  }),
  component: LostAndFound,
})

function LostAndFound() {
  const search = Route.useSearch()
  const { reports, zones } = Route.useLoaderData()
  const filters = activeReportFilters(search)

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:pt-14">
      <header className="max-w-2xl">
        <h1 className="font-heading text-5xl font-bold tracking-[-0.03em] text-teal-900 sm:text-6xl">
          Perdidos y encontrados
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          Si perdiste o encontraste un perro o un gato, reportalo acá. Mostramos la zona, nunca la
          dirección.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="h-12 px-6 text-base font-bold">
            <Link to="/perdidos/reportar" search={{ tipo: 'encontrado' }}>
              Encontré un animal
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 px-6 text-base font-semibold">
            <Link to="/perdidos/reportar" search={{ tipo: 'perdido' }}>
              Perdí un animal
            </Link>
          </Button>
        </div>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <aside aria-label="Filtros">
          <details className="rounded-lg border bg-card lg:hidden" open={filters > 0}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-semibold">
              <SlidersHorizontal className="size-5" aria-hidden="true" />
              Filtrar
              {filters > 0 ? <span className="text-ink-2">({filters})</span> : null}
            </summary>
            <div className="border-t p-4">
              <ReportFilters search={search} zones={zones} />
            </div>
          </details>
          <div className="sticky top-24 hidden lg:block">
            <ReportFilters search={search} zones={zones} />
          </div>
        </aside>

        <section aria-labelledby="reportes">
          <h2 id="reportes" className="sr-only">
            Reportes publicados
          </h2>
          {reports.length > 0 ? <ReportMap reports={reports} /> : null}
          {reports.length > 0 ? (
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {reports.map((report) => (
                <li key={report.id}>
                  <ReportCard report={report} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-input bg-card p-8">
              <p className="font-heading text-2xl font-bold">No hay reportes con estos filtros</p>
              <p className="mt-2 text-ink-2">
                Probá con otra zona o quitá algún filtro. Si perdiste o encontraste un animal,
                reportalo y lo publicamos apenas lo revisemos.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
