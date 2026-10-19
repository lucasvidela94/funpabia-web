import { Link, createFileRoute } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { PageIntro } from '@/components/site/page-intro'
import { Button } from '@/components/ui/button'
import { pageMeta } from '@/lib/seo'

// Requirements and steps from spec 6.2 and 8.1. Both are still to be confirmed with the foundation
// (spec section 17, question 2) before launch.

const REQUIREMENTS = [
  'Ser mayor de 18 años.',
  'Vivir en Cipolletti o alrededores. Consultanos si estás más lejos.',
  'Si alquilás, tener permiso para tener animales.',
  'Un patio o espacio cerrado, para que no se escape.',
  'Si ya tenés animales, que estén castrados.',
  'Si es cachorro, comprometerte a castrarlo a los 6 meses.',
  'Aceptar que te escribamos después para saber cómo está.',
]

const STEPS = [
  {
    title: 'Completás la solicitud',
    text: 'Son tres pasos cortos. Al principio te decimos qué pedimos, así no perdés tiempo.',
  },
  {
    title: 'Te escribimos por WhatsApp',
    text: 'Leemos cada solicitud. Te vamos a pedir fotos o un video del lugar donde va a vivir.',
  },
  {
    title: 'Charla o visita',
    text: 'Nos conocemos y conocés al animal. Es el momento de preguntar todo.',
  },
  {
    title: 'Contrato y entrega',
    text: 'Firmamos un contrato de adopción responsable y te lo llevás a casa.',
  },
  {
    title: 'Seguimiento',
    text: 'Te escribimos a la semana, al mes y a los seis meses. Si es cachorro, también para la castración.',
  },
]

export const Route = createFileRoute('/_public/como-adoptar')({
  head: () => ({
    meta: pageMeta(
      'Cómo adoptar | Funpabia',
      'Requisitos y pasos para adoptar un perro o un gato de Funpabia en Cipolletti.',
    ),
  }),
  component: HowToAdopt,
})

function HowToAdopt() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:pt-14">
      <PageIntro title="Cómo adoptar">
        <p>
          Adoptar es para toda la vida del animal, que puede ser de quince años. Por eso preguntamos
          bastante antes.
        </p>
      </PageIntro>

      <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <section aria-labelledby="pasos">
          <h2 id="pasos" className="font-heading text-3xl font-bold">
            Los pasos
          </h2>
          <ol className="mt-6 flex flex-col">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative flex gap-5 pb-8 last:pb-0">
                <span
                  aria-hidden="true"
                  className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full bg-teal-900 font-heading text-xl font-bold text-white"
                >
                  {index + 1}
                </span>
                {index < STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-11 bottom-0 left-[1.3rem] w-0.5 bg-line"
                  />
                ) : null}
                <div className="pt-1.5">
                  <h3 className="font-heading text-xl font-bold">{step.title}</h3>
                  <p className="mt-1 max-w-[52ch] text-ink-2">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="requisitos" className="self-start rounded-lg bg-muted p-6 sm:p-8">
          <h2 id="requisitos" className="font-heading text-3xl font-bold">
            Qué pedimos
          </h2>
          <ul className="mt-5 flex flex-col gap-3">
            {REQUIREMENTS.map((requirement) => (
              <li key={requirement} className="flex gap-3">
                <Check className="mt-1 size-5 shrink-0 text-teal-700" aria-hidden="true" />
                <span>{requirement}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-ink-2">
            ¿No cumplís alguno? Podés ayudar igual:{' '}
            <Link
              to="/transito"
              className="font-semibold text-primary underline underline-offset-4"
            >
              siendo tránsito
            </Link>
            ,{' '}
            <Link to="/dona" className="font-semibold text-primary underline underline-offset-4">
              donando
            </Link>{' '}
            o compartiendo las fichas.
          </p>
          <Button asChild className="mt-6 h-12 w-full px-6 text-base font-bold sm:w-auto">
            <Link to="/adopta">Ver animales en adopción</Link>
          </Button>
        </section>
      </div>
    </div>
  )
}
