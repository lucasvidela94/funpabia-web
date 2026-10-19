import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ApplicationDetail } from '@/lib/applications'

// The visitor's answers, as questions. Answers the pre-screen sends to review are marked with an
// icon and text, so the reason is visible without relying on color.
export function ApplicationAnswers({ answers }: { answers: ApplicationDetail['answers'] }) {
  return (
    <section aria-labelledby="respuestas" className="rounded-lg border bg-card p-5">
      <h2 id="respuestas" className="font-heading text-xl font-bold">
        Respuestas
      </h2>

      <dl className="mt-3 grid gap-x-6 sm:grid-cols-2">
        {answers.prescreen.map((row) => (
          <div key={row.label} className="border-b py-2.5">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd
              className={
                row.flagged
                  ? 'flex items-center gap-1.5 font-semibold text-urgent'
                  : 'font-semibold'
              }
            >
              {row.flagged ? (
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              ) : null}
              {row.value}
              {row.flagged ? <span className="sr-only">(a revisar)</span> : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-col gap-4">
        <Answer label="Quiénes viven en la casa">{answers.household}</Answer>
        <Answer label="Horas por día que estaría solo">{answers.hoursAlone}</Answer>
        <Answer label="Quién lo cuidaría en vacaciones">{answers.vacationCare}</Answer>
        <Answer label="Por qué">{answers.motivation}</Answer>
        <Answer label="Experiencia con animales">{answers.experience}</Answer>
      </div>
    </section>
  )
}

function Answer({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="font-sans text-sm text-muted-foreground">{label}</h3>
      <p className="whitespace-pre-line">
        {children || <span className="text-muted-foreground">Sin respuesta</span>}
      </p>
    </div>
  )
}
