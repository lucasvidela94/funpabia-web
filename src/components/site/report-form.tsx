import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  CheckboxField,
  ChoiceField,
  TextAreaField,
  TextField,
  focusFirstError,
} from '@/components/shared/form-fields'
import { PhotoPicker } from '@/components/shared/photo-picker'
import { usePhotoUploads } from '@/components/shared/photo-uploads'
import { Button } from '@/components/ui/button'
import { todayCalendar } from '@/lib/format'
import {
  MAX_REPORT_PHOTOS,
  REPORT_SEX_LABEL,
  REPORT_SIZE_LABEL,
  REPORT_SPECIES_LABEL,
  reportInputSchema,
  submitReport,
  type ReportKind,
} from '@/lib/lost-found'

// Spec 6.6 and 8.2: a report in one page and about a minute, no account. The photos upload as they
// are picked; the report waits for the committee before it is public.

type Values = {
  species?: string
  sex?: string
  size?: string
  color: string
  marks: string
  eventOn: string
  description: string
  zone?: string
  contactName: string
  contactPhone: string
  consent: boolean
}

const EMPTY: Values = {
  color: '',
  marks: '',
  eventOn: '',
  description: '',
  contactName: '',
  contactPhone: '',
  consent: false,
}

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }))

// The owner's edit link, built when the report is sent (the browser knows its own origin).
type Done = { link: string }

export function ReportForm({
  kind,
  zones,
}: {
  kind: ReportKind
  zones: { slug: string; name: string }[]
}) {
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [rejections, setRejections] = useState(0)
  const [pending, setPending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [done, setDone] = useState<Done | null>(null)
  const uploads = usePhotoUploads(MAX_REPORT_PHOTOS, 'reports')
  const form = useRef<HTMLFormElement>(null)

  // Focus goes to the first error once it is on screen, only after a failed send.
  useEffect(() => {
    if (rejections > 0) {
      focusFirstError(form.current)
    }
  }, [rejections])

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([k]) => k !== key)))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (uploads.busy) {
      setSendError('Esperá a que terminen de subir las fotos.')

      return
    }

    const parsed = reportInputSchema.safeParse({
      ...values,
      kind,
      photos: uploads.uploaded,
      website: String(new FormData(event.currentTarget).get('website') ?? ''),
    })

    if (!parsed.success) {
      setErrors(
        Object.fromEntries(parsed.error.issues.map((i) => [String(i.path.at(0)), i.message])),
      )
      setRejections((count) => count + 1)

      return
    }

    setPending(true)
    setSendError(null)

    try {
      const outcome = await submitReport({ data: parsed.data })

      if (outcome.status === 'limited') {
        setSendError('Mandaste varios reportes seguidos. Probá de nuevo en un rato.')

        return
      }

      setDone({
        link: `${window.location.origin}/perdidos/${outcome.id}?token=${outcome.token}`,
      })
    } catch (caught) {
      setSendError(
        caught instanceof Error
          ? caught.message
          : 'No pudimos enviar el reporte. Revisá tu conexión y probá de nuevo.',
      )
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return <Sent kind={kind} done={done} />
  }

  return (
    <form
      ref={form}
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-6 rounded-lg border bg-card p-5 shadow-card sm:p-8"
    >
      <div>
        <p className="mb-2 font-semibold">Fotos</p>
        <PhotoPicker
          photos={uploads.photos}
          room={uploads.room}
          onAdd={uploads.add}
          onRemove={uploads.remove}
          onMakeFirst={uploads.makeFirst}
          onRetry={uploads.retry}
          camera
          error={errors.photos ?? uploads.notice ?? undefined}
        />
      </div>

      <ChoiceField
        legend="Especie"
        name="species"
        options={toOptions(REPORT_SPECIES_LABEL)}
        value={values.species}
        onChange={(value) => set('species', value)}
        error={errors.species}
      />
      <ChoiceField
        legend="Tamaño"
        name="size"
        options={toOptions(REPORT_SIZE_LABEL)}
        value={values.size}
        onChange={(value) => set('size', value)}
        error={errors.size}
      />
      <ChoiceField
        legend="Sexo"
        name="sex"
        options={toOptions(REPORT_SEX_LABEL)}
        value={values.sex}
        onChange={(value) => set('sex', value)}
        error={errors.sex}
      />
      <TextField
        label="Color"
        hint="Por ejemplo: marrón con manchas blancas."
        value={values.color}
        onChange={(event) => set('color', event.target.value)}
        error={errors.color}
      />
      <TextField
        label="Collar, chapita u otra seña (opcional)"
        value={values.marks}
        onChange={(event) => set('marks', event.target.value)}
        error={errors.marks}
      />
      <TextField
        label={kind === 'lost' ? '¿Cuándo se perdió?' : '¿Cuándo lo encontraste?'}
        type="date"
        max={todayCalendar()}
        value={values.eventOn}
        onChange={(event) => set('eventOn', event.target.value)}
        error={errors.eventOn}
      />
      <ChoiceField
        legend="Zona"
        name="zone"
        options={zones.map((zone) => ({ value: zone.slug, label: zone.name }))}
        value={values.zone}
        onChange={(value) => set('zone', value)}
        error={errors.zone}
      />
      <TextAreaField
        label="Contanos cómo es y qué pasó"
        hint="No pongas tu dirección: mostramos solo la zona."
        value={values.description}
        onChange={(event) => set('description', event.target.value)}
        error={errors.description}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Tu nombre"
          autoComplete="given-name"
          value={values.contactName}
          onChange={(event) => set('contactName', event.target.value)}
          error={errors.contactName}
        />
        <TextField
          label="Tu WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={values.contactPhone}
          onChange={(event) => set('contactPhone', event.target.value)}
          error={errors.contactPhone}
        />
      </div>

      <CheckboxField
        checked={values.consent}
        onChange={(checked) => set('consent', checked)}
        error={errors.consent}
      >
        Acepto que mi nombre y mi WhatsApp se publiquen en este reporte, para que me puedan
        contactar. Más en la{' '}
        <Link to="/privacidad" className="font-semibold text-primary underline">
          política de privacidad
        </Link>
        .
      </CheckboxField>

      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>
          No completar
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {Object.keys(errors).length > 0 ? (
        <p role="alert" className="font-semibold text-lost">
          Revisá los campos marcados.
        </p>
      ) : null}
      {sendError ? (
        <p role="alert" className="font-semibold text-lost">
          {sendError}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="h-12 self-start px-8 text-base font-bold">
        {pending ? 'Enviando…' : 'Enviar reporte'}
      </Button>
    </form>
  )
}

// The edit link is the only way back to the report before the committee approves it, and the
// owner's way to close it later: it is shown once and never stored in the clear.
function Sent({ kind, done }: { kind: ReportKind; done: Done }) {
  return (
    <section role="status" className="rounded-lg border bg-card p-6 shadow-card sm:p-8">
      <h2 className="font-heading text-3xl font-bold">Recibimos tu reporte</h2>
      <p className="mt-3 text-lg">
        Lo revisamos y lo publicamos apenas podamos. Somos voluntarias, así que puede tardar un
        poco.
      </p>
      <p className="mt-4 font-semibold">
        Guardá este link: con él{' '}
        {kind === 'lost' ? 'avisás que lo encontraste' : 'cerrás el reporte'} cuando se resuelva. No
        lo vamos a poder mostrar de nuevo.
      </p>
      <p className="mt-2 rounded-md border bg-muted p-3 font-mono text-sm break-all">{done.link}</p>
      <Link
        to="/perdidos"
        className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
      >
        Ver los reportes publicados
      </Link>
    </section>
  )
}
