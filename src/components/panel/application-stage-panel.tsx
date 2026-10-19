import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  STAGES,
  STAGE_LABEL,
  setApplicationStage,
  type ApplicationDetail,
  type Stage,
} from '@/lib/applications'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { StageBadge } from './application-badges'
import { useAction } from './use-action'

// Spec 6.4: move the request through its stages. Rejecting or withdrawing asks for the reason
// (the database requires it); delivering asks for confirmation because it registers the adoption
// or the foster placement, changes the animal and schedules the follow-ups.

const NEEDS_REASON = new Set<Stage>(['rejected', 'withdrawn'])

function deliverWarning(detail: ApplicationDetail) {
  const animal = detail.animal?.name ?? 'el animal'

  return detail.type === 'adoption'
    ? `Se registra la adopción, ${animal} pasa a "adoptado" y se crean los seguimientos de 7 días, 30 días y 6 meses. No se puede deshacer desde acá.`
    : `Se registra el tránsito y ${animal} pasa a "en tránsito". No se puede deshacer desde acá.`
}

export function ApplicationStagePanel({ detail }: { detail: ApplicationDetail }) {
  const [target, setTarget] = useState<Stage | null>(null)
  const [reason, setReason] = useState('')
  const action = useAction()
  const delivered = detail.stage === 'delivered'

  async function confirm() {
    if (!target) {
      return
    }

    await action.run(() => setApplicationStage({ data: { id: detail.id, stage: target, reason } }))
    setTarget(null)
    setReason('')
  }

  return (
    <section aria-labelledby="etapa" className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="etapa" className="font-heading text-xl font-bold">
          Etapa
        </h2>
        <StageBadge stage={detail.stage} />
      </div>

      {detail.rejectionReason ? (
        <p className="mt-2 text-sm text-ink-2">Motivo: {detail.rejectionReason}</p>
      ) : null}

      {delivered ? (
        <p className="mt-3 text-ink-2">Entregada. El seguimiento sigue en Seguimientos.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {STAGES.filter((stage) => stage !== detail.stage).map((stage) => (
            <button
              key={stage}
              type="button"
              aria-pressed={target === stage}
              onClick={() => setTarget(target === stage ? null : stage)}
              className={cn(
                'inline-flex h-11 items-center rounded-pill border px-4 font-semibold',
                target === stage
                  ? 'border-teal-900 bg-teal-900 text-white'
                  : 'border-input bg-card hover:border-teal-700',
              )}
            >
              {STAGE_LABEL[stage]}
            </button>
          ))}
        </div>
      )}

      {target ? (
        <div className="mt-4 rounded-md bg-muted p-4">
          {NEEDS_REASON.has(target) ? (
            <div>
              <label htmlFor="motivo" className="font-semibold">
                Motivo
              </label>
              <textarea
                id="motivo"
                rows={2}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2"
              />
            </div>
          ) : null}
          {target === 'delivered' ? <p className="text-sm">{deliverWarning(detail)}</p> : null}
          <Button
            type="button"
            className="mt-3 h-11 px-5 font-bold"
            disabled={action.pending || (NEEDS_REASON.has(target) && reason.trim() === '')}
            onClick={confirm}
          >
            {action.pending ? 'Guardando…' : `Pasar a ${STAGE_LABEL[target].toLowerCase()}`}
          </Button>
        </div>
      ) : null}

      {action.error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-lost">
          {action.error}
        </p>
      ) : null}

      {detail.history.length > 0 ? (
        <ol className="mt-5 flex flex-col gap-2 border-t pt-4">
          {detail.history.map((entry) => (
            <li
              key={`${entry.at}-${entry.stage}`}
              className="flex flex-wrap items-center gap-2 text-sm text-ink-2"
            >
              <StageBadge stage={entry.stage} />
              {formatDate(entry.at)}
              {entry.by ? `, ${entry.by}` : ''}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  )
}
