import { Flame } from 'lucide-react'
import { STATUS_LABEL, type AnimalStatus } from '@/lib/catalog'
import { cn } from '@/lib/utils'

// Design system 8, "Estados del animal sin color propio todavía": the proposed mapping. The label
// always carries the meaning; color only helps scanning.
const STATUS_STYLE: Record<AnimalStatus, string> = {
  intake: 'bg-sand text-ink-2',
  under_treatment: 'bg-found-soft text-found',
  available: 'bg-teal-100 text-teal-900',
  reserved: 'bg-yellow-100 text-ink',
  adopted: 'bg-adopted-soft text-adopted',
  fostered: 'bg-found-soft text-found',
  deceased: 'bg-sand text-ink-2',
  returned: 'bg-sand text-ink-2',
  not_adoptable: 'bg-sand text-ink-2',
}

export function StatusBadge({ status }: { status: AnimalStatus }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center rounded-pill px-2.5 text-[0.8125rem] font-semibold whitespace-nowrap',
        STATUS_STYLE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

export function UrgentBadge() {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-pill bg-urgent-soft px-2.5 text-[0.8125rem] font-semibold text-urgent">
      <Flame className="size-3.5" aria-hidden="true" />
      Urgente
    </span>
  )
}
