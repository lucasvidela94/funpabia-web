import { Link, createFileRoute } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { CatalogFilters, activeFilterCount } from '@/components/site/catalog-filters'
import { PetCard } from '@/components/site/pet-card'
import { catalogSearchSchema, getCatalog } from '@/lib/catalog'
import { pageMeta } from '@/lib/seo'

export const Route = createFileRoute('/_public/adopta/')({
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getCatalog({ data: deps }),
  head: () => ({
    meta: pageMeta(
      'Animales en adopción en Cipolletti | Funpabia',
      'Perros y gatos rescatados que buscan familia en Cipolletti y el Alto Valle. Filtrá por edad, tamaño y convivencia.',
    ),
  }),
  component: Catalog,
})

function Catalog() {
  const search = Route.useSearch()
  const { animals, total } = Route.useLoaderData()
  const filters = activeFilterCount(search)

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:pt-14">
      <header className="max-w-2xl">
        <h1 className="font-heading text-5xl font-bold tracking-[-0.03em] text-teal-900 sm:text-6xl">
          Animales en adopción
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          Los urgentes aparecen primero. Si ninguno encaja con tu casa, podés{' '}
          <Link
            to="/adopta/solicitud"
            className="font-semibold text-primary underline underline-offset-4"
          >
            dejarnos tu solicitud igual
          </Link>{' '}
          y te avisamos.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <aside aria-label="Filtros">
          <details className="group rounded-lg border bg-card lg:hidden" open={filters > 0}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-semibold">
              <SlidersHorizontal className="size-5" aria-hidden="true" />
              Filtrar
              {filters > 0 ? <span className="text-ink-2">({filters})</span> : null}
            </summary>
            <div className="border-t p-4">
              <CatalogFilters search={search} />
            </div>
          </details>
          <div className="sticky top-24 hidden lg:block">
            <CatalogFilters search={search} />
          </div>
        </aside>

        <section aria-labelledby="resultados">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="resultados" className="text-base font-semibold text-ink-2" aria-live="polite">
              {resultLabel(animals.length, total, filters > 0)}
            </h2>
            {filters > 0 ? (
              <Link
                to="/adopta"
                className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
              >
                Sacar filtros
              </Link>
            ) : null}
          </div>

          {animals.length > 0 ? (
            <ul className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {animals.map((animal, index) => (
                <li key={animal.id}>
                  <PetCard animal={animal} priority={index < 2} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyCatalog filtered={filters > 0} />
          )}
        </section>
      </div>
    </div>
  )
}

function resultLabel(shown: number, total: number, filtered: boolean) {
  if (!filtered) {
    return total === 1 ? '1 animal en adopción' : `${total} animales en adopción`
  }

  return `${shown} de ${total} con esos filtros`
}

function EmptyCatalog({ filtered }: { filtered: boolean }) {
  return (
    <div className="mt-4 rounded-lg bg-muted p-8">
      <p className="font-heading text-2xl font-bold">
        {filtered ? 'Ninguno coincide con todos los filtros' : 'Todavía no hay fichas publicadas'}
      </p>
      <p className="mt-2 max-w-prose text-ink-2">
        {filtered
          ? 'Probá sacando alguno. Muchos animales se adaptan mejor de lo que dice su ficha: si tenés dudas, preguntanos.'
          : 'Estamos cargando los animales del refugio y de los tránsitos. Dejanos tu solicitud y te escribimos cuando haya uno para vos.'}
      </p>
      <Link
        to={filtered ? '/adopta' : '/adopta/solicitud'}
        className="mt-5 inline-flex h-11 items-center rounded-md bg-primary px-5 font-bold text-primary-foreground hover:bg-teal-900"
      >
        {filtered ? 'Ver todos' : 'Dejar mi solicitud'}
      </Link>
    </div>
  )
}
