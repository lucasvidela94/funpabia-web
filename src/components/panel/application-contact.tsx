import { Mail, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import type { ApplicationDetail } from '@/lib/applications'
import { whatsAppUrl } from '@/lib/phone'
import { cn } from '@/lib/utils'

// Spec 6.4: "Escribir por WhatsApp" opens wa.me with the message already written. The committee
// picks which one; the text can still be edited in WhatsApp before sending.

function templates(detail: ApplicationDetail) {
  const name = detail.person.firstName
  const animal = detail.animal?.name

  const what =
    detail.type === 'adoption' ? `adoptar${animal ? ` a ${animal}` : ''}` : 'ser tránsito'

  return [
    {
      id: 'hello',
      label: 'Primer contacto',
      text: `Hola ${name}, te escribimos de Funpabia por tu solicitud para ${what}. ¡Gracias por escribirnos!`,
    },
    {
      id: 'photos',
      label: 'Pedir fotos del lugar',
      text: `Hola ${name}, somos de Funpabia. Para seguir con tu solicitud para ${what}, ¿nos podés mandar fotos o un video corto del lugar donde viviría?`,
    },
    {
      id: 'interview',
      label: 'Coordinar la charla',
      text: `Hola ${name}, ¡tu solicitud para ${what} avanza! ¿Qué día y horario te quedan bien para una charla o una visita?`,
    },
    {
      id: 'taken',
      label: 'Ya encontró familia',
      text: `Hola ${name}, gracias de corazón por tu solicitud${animal ? ` para ${animal}` : ''}. Ya encontró familia, pero hay muchos más esperando: si querés, te contamos quiénes podrían encajar con tu casa.`,
    },
  ]
}

export function ApplicationContact({ detail }: { detail: ApplicationDetail }) {
  const options = templates(detail)
  const [chosen, setChosen] = useState(options[0].id)
  const message = options.find((option) => option.id === chosen) ?? options[0]
  const { person } = detail

  return (
    <section aria-labelledby="contacto" className="rounded-lg border bg-card p-5">
      <h2 id="contacto" className="font-heading text-xl font-bold">
        {person.name}
      </h2>
      <p className="text-ink-2">{person.city ?? 'Sin localidad'}</p>

      {person.whatsapp ? (
        <>
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold">Mensaje</legend>
            <div className="flex flex-wrap gap-2">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={option.id === chosen}
                  onClick={() => setChosen(option.id)}
                  className={cn(
                    'inline-flex h-11 items-center rounded-pill border px-3 text-sm font-semibold',
                    option.id === chosen
                      ? 'border-teal-900 bg-teal-900 text-white'
                      : 'border-input bg-card hover:border-teal-700',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="mt-3 rounded-md bg-muted p-3 text-sm text-ink-2">{message.text}</p>
          <a
            href={whatsAppUrl(person.whatsapp, message.text)}
            target="_blank"
            rel="noopener"
            className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 font-bold text-primary-foreground hover:bg-teal-900 sm:w-auto"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            Escribir por WhatsApp
          </a>
          <p className="mt-2 text-sm text-muted-foreground">{person.whatsapp}</p>
        </>
      ) : (
        <p className="mt-3 text-ink-2">No dejó WhatsApp.</p>
      )}

      {person.email ? (
        <a
          href={`mailto:${person.email}`}
          className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4"
        >
          <Mail className="size-4" aria-hidden="true" />
          {person.email}
        </a>
      ) : null}
    </section>
  )
}
