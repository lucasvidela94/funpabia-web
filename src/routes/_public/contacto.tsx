import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { AtSign, Mail, MessageCircle, Phone, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { PageIntro } from '@/components/site/page-intro'
import { telUrl, whatsAppUrl } from '@/lib/phone'
import { pageMeta } from '@/lib/seo'

const publicLayout = getRouteApi('/_public')

export const Route = createFileRoute('/_public/contacto')({
  head: () => ({
    meta: pageMeta(
      'Contacto | Funpabia',
      'Cómo comunicarte con Funpabia. Para adoptar o ser tránsito, el formulario es lo más rápido.',
    ),
  }),
  component: ContactPage,
})

function ContactPage() {
  const { contact } = publicLayout.useLoaderData()

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 pb-20 sm:pt-14">
      <PageIntro title="Contacto">
        <p>
          Somos voluntarias y respondemos cuando podemos. Para adoptar o ser tránsito, el formulario
          es lo más rápido: nos llega ordenado y no se pierde entre los mensajes.
        </p>
      </PageIntro>

      <ul className="mt-10 flex flex-col divide-y rounded-lg border bg-card">
        {contact.whatsapp ? (
          <Channel
            href={whatsAppUrl(contact.whatsapp, 'Hola Funpabia, les escribo desde la web.')}
            icon={<MessageCircle className="size-6" aria-hidden="true" />}
            label="WhatsApp"
            value={contact.whatsapp}
          />
        ) : null}
        {contact.phone ? (
          <Channel
            href={telUrl(contact.phone)}
            icon={<Phone className="size-6" aria-hidden="true" />}
            label="Teléfono"
            value={contact.phone}
          />
        ) : null}
        {contact.email ? (
          <Channel
            href={`mailto:${contact.email}`}
            icon={<Mail className="size-6" aria-hidden="true" />}
            label="Email"
            value={contact.email}
          />
        ) : null}
        {/* Lucide has no brand marks: the handle sign and the community stand in for the networks. */}
        {contact.instagram ? (
          <Channel
            href={`https://www.instagram.com/${contact.instagram}`}
            icon={<AtSign className="size-6" aria-hidden="true" />}
            label="Instagram"
            value={`@${contact.instagram}`}
          />
        ) : null}
        {contact.facebook ? (
          <Channel
            href={`https://www.facebook.com/${contact.facebook}`}
            icon={<Users className="size-6" aria-hidden="true" />}
            label="Facebook"
            value={contact.facebook}
          />
        ) : null}
      </ul>
    </div>
  )
}

function Channel({
  href,
  icon,
  label,
  value,
}: {
  href: string
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <li>
      <a
        href={href}
        rel="noopener"
        className="flex min-h-16 items-center gap-4 px-5 py-4 hover:bg-muted"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          {icon}
        </span>
        <span>
          <span className="block text-sm text-muted-foreground">{label}</span>
          <span className="block text-lg font-semibold">{value}</span>
        </span>
      </a>
    </li>
  )
}
