import { Link } from '@tanstack/react-router'
import { telUrl, whatsAppUrl } from '@/lib/phone'
import type { Contact } from '@/lib/settings'
import { FOOTER_NAV } from './site-nav'

// The footer uses the logo's own black, so the reference JPG sits on it without a visible box.
export function SiteFooter({ contact }: { contact: Contact }) {
  return (
    <footer className="on-dark bg-logo-black text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
        <div className="flex items-start gap-4 md:flex-col">
          <img
            src="/brand/logo-ref.jpg"
            alt="Logo de Funpabia: un gato y un perro abrazados sobre una escarapela"
            width={112}
            height={112}
            loading="lazy"
            className="size-24 md:size-28"
          />
          <p className="max-w-[18rem] text-sm text-gray-300">
            Fundación Patagónica para el Bienestar Animal. Cipolletti, Río Negro.
          </p>
        </div>

        {FOOTER_NAV.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="font-heading text-lg font-semibold">{group.title}</h2>
            <ul className="mt-3 flex flex-col">
              {group.items.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="inline-flex min-h-11 items-center text-gray-300 underline-offset-4 hover:text-white hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-5 text-sm">
          <SocialLinks contact={contact} />
          <Link
            to="/login"
            className="ml-auto inline-flex min-h-11 items-center text-gray-300 hover:text-white"
          >
            Ingresar al panel
          </Link>
        </div>
      </div>
    </footer>
  )
}

function SocialLinks({ contact }: { contact: Contact }) {
  return (
    <>
      {contact.instagram ? (
        <a
          href={`https://www.instagram.com/${contact.instagram}`}
          className="inline-flex min-h-11 items-center font-semibold text-turquoise-500 hover:underline"
          rel="noopener"
        >
          Instagram
        </a>
      ) : null}
      {contact.facebook ? (
        <a
          href={`https://www.facebook.com/${contact.facebook}`}
          className="inline-flex min-h-11 items-center font-semibold text-turquoise-500 hover:underline"
          rel="noopener"
        >
          Facebook
        </a>
      ) : null}
      {contact.whatsapp ? (
        <a
          href={whatsAppUrl(contact.whatsapp, 'Hola Funpabia, les escribo desde la web.')}
          className="inline-flex min-h-11 items-center font-semibold text-turquoise-500 hover:underline"
          rel="noopener"
        >
          WhatsApp
        </a>
      ) : null}
      {contact.phone ? (
        <a
          href={telUrl(contact.phone)}
          className="inline-flex min-h-11 items-center font-semibold text-turquoise-500 hover:underline"
        >
          Teléfono
        </a>
      ) : null}
    </>
  )
}
