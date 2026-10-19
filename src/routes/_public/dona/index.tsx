import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { DonationAccounts } from '@/components/site/donation-accounts'
import { GoalProgress } from '@/components/shared/goal-progress'
import { PageIntro } from '@/components/site/page-intro'
import { getActiveGoals } from '@/lib/goals'
import { pageMeta } from '@/lib/seo'

const publicLayout = getRouteApi('/_public')

export const Route = createFileRoute('/_public/dona/')({
  loader: () => getActiveGoals(),
  head: () => ({
    meta: pageMeta(
      'Doná | Funpabia',
      'Doná a una meta concreta de Funpabia y mirá cuánto falta. Alias, CBU y Mercado Pago.',
    ),
  }),
  component: Donate,
})

function Donate() {
  const goals = Route.useLoaderData()
  const { donationAccounts } = publicLayout.useLoaderData()

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:pt-14">
      <PageIntro title="Doná a algo concreto">
        <p>
          Cada necesidad grande es una meta: una deuda con la veterinaria, una cirugía, el alimento
          del invierno. Ves cuánto se juntó, cuánto falta y cuándo se actualizó.
        </p>
      </PageIntro>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section aria-labelledby="metas-abiertas">
          <h2 id="metas-abiertas" className="font-heading text-3xl font-bold">
            Metas abiertas
          </h2>
          {goals.length > 0 ? (
            <ul className="mt-6 flex flex-col gap-5">
              {goals.map((goal) => (
                <li key={goal.id}>
                  <GoalProgress goal={goal} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-lg bg-muted p-6 text-ink-2">
              Ahora no hay metas abiertas. Lo que dones va al día a día: alimento, veterinaria y
              traslados.
            </p>
          )}
        </section>

        <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <DonationAccounts accounts={donationAccounts} />
          <p className="px-1 text-sm text-ink-2">
            No publicamos quién dona. Si querés que figure tu nombre en una meta, avisanos cuando
            transfieras.
          </p>
        </div>
      </div>
    </div>
  )
}
