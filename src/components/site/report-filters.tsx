import { Link } from '@tanstack/react-router'
import type { ReportSearch } from '@/lib/lost-found'
import { FilterChip } from './filter-chip'

// The filters of /perdidos: plain links that rewrite the URL, like the catalog's.

type Option<T> = { value: T; label: string }

const KINDS: Option<NonNullable<ReportSearch['tipo']>>[] = [
  { value: 'perdido', label: 'Perdidos' },
  { value: 'encontrado', label: 'Encontrados' },
]

const SPECIES: Option<NonNullable<ReportSearch['especie']>>[] = [
  { value: 'perro', label: 'Perros' },
  { value: 'gato', label: 'Gatos' },
  { value: 'otro', label: 'Otros' },
]

const PERIODS: Option<NonNullable<ReportSearch['dias']>>[] = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
]

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink-2">{label}</legend>
      <ul className="flex flex-wrap gap-2">{children}</ul>
    </fieldset>
  )
}

// One chip that sets `key` to `value`, or clears it when it is already set.
function Choice<K extends keyof ReportSearch>({
  search,
  field,
  value,
  label,
}: {
  search: ReportSearch
  field: K
  value: NonNullable<ReportSearch[K]>
  label: string
}) {
  const active = search[field] === value

  return (
    <li>
      <Link
        from="/perdidos/"
        to="/perdidos"
        search={(previous) => ({ ...previous, [field]: active ? undefined : value })}
        aria-current={active ? 'true' : undefined}
        resetScroll={false}
        className="inline-flex rounded-pill"
      >
        <FilterChip active={active}>{label}</FilterChip>
      </Link>
    </li>
  )
}

export function ReportFilters({
  search,
  zones,
}: {
  search: ReportSearch
  zones: { slug: string; name: string }[]
}) {
  return (
    <div className="flex flex-col gap-5">
      <Group label="Qué buscás">
        {KINDS.map((option) => (
          <Choice key={option.value} search={search} field="tipo" {...option} />
        ))}
      </Group>
      <Group label="Especie">
        {SPECIES.map((option) => (
          <Choice key={option.value} search={search} field="especie" {...option} />
        ))}
      </Group>
      <Group label="Zona">
        {zones.map((zone) => (
          <Choice
            key={zone.slug}
            search={search}
            field="zona"
            value={zone.slug}
            label={zone.name}
          />
        ))}
      </Group>
      {search.zona ? (
        <Group label="Alrededores">
          <Choice search={search} field="cerca" value label="Incluir zonas cercanas" />
        </Group>
      ) : null}
      <Group label="Cuándo">
        {PERIODS.map((option) => (
          <Choice key={option.value} search={search} field="dias" {...option} />
        ))}
      </Group>
    </div>
  )
}

export function activeReportFilters(search: ReportSearch) {
  return Object.values(search).filter((value) => value !== undefined).length
}
