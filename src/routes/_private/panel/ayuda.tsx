import { Link, createFileRoute } from '@tanstack/react-router'
import { PanelHeader } from '@/components/panel/panel-page'
import { guidesForRole } from '@/lib/help'

// How-to guides by task (src/lib/help). Each screen's "Cómo se hace" link opens its guide here
// (#slug). Editors only see the guides for what they can open.
export const Route = createFileRoute('/_private/panel/ayuda')({ component: Help })

function Help() {
  const { isAdmin } = Route.useRouteContext()
  const guides = guidesForRole(isAdmin)

  return (
    <div className="max-w-3xl">
      <PanelHeader
        title="Ayuda"
        description="Cómo se hace cada cosa del panel, en pocos pasos. Cada guía termina en la pantalla donde se hace."
      />

      <nav aria-labelledby="guias" className="mt-6 rounded-lg border bg-card p-5">
        <h2 id="guias" className="font-heading text-lg font-bold">
          Qué querés hacer
        </h2>
        <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
          {guides.map((guide) => (
            <li key={guide.slug}>
              <a
                href={`#${guide.slug}`}
                className="flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
              >
                {guide.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 flex flex-col gap-6">
        {guides.map((guide) => (
          <section
            key={guide.slug}
            id={guide.slug}
            aria-labelledby={`${guide.slug}-titulo`}
            className="scroll-mt-24 rounded-lg border bg-card p-5 target:border-teal-700 target:ring-2 target:ring-teal-100"
          >
            <h2 id={`${guide.slug}-titulo`} className="font-heading text-xl font-bold">
              {guide.title}
            </h2>
            <ol className="mt-3 flex flex-col gap-2.5">
              {guide.steps.map((step, index) => (
                <li key={step} className="grid grid-cols-[1.75rem_1fr] gap-2">
                  <span
                    aria-hidden="true"
                    className="flex size-7 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-900 tabular-nums"
                  >
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-ink">{step}</span>
                </li>
              ))}
            </ol>
            <Link
              to={guide.action.to}
              className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-4 font-bold text-primary-foreground hover:bg-teal-900"
            >
              {guide.action.label}
            </Link>
          </section>
        ))}
      </div>

      <p className="mt-8 text-ink-2">
        ¿Algo no está acá o no funciona como dice? Avisale a quien mantiene el panel, desde{' '}
        <Link to="/preguntas" className="font-semibold text-primary underline underline-offset-4">
          Preguntas frecuentes
        </Link>{' '}
        está el contacto.
      </p>
    </div>
  )
}
