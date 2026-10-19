import { MapPin, Trash2 } from 'lucide-react'
import { AnimalPhoto } from '@/components/shared/animal-photo'
import { ConfirmButton } from '@/components/shared/confirm-dialog'
import { KindTag } from '@/components/shared/kind-tag'
import { Button } from '@/components/ui/button'
import { formatAge, formatDate } from '@/lib/format'
import {
  REPORT_SEX_LABEL,
  REPORT_SIZE_LABEL,
  REPORT_SPECIES_LABEL,
  REPORT_STATUS_LABEL,
  deleteReport,
  moderateReport,
  type PanelReport,
  type ReportStatus,
} from '@/lib/lost-found'
import { whatsAppUrl } from '@/lib/phone'
import { useAction } from './use-action'

// What the committee can do with a report from each status. Approving publishes it; hiding takes
// it down; "reencontrado" closes it as a happy ending.
const ACTIONS: Record<ReportStatus, { label: string; to: ReportStatus }[]> = {
  pending: [
    { label: 'Aprobar y publicar', to: 'active' },
    { label: 'Ocultar', to: 'hidden' },
  ],
  active: [
    { label: 'Marcar reencontrado', to: 'reunited' },
    { label: 'Ocultar', to: 'hidden' },
  ],
  reunited: [{ label: 'Volver a publicar', to: 'active' }],
  hidden: [{ label: 'Publicar', to: 'active' }],
}

export function ReportRow({ report }: { report: PanelReport }) {
  const action = useAction()

  const status = report.expired ? 'Vencido' : REPORT_STATUS_LABEL[report.status]

  return (
    <article className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row">
      <AnimalPhoto
        photo={report.photo}
        species={report.species}
        sizes="128px"
        className="aspect-square w-full shrink-0 rounded-md sm:size-32"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <KindTag kind={report.kind} />
          <span className="rounded-pill border px-3 py-1 text-sm font-semibold">{status}</span>
          <span className="text-sm text-muted-foreground">
            Cargado {formatAge(report.createdAt)}
          </span>
        </div>

        <h2 className="mt-2 font-heading text-xl font-bold">
          {REPORT_SPECIES_LABEL[report.species]} {report.color.toLowerCase()}
        </h2>
        <p className="text-sm text-ink-2">
          {REPORT_SIZE_LABEL[report.size]}, {REPORT_SEX_LABEL[report.sex].toLowerCase()},{' '}
          {formatDate(report.eventOn)}
          {report.marks ? `, ${report.marks}` : ''}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-2">
          <MapPin className="size-4" aria-hidden="true" />
          {report.zoneName}
        </p>
        <p className="mt-2 max-w-[70ch]">{report.description}</p>
        <p className="mt-2 text-sm">
          <a
            href={whatsAppUrl(
              report.contact.phone,
              `Hola ${report.contact.name}, te escribo de Funpabia.`,
            )}
            rel="noopener"
            className="font-semibold text-primary underline underline-offset-4"
          >
            {report.contact.name}, {report.contact.phone}
          </a>
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {ACTIONS[report.status].map((option) => (
            <Button
              key={option.to}
              type="button"
              variant={option.to === 'active' ? 'default' : 'outline'}
              disabled={action.pending}
              className="h-11 px-4 font-semibold"
              onClick={() =>
                action.run(() => moderateReport({ data: { id: report.id, status: option.to } }))
              }
            >
              {option.label}
            </Button>
          ))}
          <ConfirmButton
            variant="ghost"
            disabled={action.pending}
            className="h-11 px-4 font-semibold text-lost"
            title="¿Borrar este reporte?"
            description="Se borra con sus fotos. No se puede deshacer."
            confirmLabel="Borrar el reporte"
            destructive
            onConfirm={() => void action.run(() => deleteReport({ data: { id: report.id } }))}
          >
            <Trash2 aria-hidden="true" />
            Borrar
          </ConfirmButton>
        </div>
        {action.error ? (
          <p role="alert" className="mt-2 text-sm font-semibold text-lost">
            {action.error}
          </p>
        ) : null}
      </div>
    </article>
  )
}
