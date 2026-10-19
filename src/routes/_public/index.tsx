import { Link, createFileRoute } from '@tanstack/react-router'
import { AgendaItem } from '@/components/site/agenda-item'
import { FosterCta } from '@/components/site/foster-cta'
import { GoalProgress } from '@/components/shared/goal-progress'
import { PetCard } from '@/components/site/pet-card'
import { Rosette } from '@/components/site/rosette'
import { Button } from '@/components/ui/button'
import { getUpcomingEvents } from '@/lib/agenda'
import { getCatalogPreview } from '@/lib/catalog'
import { formatMoney } from '@/lib/format'
import { getActiveGoals } from '@/lib/goals'
import { jsonLd, pageMeta } from '@/lib/seo'

// Figures published by the foundation for 2025 (spec section 2).
const YEAR_2025 = { adoptions: 230, rescues: 80, vetCare: 342, vetSpending: 87_721_828 }

export const Route = createFileRoute('/_public/')({
  head: () => ({
    meta: pageMeta(
      'Funpabia: adoptá un perro o un gato en Cipolletti',
      'Perros y gatos rescatados en Cipolletti y el Alto Valle buscan familia. Adoptá, sé tránsito o doná a una meta concreta.',
    ),
    // Spec 12: Organization (NGO). No street address: the shelter's location is never published.
    scripts: [
      jsonLd({
        '@type': 'NGO',
        name: 'Fundación Patagónica para el Bienestar Animal',
        alternateName: 'FUN.PA.BI.A',
        description:
          'Rescate, atención veterinaria y adopción de perros y gatos en Cipolletti y el Alto Valle.',
        areaServed: { '@type': 'City', name: 'Cipolletti, Río Negro' },
      }),
    ],
  }),
  loader: async () => {
    const [catalog, goals, events] = await Promise.all([
      getCatalogPreview(),
      getActiveGoals(),
      getUpcomingEvents({ data: { limit: 2 } }),
    ])

    return { catalog, goal: goals.at(0) ?? null, events }
  },
  component: Home,
})

function Home() {
  const { catalog, goal, events } = Route.useLoaderData()

  return (
    <>
      <Hero />

      <section aria-labelledby="esperan" className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="esperan" className="font-heading text-4xl font-bold tracking-tight">
              Esperan familia
            </h2>
            <p className="mt-2 text-lg text-ink-2">
              {catalog.total > 0
                ? `Hoy hay ${catalog.total} ${catalog.total === 1 ? 'animal' : 'animales'} en adopción. Los urgentes van primero.`
                : 'Estamos cargando las fichas de los animales en adopción.'}
            </p>
          </div>
          {catalog.total > catalog.animals.length ? (
            <Link
              to="/adopta"
              className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
            >
              Ver los {catalog.total}
            </Link>
          ) : null}
        </div>

        {catalog.animals.length > 0 ? (
          <ul className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {catalog.animals.map((animal, index) => (
              <li
                key={animal.id}
                className="w-[78vw] max-w-80 shrink-0 snap-start sm:w-auto sm:max-w-none"
              >
                <PetCard animal={animal} priority={index === 0} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 max-w-prose rounded-lg bg-muted p-6 text-ink-2">
            Mientras tanto, las novedades salen en{' '}
            <a
              href="https://www.instagram.com/funpabiacipolletti"
              className="font-semibold text-primary underline"
              rel="noopener"
            >
              Instagram
            </a>
            . Si querés adoptar ya, contanos qué buscás y te avisamos.
          </p>
        )}
      </section>

      <section aria-labelledby="metas" className="bg-muted">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center">
          <div>
            <h2 id="metas" className="font-heading text-4xl font-bold tracking-tight text-balance">
              Tu aporte tiene destino
            </h2>
            <p className="mt-4 max-w-[44ch] text-lg text-ink-2">
              En 2025 la atención veterinaria costó {formatMoney(YEAR_2025.vetSpending)}. Cada
              necesidad grande se publica como una meta, con cuánto falta y en qué se usa.
            </p>
          </div>
          {goal ? (
            <GoalProgress goal={goal} />
          ) : (
            <div className="rounded-lg border bg-card p-6">
              <p className="text-ink-2">
                Ahora no hay una meta abierta. Igual podés donar para el día a día del refugio.
              </p>
              <Button asChild className="mt-4 h-11 px-6 text-base font-bold">
                <Link to="/dona">Cómo donar</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <FosterCta />
      </div>

      {events.length > 0 ? (
        <section aria-labelledby="agenda" className="mx-auto max-w-6xl px-4 pb-16 sm:pb-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="agenda" className="font-heading text-3xl font-bold tracking-tight">
              Castración y vacunación gratis
            </h2>
            <Link
              to="/agenda"
              className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
            >
              Ver toda la agenda
            </Link>
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <li key={event.id}>
                <AgendaItem event={event} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}

function Hero() {
  return (
    <section className="overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-14 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16 lg:pb-20">
        <div>
          <h1 className="max-w-[14ch] font-heading text-[clamp(2.75rem,8vw,5.25rem)] leading-[0.98] font-bold tracking-[-0.035em]">
            <span className="text-teal-900">Adoptá </span>
            <span className="text-ink">un perro o un gato en Cipolletti</span>
          </h1>
          <p className="mt-6 max-w-[42ch] text-lg text-ink-2 sm:text-xl">
            Rescatamos, curamos y buscamos familia para perros y gatos del Alto Valle. Lo sostiene
            un grupo chico de voluntarias, a pulmón.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-12 px-7 text-base font-bold">
              <Link to="/adopta">Ver animales en adopción</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 border-primary px-6 text-base font-semibold text-primary"
            >
              <Link to="/como-adoptar">Cómo es adoptar</Link>
            </Button>
          </div>
        </div>

        <figure className="flex items-center gap-5 lg:w-72 lg:flex-col lg:items-stretch lg:gap-4">
          <Rosette className="w-32 shrink-0 sm:w-40 lg:w-full">
            <span className="font-heading text-[clamp(2rem,9vw,4.75rem)] leading-none font-bold tracking-tight">
              {YEAR_2025.adoptions}
            </span>
            <span className="mt-1 text-[clamp(0.6875rem,2.6vw,1rem)] leading-tight font-semibold">
              adopciones en 2025
            </span>
          </Rosette>
          <figcaption className="max-w-[26ch] text-sm text-ink-2 lg:text-center">
            Ese mismo año hubo {YEAR_2025.rescues} rescates y {YEAR_2025.vetCare} animales con
            atención veterinaria.
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
