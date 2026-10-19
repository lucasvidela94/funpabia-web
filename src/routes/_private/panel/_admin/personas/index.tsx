import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Search } from 'lucide-react'
import type { FormEvent } from 'react'
import { PanelHeader } from '@/components/panel/panel-page'
import { Input } from '@/components/ui/input'
import { TAG_LABEL, listPeople } from '@/lib/people'
import { peopleSearchSchema } from '@/lib/people/search'
import { formatAge } from '@/lib/format'

// Tags come from the base as plain strings; unknown values fall back to the raw tag.
const TAG_NAMES: Record<string, string> = TAG_LABEL

// Spec 7: everyone who left their data through the site. Committee only (the _admin layout).
export const Route = createFileRoute('/_private/panel/_admin/personas/')({
  validateSearch: peopleSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listPeople({ data: deps }),
  component: People,
})

function People() {
  const search = Route.useSearch()
  const people = Route.useLoaderData()
  const navigate = useNavigate({ from: Route.fullPath })

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    void navigate({ search: { q: q || undefined } })
  }

  return (
    <div>
      <PanelHeader
        title="Personas"
        description="Adoptantes, transitantes y donantes. Sus datos son privados (Ley 25.326)."
      />

      <form onSubmit={onSearch} role="search" className="relative mt-6 max-w-md">
        <label htmlFor="buscar" className="sr-only">
          Buscar por nombre, WhatsApp o email
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-500"
          aria-hidden="true"
        />
        <Input
          id="buscar"
          name="q"
          defaultValue={search.q}
          placeholder="Buscar por nombre, WhatsApp o email"
          className="h-12 bg-card pl-10 text-base"
        />
      </form>

      {people.length > 0 ? (
        <ul className="mt-6 divide-y overflow-hidden rounded-lg border bg-card">
          {people.map((person) => (
            <li key={person.id}>
              <Link
                to="/panel/personas/$personId"
                params={{ personId: person.id }}
                className="flex items-center gap-3 px-4 py-4"
              >
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">
                    {person.name}
                    {person.anonymized ? (
                      <span className="font-normal text-muted-foreground"> (anonimizada)</span>
                    ) : null}
                  </span>
                  <span className="block truncate text-sm text-ink-2">
                    {[person.city, person.whatsapp].filter(Boolean).join(' · ') || 'Sin contacto'}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {person.tags.length > 0
                      ? person.tags.map((tag) => TAG_NAMES[tag] ?? tag).join(', ')
                      : 'Sin etiquetas'}
                    {' · '}
                    {formatAge(person.createdAt)}
                  </span>
                </span>
                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-input bg-card p-8">
          <p className="font-heading text-xl font-bold">
            {search.q ? 'Nadie coincide con esa búsqueda' : 'Todavía no hay personas registradas'}
          </p>
          <p className="mt-1 text-ink-2">
            {search.q
              ? 'Probá con otro nombre, WhatsApp o email.'
              : 'Las que dejan sus datos en los formularios del sitio aparecen acá.'}
          </p>
        </div>
      )}
    </div>
  )
}
