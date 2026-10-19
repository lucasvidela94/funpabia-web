import { Link } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { REPORT_SIZE_LABEL, REPORT_SPECIES_LABEL, type ReportSummary } from '@/lib/lost-found'
import { AnimalPhoto } from '../shared/animal-photo'
import { KindTag } from '../shared/kind-tag'

// One report in the list: photo, what it is, where and when. The whole card opens the report.
export function ReportCard({ report }: { report: ReportSummary }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg bg-card shadow-card">
      <div className="relative">
        <AnimalPhoto
          photo={report.photo}
          species={report.species}
          sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 80vw"
          className="aspect-square w-full"
        />
        <div className="absolute top-3 left-3">
          <KindTag kind={report.kind} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-heading text-xl font-bold tracking-tight">
          <Link
            to="/perdidos/$reportId"
            params={{ reportId: report.id }}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {REPORT_SPECIES_LABEL[report.species]} {report.color.toLowerCase()}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {REPORT_SIZE_LABEL[report.size]}, {formatDate(report.eventOn)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-2">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          {report.zone.name}
        </p>
      </div>
    </article>
  )
}
