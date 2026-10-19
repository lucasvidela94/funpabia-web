import { Link, createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { PageIntro } from '@/components/site/page-intro'
import { PRIVACY_POLICY_VERSION } from '@/lib/applications'
import { pageMeta } from '@/lib/seo'

// Draft policy under Ley 25.326 (spec section 9). The foundation and, ideally, a lawyer must approve
// it before launch; whether the database is registered with the AAIP is still open. Changing the
// text means bumping PRIVACY_POLICY_VERSION, which every new consent stores.

export const Route = createFileRoute('/_public/privacidad')({
  head: () => ({
    meta: pageMeta(
      'Política de privacidad | Funpabia',
      'Qué datos pedimos al adoptar o ser tránsito, para qué los usamos, cuánto los guardamos y cómo pedir la baja.',
    ),
  }),
  component: Privacy,
})

function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:pt-14">
      <PageIntro title="Política de privacidad">
        <p>Qué datos pedimos, para qué los usamos y cómo podés pedir que los borremos.</p>
      </PageIntro>

      <div className="mt-10 flex flex-col gap-8 text-lg">
        <Section title="Qué datos pedimos">
          <p>
            Solo los necesarios. Para una solicitud de adopción o tránsito: nombre, WhatsApp, email,
            localidad, cómo es tu casa y quiénes viven en ella. Para un reporte, una forma de
            contactarte. El DNI lo pedimos únicamente al firmar un contrato de adopción.
          </p>
        </Section>
        <Section title="Para qué los usamos">
          <p>
            Para evaluar tu solicitud, escribirte y hacer el seguimiento de la adopción. No los
            vendemos, no los compartimos con terceros y no los usamos para publicidad.
          </p>
        </Section>
        <Section title="Qué nunca publicamos">
          <p>
            Direcciones exactas: ni la tuya, ni la del refugio, ni la de los tránsitos. Tampoco
            quién dona, salvo que nos pidas figurar con tu nombre. Las fotos con personas se
            publican solo con su permiso.
          </p>
        </Section>
        <Section title="Perdidos y encontrados">
          <p>
            Cuando reportás un animal perdido o encontrado, publicamos tu nombre y tu WhatsApp en
            ese reporte, para que te puedan contactar, y solo si lo aceptás al enviarlo. Del lugar
            mostramos la zona, nunca la dirección. El reporte se revisa antes de publicarse y deja
            de verse a los 60 días o cuando se resuelve.
          </p>
        </Section>
        <Section title="Tus derechos">
          <p>
            Según la Ley 25.326 de Protección de Datos Personales, podés pedirnos ver, corregir o
            borrar tus datos en cualquier momento. Escribinos desde{' '}
            <Link
              to="/contacto"
              className="font-semibold text-primary underline underline-offset-4"
            >
              contacto
            </Link>{' '}
            y lo hacemos.
          </p>
        </Section>
        <p className="text-sm text-muted-foreground">Versión {PRIVACY_POLICY_VERSION}.</p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-heading text-2xl font-bold">{title}</h2>
      <div className="mt-2 text-ink-2">{children}</div>
    </section>
  )
}
