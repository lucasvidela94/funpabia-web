import { Link, createFileRoute } from '@tanstack/react-router'
import { FollowUpItem } from '@/components/panel/follow-up-item'
import { PanelHeader } from '@/components/panel/panel-page'
import { listFollowUps, type FollowUp } from '@/lib/follow-ups'
import { followUpSearchSchema } from '@/lib/follow-ups/search'
import { cn } from '@/lib/utils'

// Spec 6.4: pending and overdue follow-ups, each with its result. Overdue ones go first and are
// marked with text and a red edge, never color alone.
export const Route = createFileRoute('/_private/panel/_admin/seguimientos')({
  validateSearch: followUpSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listFollowUps({ data: deps }),
  component: FollowUps,
})

function FollowUps() {
  const { vista } = Route.useSearch()
  const { today, items } = Route.useLoaderData()
  const done = vista === 'hechos'
  const overdue = done ? [] : items.filter((item) => item.scheduledOn < today)
  const upcoming = done ? [] : items.filter((item) => item.scheduledOn >= today)

  return (
    <div>
      <PanelHeader
        title="Seguimientos"
        description={
          done ? 'Los últimos registrados.' : 'Los vencidos y los de los próximos 30 días.'
        }
      />

      <nav aria-label="Vista" className="mt-6 flex gap-2">
        <Tab active={!done} vista={undefined}>
          Pendientes
        </Tab>
        <Tab active={done} vista="hechos">
          Hechos
        </Tab>
      </nav>

      {items.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-input bg-card p-8">
          <p className="font-heading text-xl font-bold">
            {done ? 'Todavía no registraste ninguno' : 'Nada pendiente'}
          </p>
          <p className="mt-1 text-ink-2">Se crean solos cuando una solicitud pasa a Entregado.</p>
        </div>
      ) : null}

      {overdue.length > 0 ? (
        <Group title={`Vencidos (${overdue.length})`} items={overdue} today={today} />
      ) : null}
      {upcoming.length > 0 ? <Group title="Próximos" items={upcoming} today={today} /> : null}
      {done && items.length > 0 ? <Group title="Registrados" items={items} today={today} /> : null}
    </div>
  )
}

function Group({ title, items, today }: { title: string; items: FollowUp[]; today: string }) {
  return (
    <section className="mt-8">
      <h2 className="font-heading text-2xl font-bold">{title}</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <FollowUpItem item={item} today={today} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Tab({
  active,
  vista,
  children,
}: {
  active: boolean
  vista: 'hechos' | undefined
  children: string
}) {
  return (
    <Link
      to="/panel/seguimientos"
      search={{ vista }}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'inline-flex h-11 items-center rounded-pill border px-4 font-semibold',
        active
          ? 'border-teal-900 bg-teal-900 text-white'
          : 'border-input bg-card hover:border-teal-700',
      )}
    >
      {children}
    </Link>
  )
}
