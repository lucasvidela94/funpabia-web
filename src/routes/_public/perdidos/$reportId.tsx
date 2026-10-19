import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft, MapPin, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { ConfirmButton } from '@/components/shared/confirm-dialog'
import { KindTag } from '@/components/shared/kind-tag'
import { PhotoGallery } from '@/components/site/photo-gallery'
import { ShareActions } from '@/components/site/share-actions'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import {
  REPORT_SEX_LABEL,
  REPORT_SIZE_LABEL,
  REPORT_SPECIES_LABEL,
  getReport,
  markReunited,
  type ReportDetail,
} from '@/lib/lost-found'
import { whatsAppUrl } from '@/lib/phone'
import { imageMeta, pageMeta, plainText } from '@/lib/seo'

// Spec 6.6: one report, shareable with a preview. The owner arrives here from the edit link
// (?token=...), which adds the button that closes the report.
export const Route = createFileRoute('/_public/perdidos/$reportId')({
  validateSearch: z.object({ token: z.string().max(100).optional().catch(undefined) }),
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: ({ params, deps }) => getReport({ data: { id: params.reportId, token: deps.token } }),
  head: ({ loaderData }) =>
    loaderData
      ? { meta: reportMeta(loaderData) }
      : { meta: [{ title: 'No encontramos este reporte | Funpabia' }] },
  component: Report,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <h1 className="font-heading text-4xl font-bold">No encontramos este reporte</h1>
      <p className="mt-2 text-ink-2">Puede que ya se haya resuelto o que haya vencido.</p>
      <Link
        to="/perdidos"
        className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline"
      >
        Ver los reportes publicados
      </Link>
    </div>
  ),
})

function title(report: ReportDetail) {
  const what = REPORT_SPECIES_LABEL[report.species].toLowerCase()

  return report.kind === 'lost'
    ? `Se perdió un ${what} en ${report.zone.name}`
    : `Encontraron un ${what} en ${report.zone.name}`
}

function reportMeta(report: ReportDetail) {
  const description = plainText(
    `${report.color}, ${REPORT_SIZE_LABEL[report.size].toLowerCase()}. ${report.description}`,
    200,
  )

  const photo = report.photos.at(0)

  return [
    ...pageMeta(`${title(report)} | Funpabia`, description),
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: report.url },
    ...(photo ? imageMeta(`${report.origin}${photo.src}`, photo) : []),
  ]
}

function Report() {
  const report = Route.useLoaderData()
  const { token } = Route.useSearch()
  const reunited = report.status === 'reunited'
  const pending = report.status === 'pending'

  const facts = [
    ['Especie', REPORT_SPECIES_LABEL[report.species]],
    ['Tamaño', REPORT_SIZE_LABEL[report.size]],
    ['Sexo', REPORT_SEX_LABEL[report.sex]],
    ['Color', report.color],
    ...(report.marks ? [['Seña', report.marks]] : []),
    [report.kind === 'lost' ? 'Se perdió' : 'Lo encontraron', formatDate(report.eventOn)],
  ]

  return (
    <article className="mx-auto max-w-6xl px-4 pt-6 pb-20">
      <Link
        to="/perdidos"
        className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Perdidos y encontrados
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <PhotoGallery photos={report.photos} species={report.species} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <KindTag kind={report.kind} />
          <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight text-balance text-teal-900 sm:text-5xl">
            {title(report)}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-lg text-ink-2">
            <MapPin className="size-5" aria-hidden="true" />
            {report.zone.name}
          </p>

          {reunited ? (
            <p className="mt-6 rounded-md border-l-[6px] border-adopted bg-adopted-soft p-4 text-adopted">
              <strong>¡Se reencontraron!</strong> Gracias por compartir.
            </p>
          ) : null}

          {pending ? (
            <p
              role="status"
              className="mt-6 rounded-md border-l-[6px] border-found bg-found-soft p-4 text-found"
            >
              <strong>Tu reporte está en revisión.</strong> La fundación lo revisa antes de
              publicarlo. Guardá este link: cuando se publique, desde acá vas a poder cerrarlo.
            </p>
          ) : null}

          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            {facts.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-semibold text-ink-2">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 max-w-[60ch] text-lg">{report.description}</p>

          {reunited || pending ? null : (
            <div className="mt-8 flex flex-col gap-3">
              <Button asChild className="h-12 px-6 text-base font-bold">
                <a
                  href={whatsAppUrl(
                    report.contact.phone,
                    `Hola ${report.contact.name}, te escribo por el reporte en Funpabia: ${title(report)}.`,
                  )}
                  rel="noopener"
                >
                  <MessageCircle aria-hidden="true" />
                  Escribir a {report.contact.name}
                </a>
              </Button>
              <ShareActions url={report.url} text={`${title(report)}.`} />
            </div>
          )}

          {report.owner === 'valid' && token ? <CloseReport id={report.id} token={token} /> : null}
          {/* A closed or pending report also reads as "invalid" to the token check: say so only
              when neither explains it. */}
          {report.owner === 'invalid' && !reunited && !pending ? (
            <p role="status" className="mt-8 rounded-md border bg-muted p-4 font-semibold">
              Link inválido o ya usado.
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}

// Only reached with the secret in the link: whoever has it can close the report.
function CloseReport({ id, token }: { id: string; token: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  async function close() {
    setPending(true)
    setProblem(null)

    try {
      const { outcome } = await markReunited({ data: { id, token } })

      if (outcome === 'closed') {
        await router.invalidate({ sync: true })
      } else {
        setProblem(
          outcome === 'invalid'
            ? 'Link inválido o ya usado.'
            : 'Hiciste varios intentos seguidos. Probá de nuevo en un rato.',
        )
      }
    } catch {
      setProblem('No pudimos cerrarlo. Revisá tu conexión y probá de nuevo.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section aria-labelledby="cerrar" className="mt-8 rounded-lg border bg-card p-5">
      <h2 id="cerrar" className="font-heading text-xl font-bold">
        Tu reporte
      </h2>
      <p className="mt-1 text-sm text-ink-2">Cuando se resuelva, avisá para cerrarlo.</p>
      <ConfirmButton
        variant="outline"
        disabled={pending}
        className="mt-3 h-11 px-4 font-semibold"
        title="¿Cerrar el reporte?"
        description="Deja de verse en el sitio como activo."
        confirmLabel="Cerrar el reporte"
        onConfirm={() => void close()}
      >
        Ya se resolvió, cerrar el reporte
      </ConfirmButton>
      {problem ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-lost">
          {problem}
        </p>
      ) : null}
    </section>
  )
}
