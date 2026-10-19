import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// One picked entity from an on-demand search: there are too many animals and people to list
// them all in a form. Used by the news and foster forms.

export type Picked = { id: string; name: string; detail: string }

function PickedChip({
  picked,
  onClear,
  label,
}: {
  picked: Picked
  onClear: () => void
  label: string
}) {
  return (
    <p className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-teal-900 bg-secondary px-3 font-semibold text-secondary-foreground">
      <span>
        {picked.name} <span className="font-normal">{picked.detail}</span>
      </span>
      <button
        type="button"
        onClick={onClear}
        className="flex size-8 items-center justify-center"
        aria-label={label}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </p>
  )
}

export function EntitySearch({
  label,
  placeholder,
  emptyText,
  picked,
  onPick,
  onClear,
  onSearch,
  error,
}: {
  label: string
  placeholder: string
  emptyText: string
  picked: Picked | null
  onPick: (picked: Picked) => void
  onClear: () => void
  onSearch: (q: string) => Promise<Picked[]>
  error?: string
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Picked[] | null>(null)
  const [searching, setSearching] = useState(false)

  async function search() {
    const query = q.trim()

    if (query === '') {
      return
    }

    setSearching(true)

    try {
      setResults((await onSearch(query)).slice(0, 8))
    } finally {
      setSearching(false)
    }
  }

  return (
    <div>
      <p className="mb-2 text-base font-semibold">{label}</p>
      {picked ? (
        <PickedChip picked={picked} onClear={onClear} label={`Quitar ${picked.name}`} />
      ) : (
        <>
          <div className="flex gap-2">
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void search()
                }
              }}
              placeholder={placeholder}
              aria-label={placeholder}
              className="h-12 bg-card text-base"
            />
            <Button
              type="button"
              variant="outline"
              className="h-12 shrink-0 px-4 font-semibold"
              disabled={searching}
              onClick={() => void search()}
            >
              {searching ? '…' : 'Buscar'}
            </Button>
          </div>
          {results !== null ? (
            results.length > 0 ? (
              <ul className="mt-2 divide-y overflow-hidden rounded-md border bg-card">
                {results.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center px-3 font-semibold hover:bg-muted"
                      onClick={() => {
                        onPick(result)
                        setResults(null)
                        setQ('')
                      }}
                    >
                      {result.name} <span className="font-normal text-ink-2">{result.detail}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-2">{emptyText}</p>
            )
          ) : null}
        </>
      )}
      {error ? <p className="mt-1.5 text-sm font-semibold text-lost">{error}</p> : null}
    </div>
  )
}
