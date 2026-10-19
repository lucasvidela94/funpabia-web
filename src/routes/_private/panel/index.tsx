import { Link, createFileRoute, type LinkProps } from '@tanstack/react-router'
import { AlertTriangle, CalendarClock, EyeOff, Inbox, Search, type LucideIcon } from 'lucide-react'
import { SetupChecklist } from '@/components/panel/setup-checklist'
import { StatusBadge } from '@/components/panel/status-badge'
import type { AnimalStatus } from '@/lib/catalog'
import { getDashboard } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

// The order an animal moves through (spec 6.3), then the side statuses.
const PIPELINE: AnimalStatus[] = ['intake', 'under_treatment', 'available', 'reserved', 'adopted']
const SIDE: AnimalStatus[] = ['fostered', 'not_adoptable', 'returned', 'deceased']

export const Route = createFileRoute('/_private/panel/')({
  loader: () => getDashboard(),
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = Route.useRouteContext()
  const data = Route.useLoaderData()

  const countOf = (status: AnimalStatus) =>
    data.byStatus.find((row) => row.status === status)?.total ?? 0

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Hola, {user.name.split(' ').at(0)}
        </h1>
        <p className="mt-1 text-ink-2">Esto es lo que necesita atención hoy.</p>
      </header>

      {data.setup ? <SetupChecklist setup={data.setup} /> : null}

      <section aria-labelledby="atencion">
        <h2 id="atencion" className="sr-only">
          Para atender
        </h2>
        <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <AttentionItem
            icon={AlertTriangle}
            count={data.urgent}
            label={data.urgent === 1 ? 'animal urgente' : 'animales urgentes'}
            to="/panel/animales"
            tone="urgent"
          />
          {data.newApplications === null ? null : (
            <AttentionItem
              icon={Inbox}
              count={data.newApplications}
              label={data.newApplications === 1 ? 'solicitud nueva' : 'solicitudes nuevas'}
              to="/panel/solicitudes"
              tone="primary"
            />
          )}
          {data.overdueFollowUps === null ? null : (
            <AttentionItem
              icon={CalendarClock}
              count={data.overdueFollowUps}
              label={data.overdueFollowUps === 1 ? 'seguimiento vencido' : 'seguimientos vencidos'}
              to="/panel/seguimientos"
              tone="lost"
            />
          )}
          <AttentionItem
            icon={Search}
            count={data.pendingReports}
            label={data.pendingReports === 1 ? 'reporte por revisar' : 'reportes por revisar'}
            to="/panel/perdidos"
            tone="primary"
          />
          <AttentionItem
            icon={EyeOff}
            count={data.unpublished}
            label="en adopción sin publicar"
            to="/panel/animales"
            tone="neutral"
          />
        </ul>
      </section>

      <section aria-labelledby="estados">
        <h2 id="estados" className="font-heading text-2xl font-bold">
          Animales por estado
        </h2>
        <ol className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-line sm:grid-cols-5">
          {PIPELINE.map((status) => (
            <li key={status} className="bg-card">
              <StatusCount status={status} total={countOf(status)} />
            </li>
          ))}
        </ol>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-ink-2">
          {SIDE.map((status) => (
            <li key={status}>
              <Link
                to="/panel/animales"
                search={{ estado: status }}
                className="inline-flex min-h-11 items-center gap-2 hover:text-ink"
              >
                <StatusBadge status={status} />
                <span className="font-semibold tabular-nums">{countOf(status)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

const TONE = {
  urgent: 'border-l-urgent [&_svg]:text-urgent',
  primary: 'border-l-teal-700 [&_svg]:text-teal-700',
  lost: 'border-l-lost [&_svg]:text-lost',
  neutral: 'border-l-line-strong [&_svg]:text-ink-2',
}

function AttentionItem({
  icon: Icon,
  count,
  label,
  to,
  tone,
}: {
  icon: LucideIcon
  count: number
  label: string
  to: LinkProps['to']
  tone: keyof typeof TONE
}) {
  return (
    <li>
      <Link
        to={to}
        className={cn(
          'flex h-full flex-col gap-3 rounded-md border border-l-[6px] bg-card p-4 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:gap-4',
          TONE[tone],
        )}
      >
        <Icon className="size-6 shrink-0" aria-hidden="true" />
        <span>
          <span className="block font-heading text-3xl leading-none font-bold tabular-nums">
            {count}
          </span>
          <span className="mt-1 block text-sm text-ink-2">{label}</span>
        </span>
      </Link>
    </li>
  )
}

function StatusCount({ status, total }: { status: AnimalStatus; total: number }) {
  return (
    <Link
      to="/panel/animales"
      search={{ estado: status }}
      className="flex h-full flex-col items-start gap-3 p-4 hover:bg-muted"
    >
      <StatusBadge status={status} />
      <span className="font-heading text-4xl leading-none font-bold tabular-nums">{total}</span>
    </Link>
  )
}
