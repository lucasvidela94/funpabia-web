import { Link, type LinkProps } from '@tanstack/react-router'
import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

// "Primeros pasos": what the site needs before it is useful. Each item is ticked by the data
// itself (getDashboard's `setup`), and the whole card goes away once everything is there.

const ANIMALS_TO_START = 5

type Setup = { accounts: boolean; goal: boolean; animals: number; committee: boolean }

export function SetupChecklist({ setup }: { setup: Setup }) {
  const steps: { done: boolean; label: string; detail: string; to: LinkProps['to'] }[] = [
    {
      done: setup.accounts,
      label: 'Cargar el alias y el CBU para donar',
      detail: 'Sin esto, la página Doná no dice a dónde mandar la plata.',
      to: '/panel/configuracion',
    },
    {
      done: setup.goal,
      label: 'Crear la primera meta',
      detail: 'Una necesidad concreta con su monto, como la deuda veterinaria del mes.',
      to: '/panel/metas/nueva',
    },
    {
      done: setup.animals >= ANIMALS_TO_START,
      label: `Publicar ${ANIMALS_TO_START} animales con foto`,
      detail:
        setup.animals === 0
          ? 'Con los más urgentes alcanza para que el catálogo tenga sentido.'
          : `Van ${setup.animals} de ${ANIMALS_TO_START}.`,
      to: '/panel/animales/nuevo',
    },
    {
      done: setup.committee,
      label: 'Sumar a otra persona de la comisión',
      detail: 'Así las solicitudes no esperan cuando alguien no puede.',
      to: '/panel/usuarios',
    },
  ]

  const done = steps.filter((step) => step.done).length

  if (done === steps.length) {
    return null
  }

  return (
    <section aria-labelledby="primeros-pasos" className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="primeros-pasos" className="font-heading text-xl font-bold">
          Primeros pasos
        </h2>
        <p className="text-sm font-semibold text-ink-2 tabular-nums">
          {done} de {steps.length} listos
        </p>
      </div>
      <p className="mt-1 text-ink-2">
        Lo que hace falta para que el sitio sirva. Cada paso se marca solo cuando está hecho.
      </p>
      <ul className="mt-4 divide-y">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              to={step.to}
              className="flex items-start gap-3 py-3 hover:bg-muted"
              aria-label={`${step.label}${step.done ? ', hecho' : ''}`}
            >
              {step.done ? (
                <Check
                  className="mt-0.5 size-5 shrink-0 rounded-full bg-adopted p-0.5 text-white"
                  aria-hidden="true"
                />
              ) : (
                <Circle className="mt-0.5 size-5 shrink-0 text-gray-500" aria-hidden="true" />
              )}
              <span className="min-w-0">
                <span className={cn('block font-semibold', step.done && 'text-ink-2 line-through')}>
                  {step.label}
                </span>
                {step.done ? null : <span className="block text-sm text-ink-2">{step.detail}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
