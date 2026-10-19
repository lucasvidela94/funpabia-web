import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '@/components/site/page-intro'
import { Button } from '@/components/ui/button'
import { pageMeta } from '@/lib/seo'

// Spec 6.4: foster costs are covered by the foundation, as they are today. Details to confirm with
// the foundation (spec section 17, question 3).

const YOU_GIVE = [
  'Un lugar seguro en tu casa, cerrado y sin escapes.',
  'Tiempo para darle de comer, sacarlo y acompañarlo.',
  'Avisarnos cómo está y mandar fotos para su ficha.',
  'Llevarlo a la veterinaria o a una visita cuando haga falta.',
]

const FOUNDATION_GIVES = [
  'La veterinaria: vacunas, castración, tratamientos.',
  'El alimento y lo que necesite.',
  'La búsqueda de una familia definitiva.',
  'Alguien a quien escribirle si tenés dudas.',
]

export const Route = createFileRoute('/_public/transito/')({
  head: () => ({
    meta: pageMeta(
      'Sé tránsito | Funpabia',
      'Hogar de tránsito en Cipolletti: vos das el lugar y el cariño, la fundación cubre los gastos.',
    ),
  }),
  component: Foster,
})

function Foster() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:pt-14">
      <PageIntro title="Sé tránsito">
        <p>
          Un tránsito es una casa donde un animal espera a su familia. Le saca un lugar al refugio y
          le da tiempo para recuperarse. En agosto de 2026 había más de 50 perros y gatos en
          tránsito.
        </p>
      </PageIntro>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <section aria-labelledby="vos" className="rounded-lg border bg-card p-6 sm:p-8">
          <h2 id="vos" className="font-heading text-2xl font-bold">
            Vos ponés
          </h2>
          <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 marker:text-teal-700">
            {YOU_GIVE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section
          aria-labelledby="fundacion"
          className="on-dark rounded-lg bg-teal-900 p-6 text-white sm:p-8"
        >
          <h2 id="fundacion" className="font-heading text-2xl font-bold">
            La fundación pone
          </h2>
          <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 marker:text-yellow-400">
            {FOUNDATION_GIVES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Button asChild className="h-12 px-7 text-base font-bold">
          <Link to="/transito/solicitud">Ofrecer tránsito</Link>
        </Button>
        <p className="text-ink-2">Te escribimos cuando haya un animal que encaje con tu casa.</p>
      </div>
    </div>
  )
}
