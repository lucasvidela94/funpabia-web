import { AlertTriangle, Check, X } from 'lucide-react'
import { PRESCREEN_LABEL, STAGE_LABEL, TYPE_LABEL, type Stage } from '@/lib/applications'
import { cn } from '@/lib/utils'

// The label always carries the meaning; color only helps scanning the board (design system 8).

const PILL =
  'inline-flex h-7 items-center gap-1 rounded-pill px-2.5 text-[0.8125rem] font-semibold whitespace-nowrap'

const STAGE_STYLE = {
  new: 'bg-yellow-100 text-ink',
  in_review: 'bg-found-soft text-found',
  interview: 'bg-lilac-100 text-lilac-700',
  approved: 'bg-teal-100 text-teal-900',
  delivered: 'bg-adopted-soft text-adopted',
  rejected: 'bg-sand text-ink-2',
  withdrawn: 'bg-sand text-ink-2',
} satisfies Record<Stage, string>

export function StageBadge({ stage }: { stage: Stage }) {
  return <span className={cn(PILL, STAGE_STYLE[stage])}>{STAGE_LABEL[stage]}</span>
}

const PRESCREEN = {
  eligible: { style: 'bg-adopted-soft text-adopted', Icon: Check },
  review: { style: 'bg-urgent-soft text-urgent', Icon: AlertTriangle },
  ineligible: { style: 'bg-lost-soft text-lost', Icon: X },
}

export function PrescreenBadge({ result }: { result: keyof typeof PRESCREEN | null }) {
  if (!result) {
    return null
  }

  const { style, Icon } = PRESCREEN[result]

  return (
    <span className={cn(PILL, style)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {PRESCREEN_LABEL[result]}
    </span>
  )
}

export function TypeBadge({ type }: { type: keyof typeof TYPE_LABEL }) {
  return (
    <span className={cn(PILL, 'border border-input bg-card text-ink-2')}>{TYPE_LABEL[type]}</span>
  )
}
