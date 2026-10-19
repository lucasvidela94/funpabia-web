import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { z } from 'zod'
import { focusFirstError } from '@/components/shared/form-fields'
import { Button } from '@/components/ui/button'
import {
  contactSchema,
  evaluatePrescreen,
  motivationSchema,
  prescreenSchema,
  submitApplication,
  type ApplicationType,
} from '@/lib/applications'
import { useDraft, type Draft } from './application-draft'
import { Excluded, Sent } from './application-outcomes'
import { ContactStep, MotivationStep, PrescreenStep } from './application-steps'

const STEPS = ['Antes de empezar', 'Tus datos', 'Por qué'] as const

type Screen =
  | { kind: 'step'; index: number }
  | { kind: 'excluded'; reasons: string[] }
  | { kind: 'sent' }

type FieldErrors = Partial<Record<string, string>>

function fieldErrors(error: z.ZodError): FieldErrors {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path.at(0)), issue.message]))
}

// "Otra" localidad is typed in a separate field; the schema only knows `city`.
function prescreenInput(draft: Draft) {
  const { cityOther, ...rest } = draft.prescreen

  return { ...rest, city: rest.city === 'Otra' ? cityOther : rest.city }
}

export function ApplicationForm({
  type,
  animal,
}: {
  type: ApplicationType
  animal?: { slug: string; name: string }
}) {
  const { draft, hasDraft, update, clear } = useDraft(type)
  const [screen, setScreen] = useState<Screen>({ kind: 'step', index: 0 })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [rejections, setRejections] = useState(0)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const top = useRef<HTMLDivElement>(null)

  // Focus moves to the first error once the errors are on screen, only after a "Seguir" that
  // failed: fixing a field clears its error without pulling the focus away.
  useEffect(() => {
    if (rejections > 0) {
      focusFirstError(top.current)
    }
  }, [rejections])

  function reject(found: FieldErrors) {
    setErrors(found)
    setRejections((count) => count + 1)
  }

  function discardDraft() {
    clear()
    go({ kind: 'step', index: 0 })
  }

  // Answering a field clears its error; the others stay until the next "Seguir".
  function clearChanged<T extends object>(before: T, after: T) {
    const previous = new Map(Object.entries(before))

    const changed = Object.entries(after).flatMap(([key, value]) =>
      previous.get(key) === value ? [] : [key],
    )

    if (changed.length > 0) {
      setErrors((current) =>
        Object.fromEntries(Object.entries(current).filter(([key]) => !changed.includes(key))),
      )
    }
  }

  function go(next: Screen) {
    setErrors({})
    setScreen(next)
    top.current?.scrollIntoView({ block: 'start' })
    top.current?.focus()
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (screen.kind !== 'step') {
      return
    }

    if (screen.index === 0) {
      const result = prescreenSchema.safeParse(prescreenInput(draft))

      if (!result.success) {
        const found = fieldErrors(result.error)
        reject(draft.prescreen.city === 'Otra' ? { ...found, cityOther: found.city } : found)

        return
      }

      const verdict = evaluatePrescreen(result.data, type)
      go(
        verdict.result === 'ineligible'
          ? { kind: 'excluded', reasons: verdict.reasons }
          : { kind: 'step', index: 1 },
      )

      return
    }

    if (screen.index === 1) {
      const result = contactSchema.safeParse({ email: '', ...draft.contact })

      if (result.success) {
        go({ kind: 'step', index: 2 })
      } else {
        reject(fieldErrors(result.error))
      }

      return
    }

    await send(new FormData(event.currentTarget).get('website'))
  }

  async function send(honeypot: FormDataEntryValue | null) {
    const prescreen = prescreenSchema.safeParse(prescreenInput(draft))
    const contact = contactSchema.safeParse({ email: '', ...draft.contact })
    const motivation = motivationSchema.safeParse({ experience: '', ...draft.motivation })

    if (!motivation.success) {
      reject(fieldErrors(motivation.error))

      return
    }

    if (!prescreen.success || !contact.success) {
      go({ kind: 'step', index: prescreen.success ? 1 : 0 })

      return
    }

    setSending(true)
    setSendError(null)

    try {
      const website = String(honeypot ?? '')

      const outcome = await submitApplication({
        data: {
          type,
          animalSlug: animal?.slug,
          prescreen: prescreen.data,
          contact: contact.data,
          motivation: motivation.data,
          website,
        },
      })

      if (outcome.limited) {
        setSendError(
          'Recibimos varias solicitudes desde tu conexión en la última hora. Probá de nuevo más tarde o escribinos por WhatsApp: lo que escribiste quedó guardado.',
        )

        return
      }

      clear()
      go({ kind: 'sent' })
    } catch {
      setSendError(
        'No pudimos enviar la solicitud. Revisá tu conexión y probá de nuevo: lo que escribiste quedó guardado.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div ref={top} tabIndex={-1} className="scroll-mt-24 outline-none">
      {screen.kind === 'excluded' ? (
        <Excluded
          type={type}
          reasons={screen.reasons}
          onBack={() => go({ kind: 'step', index: 0 })}
        />
      ) : screen.kind === 'sent' ? (
        <Sent animalName={animal?.name} />
      ) : (
        <form
          onSubmit={onSubmit}
          noValidate
          className="rounded-lg border bg-card p-5 shadow-card sm:p-8"
        >
          <Progress index={screen.index} />
          <h2 className="mt-6 font-heading text-3xl font-bold">{STEPS[screen.index]}</h2>
          {screen.index === 0 ? (
            <p className="mt-2 text-ink-2">
              Son las preguntas que siempre hacemos. Si algo no encaja, te lo decimos ahora.
            </p>
          ) : null}

          <div className="mt-6">
            {screen.index === 0 ? (
              <PrescreenStep
                type={type}
                values={draft.prescreen}
                errors={errors}
                onChange={(prescreen) => {
                  clearChanged(draft.prescreen, prescreen)
                  update({ ...draft, prescreen })
                }}
              />
            ) : screen.index === 1 ? (
              <ContactStep
                values={draft.contact}
                errors={errors}
                onChange={(contact) => {
                  clearChanged(draft.contact, contact)
                  update({ ...draft, contact })
                }}
              />
            ) : (
              <MotivationStep
                type={type}
                values={draft.motivation}
                errors={errors}
                onChange={(motivation) => {
                  clearChanged(draft.motivation, motivation)
                  update({ ...draft, motivation })
                }}
              />
            )}
          </div>

          <div aria-hidden="true" className="absolute -left-[9999px]">
            <label>
              No completar
              <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>

          {Object.keys(errors).length > 0 ? (
            <p role="alert" className="mt-6 font-semibold text-lost">
              Revisá los campos marcados.
            </p>
          ) : null}
          {sendError ? (
            <p role="alert" className="mt-6 font-semibold text-lost">
              {sendError}
            </p>
          ) : null}

          {hasDraft ? (
            <p className="mt-6 text-sm text-ink-2">
              Lo que escribís queda guardado en este dispositivo por 7 días.{' '}
              <button
                type="button"
                onClick={discardDraft}
                className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
              >
                Borrar lo que escribí
              </button>
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
            {screen.index > 0 ? (
              <Button
                type="button"
                variant="ghost"
                className="h-12 px-4 text-base"
                onClick={() => go({ kind: 'step', index: screen.index - 1 })}
              >
                Volver
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={sending} className="h-12 px-8 text-base font-bold">
              {screen.index < 2 ? 'Seguir' : sending ? 'Enviando…' : 'Enviar solicitud'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function Progress({ index }: { index: number }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink-2">
        Paso {index + 1} de {STEPS.length}
      </p>
      <ol className="mt-2 grid grid-cols-3 gap-1.5" aria-label="Progreso">
        {STEPS.map((step, position) => (
          <li key={step} className="flex flex-col gap-1.5">
            <span
              className={
                position <= index ? 'h-1.5 rounded-pill bg-teal-700' : 'h-1.5 rounded-pill bg-sand'
              }
            />
            <span
              className={
                position === index ? 'text-xs font-semibold' : 'text-xs text-muted-foreground'
              }
            >
              {step}
              {position < index ? <span className="sr-only"> (completo)</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
