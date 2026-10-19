import { Link } from '@tanstack/react-router'
import type { CatalogSearch } from '@/lib/catalog'
import { FilterChip } from './filter-chip'

// Filter chips are plain links that rewrite the URL, so a filtered catalog works without
// JavaScript and can be shared (spec 6.1).

type SingleKey = 'especie' | 'edad' | 'tamano' | 'sexo'

type LivesWith = NonNullable<CatalogSearch['convive']>[number]

const SINGLE_GROUPS: {
  key: SingleKey
  label: string
  options: { value: string; label: string }[]
}[] = [
  {
    key: 'especie',
    label: 'Especie',
    options: [
      { value: 'perro', label: 'Perros' },
      { value: 'gato', label: 'Gatos' },
    ],
  },
  {
    key: 'edad',
    label: 'Edad',
    options: [
      { value: 'cachorro', label: 'Cachorro' },
      { value: 'joven', label: 'Joven' },
      { value: 'adulto', label: 'Adulto' },
      { value: 'senior', label: 'Senior' },
    ],
  },
  {
    key: 'tamano',
    label: 'Tamaño',
    options: [
      { value: 'chico', label: 'Chico' },
      { value: 'mediano', label: 'Mediano' },
      { value: 'grande', label: 'Grande' },
    ],
  },
  {
    key: 'sexo',
    label: 'Sexo',
    options: [
      { value: 'macho', label: 'Macho' },
      { value: 'hembra', label: 'Hembra' },
    ],
  },
]

const LIVES_WITH: { value: LivesWith; label: string }[] = [
  { value: 'perros', label: 'Con perros' },
  { value: 'gatos', label: 'Con gatos' },
  { value: 'chicos', label: 'Con chicos' },
]

export function CatalogFilters({ search }: { search: CatalogSearch }) {
  const livesWith = search.convive ?? []

  return (
    <div className="flex flex-col gap-5">
      {SINGLE_GROUPS.map((group) => (
        <fieldset key={group.key}>
          <legend className="mb-2 text-sm font-semibold text-ink-2">{group.label}</legend>
          <ul className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const active = search[group.key] === option.value

              return (
                <li key={option.value}>
                  <Link
                    to="/adopta"
                    search={(previous) => ({
                      ...previous,
                      [group.key]: active ? undefined : option.value,
                    })}
                    aria-current={active ? 'true' : undefined}
                    resetScroll={false}
                    className="inline-flex rounded-pill"
                  >
                    <FilterChip active={active}>{option.label}</FilterChip>
                  </Link>
                </li>
              )
            })}
          </ul>
        </fieldset>
      ))}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-2">Convive bien</legend>
        <ul className="flex flex-wrap gap-2">
          {LIVES_WITH.map((option) => {
            const active = livesWith.includes(option.value)

            const next = active
              ? livesWith.filter((value) => value !== option.value)
              : [...livesWith, option.value]

            return (
              <li key={option.value}>
                <Link
                  to="/adopta"
                  search={(previous) => ({
                    ...previous,
                    convive: next.length > 0 ? next : undefined,
                  })}
                  aria-current={active ? 'true' : undefined}
                  resetScroll={false}
                  className="inline-flex rounded-pill"
                >
                  <FilterChip active={active}>{option.label}</FilterChip>
                </Link>
              </li>
            )
          })}
        </ul>
      </fieldset>
    </div>
  )
}

export function activeFilterCount(search: CatalogSearch) {
  return (
    SINGLE_GROUPS.filter((group) => search[group.key] !== undefined).length +
    (search.convive?.length ?? 0)
  )
}
