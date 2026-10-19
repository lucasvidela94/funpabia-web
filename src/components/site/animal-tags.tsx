import { AlertTriangle, Check, Clock, Heart } from 'lucide-react'
import type { ReactNode } from 'react'
import { gendered, type AnimalStatus, type Sex, type Species } from '@/lib/catalog'
import { cn } from '@/lib/utils'

// Pills from the design system (section 6). Color never travels alone: each one carries text and,
// for status, an icon.

function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-pill px-2.5 text-[0.8125rem] font-semibold whitespace-nowrap [&_svg]:size-3.5',
        className,
      )}
    >
      {children}
    </span>
  )
}

// The tag over the photo: urgent first, then the statuses a visitor can see.
export function StatusTag({
  status,
  urgent,
  sex,
}: {
  status: AnimalStatus
  urgent: boolean
  sex: Sex
}) {
  if (status === 'adopted') {
    return (
      <Pill className="bg-adopted-soft text-adopted">
        <Heart aria-hidden="true" />
        {gendered('Adoptado', sex)}
      </Pill>
    )
  }

  if (status === 'reserved') {
    return (
      <Pill className="bg-yellow-100 text-ink">
        <Clock aria-hidden="true" />
        {gendered('Reservado', sex)}
      </Pill>
    )
  }

  if (urgent) {
    return (
      <Pill className="bg-urgent-soft text-urgent">
        <AlertTriangle aria-hidden="true" />
        Urgente
      </Pill>
    )
  }

  return null
}

const SPECIES_STYLE: Record<Species, string> = {
  dog: 'bg-turquoise-100 text-teal-900',
  cat: 'bg-lilac-100 text-lilac-700',
  other: 'bg-sand text-ink-2',
}

export function SpeciesTag({ species, children }: { species: Species; children: ReactNode }) {
  return <Pill className={SPECIES_STYLE[species]}>{children}</Pill>
}

export function TraitTag({ children }: { children: ReactNode }) {
  return (
    <Pill className="bg-secondary text-secondary-foreground">
      <Check aria-hidden="true" />
      {children}
    </Pill>
  )
}
