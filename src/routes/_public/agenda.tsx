import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AgendaItem } from '@/components/site/agenda-item'
import { PageIntro } from '@/components/site/page-intro'
import { getUpcomingEvents } from '@/lib/agenda'
import { pageMeta } from '@/lib/seo'
import { cn } from '@/lib/utils'

// Spec 6.7: upcoming events, filtered by type. The URL keeps the filter so it can be shared.
const TYPE_FILTERS = [
  { value: 'castracion', label: 'Castración', type: 'neutering' },
  { value: 'vacunacion', label: 'Vacunación', type: 'vaccination' },
  { value: 'desparasitacion', label: 'Desparasitación', type: 'deworming' },
  { value: 'adopcion', label: 'Jornadas de adopción', type: 'adoption_day' },
] as const

const searchSchema = z.object({
  tipo: z
    .enum(['castracion', 'vacunacion', 'desparasitacion', 'adopcion'])
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/_public/agenda')({
  validateSearch: searchSchema,
  loader: () => getUpcomingEvents({ data: { limit: 100 } }),
  head: () => ({
    meta: pageMeta(
      'Castración y vacunación gratuita en Cipolletti: agenda | Funpabia',
      'Fechas y lugares de castración, vacunación antirrábica y jornadas de adopción en Cipolletti.',
    ),
  }),
  component: Agenda,
})

function Agenda() {
  const { tipo } = Route.useSearch()
  const events = Route.useLoaderData()
  const filter = TYPE_FILTERS.find((option) => option.value === tipo)
  const shown = filter ? events.filter((event) => event.type === filter.type) : events

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 pb-20 sm:pt-14">
      <PageIntro title="Agenda de castración y vacunación">
        <p>
          Jornadas gratuitas de la fundación, la Municipalidad y Zoonosis. Algunas piden turno o
          ayuno: fijate en cada una.
        </p>
      </PageIntro>

      <nav aria-label="Filtrar por tipo" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          <li>
            <FilterLink active={!filter} search={{}}>
              Todo
            </FilterLink>
          </li>
          {TYPE_FILTERS.map((option) => (
            <li key={option.value}>
              <FilterLink active={filter?.value === option.value} search={{ tipo: option.value }}>
                {option.label}
              </FilterLink>
            </li>
          ))}
        </ul>
      </nav>

      {shown.length > 0 ? (
        <ul className="mt-8 flex flex-col gap-4">
          {shown.map((event) => (
            <li key={event.id}>
              <AgendaItem event={event} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-lg bg-muted p-6">
          <p className="font-heading text-xl font-bold">
            No hay fechas cargadas{filter ? ' de este tipo' : ''}
          </p>
          <p className="mt-1 text-ink-2">
            Las publicamos apenas el Municipio o Zoonosis las anuncian. También salen en nuestro
            Instagram.
          </p>
        </div>
      )}
    </div>
  )
}

function FilterLink({
  active,
  search,
  children,
}: {
  active: boolean
  search: z.input<typeof searchSchema>
  children: string
}) {
  return (
    <Link
      to="/agenda"
      search={search}
      aria-current={active ? 'true' : undefined}
      resetScroll={false}
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
