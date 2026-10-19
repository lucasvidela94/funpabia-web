import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronRight, EyeOff, Search } from 'lucide-react'
import type { FormEvent } from 'react'
import { AnimalPhoto } from '@/components/shared/animal-photo'
import { ArchivedAnimalRow } from '@/components/panel/archived-animal-row'
import { PanelHeader } from '@/components/panel/panel-page'
import { StatusBadge, UrgentBadge } from '@/components/panel/status-badge'
import { Input } from '@/components/ui/input'
import { listAnimals } from '@/lib/animals'
import { animalListSearchSchema } from '@/lib/animals/search'
import { STATUS_LABEL, type AnimalStatus } from '@/lib/catalog'
import { cn } from '@/lib/utils'

const LOCATION_LABEL = { shelter: 'Refugio', foster: 'Tránsito', vet: 'Veterinaria' }

const FILTERS: AnimalStatus[] = [
  'intake',
  'under_treatment',
  'available',
  'reserved',
  'fostered',
  'adopted',
]

export const Route = createFileRoute('/_private/panel/animales/')({
  validateSearch: animalListSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listAnimals({ data: deps }),
  component: AnimalsPage,
})

function AnimalsPage() {
  const search = Route.useSearch()
  const animals = Route.useLoaderData()
  const navigate = useNavigate({ from: Route.fullPath })

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    void navigate({ search: (previous) => ({ ...previous, q: q || undefined }) })
  }

  return (
    <div>
      <PanelHeader
        title="Animales"
        description={`${animals.length} ${animals.length === 1 ? 'animal' : 'animales'}`}
      />

      <div className="mt-6 flex flex-col gap-3">
        <form onSubmit={onSearch} role="search" className="relative max-w-md">
          <label htmlFor="buscar" className="sr-only">
            Buscar por nombre
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <Input
            id="buscar"
            name="q"
            defaultValue={search.q}
            placeholder="Buscar por nombre"
            className="h-12 bg-card pl-10 text-base"
          />
        </form>

        <nav aria-label="Filtrar por estado" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="flex gap-2">
            <li>
              <FilterChip active={!search.estado && !search.archivados} search={{ q: search.q }}>
                Todos
              </FilterChip>
            </li>
            {FILTERS.map((status) => (
              <li key={status}>
                <FilterChip
                  active={search.estado === status && !search.archivados}
                  search={{ q: search.q, estado: status }}
                >
                  {STATUS_LABEL[status]}
                </FilterChip>
              </li>
            ))}
            <li>
              <FilterChip
                active={search.archivados === true}
                search={{ q: search.q, archivados: true }}
              >
                Archivados
              </FilterChip>
            </li>
          </ul>
        </nav>
      </div>

      {animals.length > 0 ? (
        <ul className="mt-6 divide-y overflow-hidden rounded-lg border bg-card">
          {animals.map((animal) => (
            <li key={animal.id}>
              {search.archivados ? (
                <ArchivedAnimalRow animal={animal} />
              ) : (
                <Link
                  to="/panel/animales/$animalId"
                  params={{ animalId: animal.id }}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted"
                >
                  <AnimalPhoto
                    photo={animal.photo}
                    species={animal.species}
                    sizes="56px"
                    className="size-14 shrink-0 rounded-md [&_span]:hidden [&_svg]:size-6"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-lg font-bold">{animal.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={animal.status} />
                      {animal.urgent ? <UrgentBadge /> : null}
                      {animal.published ? null : (
                        <span className="inline-flex items-center gap-1 text-sm text-ink-2">
                          <EyeOff className="size-4" aria-hidden="true" />
                          Sin publicar
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="hidden text-sm text-ink-2 sm:block">
                    {animal.location ? LOCATION_LABEL[animal.location] : null}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-gray-500" aria-hidden="true" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      ) : search.archivados ? (
        <div className="mt-6 rounded-lg border border-dashed border-input bg-card p-8">
          <p className="font-heading text-xl font-bold">No hay animales archivados</p>
          <p className="mt-1 text-ink-2">
            Los que archives desde su ficha aparecen acá, por si hace falta recuperarlos.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-input bg-card p-8">
          <p className="font-heading text-xl font-bold">
            {search.estado || search.q ? 'Ningún animal coincide' : 'Todavía no cargaste animales'}
          </p>
          <p className="mt-1 text-ink-2">
            Con nombre, especie, sexo, edad, tamaño y una foto ya alcanza para empezar.
          </p>
          <Link
            to="/panel/animales/nuevo"
            className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-5 font-bold text-primary-foreground"
          >
            Cargar un animal
          </Link>
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  search,
  children,
}: {
  active: boolean
  search: { q?: string; estado?: AnimalStatus; archivados?: boolean }
  children: string
}) {
  return (
    <Link
      to="/panel/animales"
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
