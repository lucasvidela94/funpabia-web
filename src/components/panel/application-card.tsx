import { Link } from '@tanstack/react-router'
import { PawPrint } from 'lucide-react'
import type { ApplicationSummary } from '@/lib/applications'
import { formatAge } from '@/lib/format'
import { PrescreenBadge, StageBadge, TypeBadge } from './application-badges'

// One request on the board or the list: who, for which animal, how long it has waited.
export function ApplicationCard({
  application,
  showStage,
}: {
  application: ApplicationSummary
  showStage: boolean
}) {
  return (
    <Link
      to="/panel/solicitudes/$applicationId"
      params={{ applicationId: application.id }}
      className="flex gap-3 rounded-md border bg-card p-3 transition-colors hover:border-teal-700"
    >
      {application.photo ? (
        <img
          src={application.photo.thumbnail}
          alt=""
          className="size-12 shrink-0 rounded-md bg-sand object-cover"
        />
      ) : (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-sand text-gray-500">
          <PawPrint className="size-5" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{application.person}</span>
        <span className="block truncate text-sm text-ink-2">
          {application.animal ? `Por ${application.animal}` : 'Sin animal elegido'}
          {application.city ? `, ${application.city}` : ''}
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-1.5">
          {showStage ? <StageBadge stage={application.stage} /> : null}
          <TypeBadge type={application.type} />
          <PrescreenBadge result={application.prescreen} />
          <span className="text-xs text-muted-foreground">{formatAge(application.createdAt)}</span>
        </span>
      </span>
    </Link>
  )
}
