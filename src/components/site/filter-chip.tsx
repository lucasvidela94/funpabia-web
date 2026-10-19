import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// A filter option drawn as a pill. It sits inside a link that rewrites the URL, so a filtered
// list works without JavaScript and can be shared (spec 6.1).
export function FilterChip({ active, children }: { active: boolean; children: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-11 items-center gap-1.5 rounded-pill border px-4 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors',
        active
          ? 'border-teal-900 bg-teal-900 text-white'
          : 'border-input bg-card text-ink hover:border-teal-700 hover:text-teal-900',
      )}
    >
      {active ? <Check className="size-4" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
