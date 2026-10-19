import { Link, createFileRoute } from '@tanstack/react-router'
import { ApplicationCard } from '@/components/panel/application-card'
import { PanelHeader } from '@/components/panel/panel-page'
import { OPEN_STAGES, STAGE_LABEL, TYPE_LABEL, listApplications } from '@/lib/applications'
import { applicationListSearchSchema, type ApplicationListSearch } from '@/lib/applications/search'
import { cn } from '@/lib/utils'

// Spec 6.4: a list on the phone, a board by stage on the computer. Closed requests (delivered,
// rejected, withdrawn) have their own view so the board only holds work to do.
export const Route = createFileRoute('/_private/panel/_admin/solicitudes/')({
  validateSearch: applicationListSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listApplications({ data: deps }),
  component: Applications,
})

function Applications() {
  const search = Route.useSearch()
  const applications = Route.useLoaderData()
  const closed = search.cerradas ?? false
  const board = !closed && !search.etapa

  return (
    <div>
      <PanelHeader
        title="Solicitudes"
        description={
          closed
            ? 'Entregadas, rechazadas y retiradas, las más recientes primero.'
            : 'Las que más esperan van primero.'
        }
      />

      <div className="mt-6 flex flex-col gap-3">
        <nav aria-label="Abiertas o cerradas" className="flex gap-2">
          <Chip active={!closed} search={{ tipo: search.tipo }}>
            Abiertas
          </Chip>
          <Chip active={closed} search={{ tipo: search.tipo, cerradas: true }}>
            Cerradas
          </Chip>
        </nav>
        <nav aria-label="Filtrar" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="flex gap-2">
            <li>
              <Chip active={!search.tipo} search={{ ...search, tipo: undefined }}>
                Adopción y tránsito
              </Chip>
            </li>
            {(['adoption', 'foster'] as const).map((type) => (
              <li key={type}>
                <Chip active={search.tipo === type} search={{ ...search, tipo: type }}>
                  {TYPE_LABEL[type]}
                </Chip>
              </li>
            ))}
            {closed
              ? null
              : OPEN_STAGES.map((stage) => (
                  <li key={stage} className="lg:hidden">
                    <Chip
                      active={search.etapa === stage}
                      search={{ ...search, etapa: search.etapa === stage ? undefined : stage }}
                    >
                      {STAGE_LABEL[stage]}
                    </Chip>
                  </li>
                ))}
          </ul>
        </nav>
      </div>

      {applications.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-input bg-card p-8">
          <p className="font-heading text-xl font-bold">
            {closed ? 'Nada cerrado todavía' : 'No hay solicitudes abiertas'}
          </p>
          <p className="mt-1 text-ink-2">
            Las que llegan por el formulario del sitio aparecen acá, en la columna Nueva.
          </p>
        </div>
      ) : null}

      {applications.length > 0 && board ? (
        <div className="mt-6 hidden gap-4 lg:grid lg:grid-cols-4">
          {OPEN_STAGES.map((stage) => {
            const column = applications.filter((application) => application.stage === stage)

            return (
              <section
                key={stage}
                aria-labelledby={`col-${stage}`}
                className="rounded-lg bg-muted p-3"
              >
                <h2
                  id={`col-${stage}`}
                  className="flex items-baseline justify-between px-1 pb-3 font-heading text-lg font-bold"
                >
                  {STAGE_LABEL[stage]}
                  <span className="font-sans text-sm font-semibold text-ink-2 tabular-nums">
                    {column.length}
                  </span>
                </h2>
                <ul className="flex flex-col gap-2">
                  {column.map((application) => (
                    <li key={application.id}>
                      <ApplicationCard application={application} showStage={false} />
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      ) : null}

      {applications.length > 0 ? (
        <ul className={cn('mt-6 flex flex-col gap-2', board && 'lg:hidden')}>
          {applications.map((application) => (
            <li key={application.id}>
              <ApplicationCard application={application} showStage />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function Chip({
  active,
  search,
  children,
}: {
  active: boolean
  search: ApplicationListSearch
  children: string
}) {
  return (
    <Link
      to="/panel/solicitudes"
      search={search}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'inline-flex h-11 items-center rounded-pill border px-4 font-semibold whitespace-nowrap',
        active
          ? 'border-teal-900 bg-teal-900 text-white'
          : 'border-input bg-card hover:border-teal-700',
      )}
    >
      {children}
    </Link>
  )
}
