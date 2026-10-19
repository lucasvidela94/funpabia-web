import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { ApplicationAnswers } from '@/components/panel/application-answers'
import { PrescreenBadge, TypeBadge } from '@/components/panel/application-badges'
import { ApplicationContact } from '@/components/panel/application-contact'
import { ApplicationAnimal, ApplicationNotes } from '@/components/panel/application-side'
import { ApplicationStagePanel } from '@/components/panel/application-stage-panel'
import { getApplication } from '@/lib/applications'
import { formatAge, formatDate } from '@/lib/format'

export const Route = createFileRoute('/_private/panel/_admin/solicitudes/$applicationId')({
  loader: ({ params }) => getApplication({ data: { id: params.applicationId } }),
  component: ApplicationPage,
  notFoundComponent: () => (
    <div>
      <h1 className="font-heading text-3xl font-bold">Esta solicitud no existe</h1>
      <Link
        to="/panel/solicitudes"
        className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline"
      >
        Volver a las solicitudes
      </Link>
    </div>
  ),
})

function ApplicationPage() {
  const detail = Route.useLoaderData()

  return (
    <div>
      <Link
        to="/panel/solicitudes"
        className="mb-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Solicitudes
      </Link>
      <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        {detail.person.name}
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-2">
        <TypeBadge type={detail.type} />
        <PrescreenBadge result={detail.prescreen} />
        <span>
          Llegó el {formatDate(detail.createdAt)} ({formatAge(detail.createdAt)})
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <div className="order-2 flex flex-col gap-6 lg:order-1">
          <ApplicationAnswers answers={detail.answers} />
          <ApplicationNotes key={detail.id} detail={detail} />
        </div>
        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <ApplicationContact detail={detail} />
          <ApplicationStagePanel detail={detail} />
          <ApplicationAnimal detail={detail} />
        </div>
      </div>
    </div>
  )
}
