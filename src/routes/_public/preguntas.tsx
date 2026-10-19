import { Link, createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { PageIntro } from '@/components/site/page-intro'
import { pageMeta } from '@/lib/seo'

// Frequent questions. The foundation's answers only point at the pages that already explain them,
// so there is one source for each rule. "Sobre este sitio" describes how the site is built and
// where the data lives; keep it in step with AGENTS.md when the stack changes.

const DEVELOPER = {
  github: 'lucasvidela94',
  email: 'lucasan.videla@gmail.com',
}

export const Route = createFileRoute('/_public/preguntas')({
  head: () => ({
    meta: pageMeta(
      'Preguntas frecuentes | Funpabia',
      'Cómo adoptar, ser tránsito, donar o reportar un animal perdido, y cómo está hecho este sitio: tecnología, infraestructura y cuidado de los datos.',
    ),
  }),
  component: Questions,
})

function Questions() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:pt-14">
      <PageIntro title="Preguntas frecuentes">
        <p>Lo que más nos consultan, y cómo está hecho este sitio.</p>
      </PageIntro>

      <section aria-labelledby="fundacion" className="mt-12">
        <h2 id="fundacion" className="font-heading text-3xl font-bold text-teal-900">
          Adoptar y ayudar
        </h2>
        <div className="mt-4 divide-y rounded-lg border bg-card">
          <Question title="¿Cómo adopto?">
            <p>
              Elegís un animal, completás la solicitud y te escribimos por WhatsApp. Los requisitos
              y los pasos están en <PageLink to="/como-adoptar">Cómo adoptar</PageLink>.
            </p>
          </Question>
          <Question title="¿Qué es ser tránsito?">
            <p>
              Cuidar a un animal en tu casa hasta que encuentre familia. La fundación acompaña con
              alimento y veterinaria. Más en <PageLink to="/transito">Sé tránsito</PageLink>.
            </p>
          </Question>
          <Question title="¿A dónde va mi donación?">
            <p>
              A metas concretas, como una deuda veterinaria, con el avance a la vista: cuánto hace
              falta y cuánto se juntó. Están en <PageLink to="/dona">Doná</PageLink>.
            </p>
          </Question>
          <Question title="Perdí a mi mascota, o encontré una. ¿Qué hago?">
            <p>
              Publicá un reporte en <PageLink to="/perdidos">Perdidos y encontrados</PageLink>. Lo
              revisamos antes de publicarlo, mostramos la zona y no la dirección, y deja de verse a
              los 60 días o cuando se resuelve.
            </p>
          </Question>
          <Question title="¿Qué hacen con mis datos?">
            <p>
              Los usamos solo para tu solicitud o tu reporte, y podés pedir que los borremos. El
              detalle está en la <PageLink to="/privacidad">política de privacidad</PageLink>.
            </p>
          </Question>
        </div>
      </section>

      <section aria-labelledby="sitio" className="mt-14">
        <h2 id="sitio" className="font-heading text-3xl font-bold text-teal-900">
          Sobre este sitio
        </h2>
        <div className="mt-4 divide-y rounded-lg border bg-card">
          <Question title="¿Quién lo hizo?">
            <p>
              El sitio y el panel de la fundación los desarrolla{' '}
              <a
                href={`https://github.com/${DEVELOPER.github}`}
                rel="noopener"
                className="font-semibold text-primary underline underline-offset-4"
              >
                {DEVELOPER.github}
              </a>{' '}
              en GitHub. Para consultas sobre el desarrollo, o si querés colaborar, escribí a{' '}
              <a
                href={`mailto:${DEVELOPER.email}`}
                className="font-semibold text-primary underline underline-offset-4"
              >
                {DEVELOPER.email}
              </a>
              . El código está en un repositorio privado.
            </p>
          </Question>
          <Question title="¿Con qué tecnología está hecho?">
            <Facts
              items={[
                ['Lenguaje', 'TypeScript, de punta a punta.'],
                [
                  'Framework',
                  'TanStack Start con React 19: las páginas se arman en el servidor y llegan listas para leer, también en conexiones lentas.',
                ],
                [
                  'Diseño',
                  'Tailwind CSS 4 y componentes de shadcn/ui, con la paleta de la fundación.',
                ],
                ['Validación', 'Zod revisa cada dato que entra: formularios, panel y API.'],
                [
                  'Ingreso al panel',
                  'Better Auth, con email y contraseña. Las cuentas las crea la comisión: no hay registro abierto.',
                ],
              ]}
            />
          </Question>
          <Question title="¿Dónde funciona?">
            <Facts
              items={[
                [
                  'Servidor',
                  'Cloudflare Workers: el sitio corre en la red de Cloudflare, cerca de quien lo visita.',
                ],
                ['Base de datos', 'Cloudflare D1, una base SQLite.'],
                [
                  'Fotos',
                  'Cloudflare R2. Se achican en tu teléfono antes de subirse, con una versión chica para las listas, así cargan rápido y gastan pocos datos.',
                ],
                [
                  'Costo',
                  'Todo entra en los planes gratuitos de Cloudflare, así que la fundación no paga servidores.',
                ],
                [
                  'Copias de seguridad',
                  'La base guarda 30 días de historial y se puede volver a cualquier momento de ese período. También se puede exportar una copia completa fuera de Cloudflare.',
                ],
              ]}
            />
          </Question>
          <Question title="¿Cómo se cuidan los datos?">
            <Facts
              items={[
                [
                  'Quién ve qué',
                  'Los datos de adoptantes, tránsitos y donaciones los ve solo la comisión. Quien carga animales y noticias no los ve.',
                ],
                ['Contraseñas', 'Se guardan cifradas con un hash, nunca en texto legible.'],
                [
                  'Abusos',
                  'Los formularios y el ingreso al panel limitan los intentos por conexión, sin captchas.',
                ],
                [
                  'Historial de cambios',
                  'Cada cambio en animales, solicitudes, donaciones y rifas queda registrado: quién lo hizo y cuándo.',
                ],
                [
                  'Lo que nunca se publica',
                  'Direcciones exactas, ni de personas ni del refugio. A pedido, borramos los datos de una persona y conservamos solo lo anónimo.',
                ],
                [
                  'Publicidad y rastreo',
                  'No hay publicidad ni rastreadores de terceros. Las fotos que nadie usa se borran solas cada noche.',
                ],
              ]}
            />
          </Question>
          <Question title="¿Se conecta con otros sistemas?">
            <p>
              Sí: el municipio puede cargar eventos en la agenda, como las jornadas de castración, a
              través de una API con credenciales propias. Cada credencial sirve solo para eso, vence
              y se puede revocar.
            </p>
          </Question>
        </div>
      </section>
    </div>
  )
}

// Open by default: the page is short, and closed answers would hide content from search too.
function Question({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group px-5 py-4">
      <summary className="cursor-pointer list-none font-heading text-xl font-bold marker:hidden">
        {title}
      </summary>
      <div className="mt-2 text-lg text-ink-2">{children}</div>
    </details>
  )
}

function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-3">
      {items.map(([term, description]) => (
        <div key={term}>
          <dt className="font-semibold text-ink">{term}</dt>
          <dd>{description}</dd>
        </div>
      ))}
    </dl>
  )
}

function PageLink({
  to,
  children,
}: {
  to: '/como-adoptar' | '/transito' | '/dona' | '/perdidos' | '/privacidad'
  children: string
}) {
  return (
    <Link to={to} className="font-semibold text-primary underline underline-offset-4">
      {children}
    </Link>
  )
}
