import { Link, createFileRoute, getRouteApi } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { DonationAccounts } from '@/components/site/donation-accounts'
import { GoalProgress } from '@/components/shared/goal-progress'
import { ShareActions } from '@/components/site/share-actions'
import { formatMoney } from '@/lib/format'
import { getGoal } from '@/lib/goals'
import { pageMeta } from '@/lib/seo'

const publicLayout = getRouteApi('/_public')

export const Route = createFileRoute('/_public/dona/$slug')({
  loader: ({ params }) => getGoal({ data: { slug: params.slug } }),
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            ...pageMeta(
              `${loaderData.title} | Funpabia`,
              `Juntamos ${formatMoney(loaderData.raised)} de ${formatMoney(loaderData.target)}. Sumá tu aporte.`,
            ),
            { property: 'og:url', content: loaderData.url },
          ],
        }
      : { meta: [{ title: 'No encontramos esta meta | Funpabia' }] },
  component: GoalPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <h1 className="font-heading text-4xl font-bold">No encontramos esta meta</h1>
      <Link
        to="/dona"
        className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline"
      >
        Ver las metas abiertas
      </Link>
    </div>
  ),
})

function GoalPage() {
  const goal = Route.useLoaderData()
  const { donationAccounts } = publicLayout.useLoaderData()

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-20">
      <Link
        to="/dona"
        className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Todas las metas
      </Link>
      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex flex-col gap-6">
          <GoalProgress goal={goal} headingLevel="h2" />
          {goal.status === 'fulfilled' ? (
            <p className="rounded-md border-l-[6px] border-adopted bg-adopted-soft p-4 text-adopted">
              <strong>¡Meta cumplida!</strong> Gracias a cada persona que aportó.
            </p>
          ) : null}
          <ShareActions url={goal.url} text={`Ayudá a Funpabia: ${goal.title}.`} />
        </div>
        <DonationAccounts accounts={donationAccounts} />
      </div>
    </div>
  )
}
