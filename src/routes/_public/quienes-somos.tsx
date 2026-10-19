import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '@/components/site/page-intro'
import { Button } from '@/components/ui/button'
import { pageMeta } from '@/lib/seo'

// Facts from the foundation's public posts and press notes (spec section 2). The shelter's exact
// location is never published (spec 9, privacy).

const FACTS = [
  { value: '2016', text: 'Desde ese año el refugio funciona en una chacra cedida en comodato.' },
  // No count of dogs: the figures in the press are from 2019 and nobody has confirmed a current
  // one. Put a number back only with the foundation's OK and the year next to it.
  {
    value: 'Decenas',
    text: 'de perros viven en el refugio, y más esperan en hogares de tránsito.',
  },
  {
    value: '230',
    text: 'adopciones en 2025, con 80 rescates y 342 animales atendidos por la veterinaria.',
  },
]

export const Route = createFileRoute('/_public/quienes-somos')({
  head: () => ({
    meta: pageMeta(
      'Quiénes somos | Funpabia',
      'La Fundación Patagónica para el Bienestar Animal rescata y da en adopción perros y gatos en Cipolletti.',
    ),
  }),
  component: About,
})

function About() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:pt-14">
      <PageIntro title="Quiénes somos">
        <p>
          FUN.PA.BI.A es la Fundación Patagónica para el Bienestar Animal, de Cipolletti, Río Negro.
          Somos un grupo chico de voluntarias que rescata, cura y busca familia para perros y gatos
          abandonados del Alto Valle.
        </p>
      </PageIntro>

      <dl className="mt-14 grid gap-px overflow-hidden rounded-lg border bg-line sm:grid-cols-3">
        {FACTS.map((fact) => (
          <div key={fact.value} className="bg-card p-6 sm:p-8">
            <dt className="font-heading text-5xl font-bold tracking-tight text-teal-900">
              {fact.value}
            </dt>
            <dd className="mt-2 text-ink-2">{fact.text}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="como">
          <h2 id="como" className="font-heading text-3xl font-bold">
            Cómo trabajamos
          </h2>
          <div className="mt-4 flex max-w-[60ch] flex-col gap-4 text-lg">
            <p>
              Todo lo sostienen las donaciones de vecinos. La mayor parte se va en veterinaria:
              castraciones, vacunas, cirugías y tratamientos de animales que llegan heridos o
              enfermos.
            </p>
            <p>
              Además del refugio, hay perros y gatos en hogares de tránsito, que los cuidan hasta
              que encuentran familia.
            </p>
          </div>
        </section>
        <section aria-labelledby="ayudar" className="self-start rounded-lg bg-muted p-6 sm:p-8">
          <h2 id="ayudar" className="font-heading text-2xl font-bold">
            Formas de ayudar
          </h2>
          <ul className="mt-4 flex flex-col gap-1">
            <li>
              <Link
                to="/adopta"
                className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
              >
                Adoptar
              </Link>
            </li>
            <li>
              <Link
                to="/transito"
                className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
              >
                Ser tránsito
              </Link>
            </li>
            <li>
              <Link
                to="/dona"
                className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
              >
                Donar a una meta
              </Link>
            </li>
          </ul>
          <Button
            asChild
            variant="outline"
            className="mt-4 h-11 border-primary px-5 font-semibold text-primary"
          >
            <Link to="/contacto">Escribirnos</Link>
          </Button>
        </section>
      </div>
    </div>
  )
}
