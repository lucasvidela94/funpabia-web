import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import type { ApplicationType } from '@/lib/applications'

// The two ways the adoption and foster form ends.

const LINK =
  'inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4'

// Spec 6.2: an excluding answer is explained kindly, with other ways to help.
export function Excluded({
  type,
  reasons,
  onBack,
}: {
  type: ApplicationType
  reasons: string[]
  onBack: () => void
}) {
  return (
    <section className="rounded-lg border bg-card p-6 shadow-card sm:p-8">
      <h2 className="font-heading text-3xl font-bold">Por ahora no podemos seguir</h2>
      <ul className="mt-4 flex flex-col gap-2 text-lg">
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="mt-6 font-semibold">Igual podés ayudar mucho:</p>
      <ul className="mt-2 flex flex-col">
        {type === 'adoption' ? (
          <li>
            <Link to="/transito" className={LINK}>
              Siendo tránsito por un tiempo
            </Link>
          </li>
        ) : null}
        <li>
          <Link to="/dona" className={LINK}>
            Donando a una meta
          </Link>
        </li>
        <li>
          <Link to="/adopta" className={LINK}>
            Compartiendo las fichas de los animales
          </Link>
        </li>
      </ul>
      <Button
        type="button"
        variant="outline"
        className="mt-6 h-11 border-input px-5 font-semibold"
        onClick={onBack}
      >
        Corregir una respuesta
      </Button>
    </section>
  )
}

export function Sent({ animalName }: { animalName?: string }) {
  return (
    <section className="rounded-lg border-l-[6px] border-adopted bg-adopted-soft p-6 sm:p-8">
      <h2 className="font-heading text-3xl font-bold text-adopted">Recibimos tu solicitud</h2>
      <p className="mt-3 max-w-prose text-lg">
        {animalName ? `Gracias por pensar en ${animalName}. ` : 'Gracias. '}
        Somos voluntarias y leemos cada solicitud: te escribimos por WhatsApp en los próximos días.
      </p>
      <Link to="/adopta" className={`mt-5 ${LINK}`}>
        Seguir mirando animales
      </Link>
    </section>
  )
}
