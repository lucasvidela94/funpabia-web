import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Check, HelpCircle, MapPin, Minus, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { StatusTag } from '@/components/site/animal-tags'
import { PhotoGallery } from '@/components/site/photo-gallery'
import { ShareActions } from '@/components/site/share-actions'
import { Button } from '@/components/ui/button'
import {
  AGE_LABEL,
  SEX_LABEL,
  SIZE_LABEL,
  SPECIES_LABEL,
  adoptVerb,
  gendered,
  getAnimalProfile,
  type AnimalProfile,
} from '@/lib/catalog'
import { imageMeta, jsonLd, pageMeta } from '@/lib/seo'

export const Route = createFileRoute('/_public/adopta/$slug')({
  loader: ({ params }) => getAnimalProfile({ data: { slug: params.slug } }),
  head: ({ loaderData }) =>
    loaderData
      ? { meta: profileMeta(loaderData), scripts: [profileJsonLd(loaderData)] }
      : { meta: [{ title: 'No encontramos esta ficha | Funpabia' }] },
  component: Profile,
  notFoundComponent: ProfileNotFound,
})

function summary(animal: AnimalProfile) {
  const facts = [
    SPECIES_LABEL[animal.species],
    animal.ageCategory && AGE_LABEL[animal.ageCategory],
    SIZE_LABEL[animal.size],
  ]

  // "Perro, adulto, grande": only the first word keeps its capital.
  const line = facts.filter(Boolean).join(', ').toLowerCase()

  return `${line.charAt(0).toUpperCase()}${line.slice(1)}. Está en Cipolletti y busca familia.`
}

// Spec 6.1: OG and Twitter tags with the main photo, the name and one line.
// Spec 6.1: basic JSON-LD. schema.org has no type for an animal up for adoption, so the profile
// is a WebPage about it, with its main photo.
function profileJsonLd(animal: AnimalProfile) {
  const page = new Map([
    ['@type', 'WebPage'],
    ['name', `${animal.name} busca familia`],
    ['description', `${animal.name}: ${summary(animal)}`],
    ['url', animal.url],
  ])

  if (animal.photo) {
    page.set('image', `${animal.origin}${animal.photo.src}`)
  }

  return jsonLd(Object.fromEntries(page))
}

function profileMeta(animal: AnimalProfile) {
  const title =
    animal.status === 'adopted' ? `${animal.name} encontró familia` : `${animal.name} busca familia`

  const description = `${animal.name}: ${summary(animal)}`

  // Without a photo the site's default image (root route) stays.
  return [
    ...pageMeta(`${title} | Funpabia`, description),
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: animal.url },
    ...(animal.photo ? imageMeta(`${animal.origin}${animal.photo.src}`, animal.photo) : []),
  ]
}

function Profile() {
  const animal = Route.useLoaderData()
  const adopted = animal.status === 'adopted'
  const paragraphs = (animal.story ?? '').split(/\n\s*\n/).filter((text) => text.trim() !== '')

  return (
    <article className="mx-auto max-w-6xl px-4 pt-6 pb-20">
      <Link
        to="/adopta"
        className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Animales en adopción
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <PhotoGallery photos={animal.photos} species={animal.species} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <StatusTag status={animal.status} urgent={animal.urgent} sex={animal.sex} />
          <h1 className="mt-2 font-heading text-6xl font-bold tracking-[-0.035em] text-teal-900 sm:text-7xl">
            {animal.name}
          </h1>
          <p className="mt-2 text-lg text-ink-2">{summary(animal)}</p>

          {adopted ? (
            <p className="mt-6 rounded-md border-l-[6px] border-adopted bg-adopted-soft p-4 text-adopted">
              <strong>¡{gendered('Adoptado', animal.sex)}!</strong> Gracias a todos los que
              compartieron su ficha.
            </p>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {animal.status === 'available' ? (
                <Button asChild className="h-14 text-lg font-bold">
                  <Link to="/adopta/solicitud" search={{ animal: animal.slug }}>
                    Quiero {adoptVerb(animal.sex)}
                  </Link>
                </Button>
              ) : (
                <p className="rounded-md bg-yellow-100 p-4">
                  Ya tiene una familia en proceso. Si no se concreta, vuelve a estar disponible.
                </p>
              )}
              <ShareActions url={animal.url} text={`${animal.name} busca familia en Cipolletti.`} />
            </div>
          )}

          <Facts animal={animal} />
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <section aria-labelledby="historia">
          <h2 id="historia" className="font-heading text-3xl font-bold">
            Su historia
          </h2>
          {paragraphs.length > 0 ? (
            <div className="mt-4 flex max-w-[65ch] flex-col gap-4 text-lg">
              {paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-ink-2">
              Pronto contamos más de {animal.name}. Si querés saber algo, preguntanos.
            </p>
          )}
          {animal.personality.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Personalidad">
              {animal.personality.map((trait) => (
                <li
                  key={trait}
                  className="rounded-pill bg-lilac-100 px-3 py-1 font-semibold text-lilac-700"
                >
                  {trait}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <aside className="flex flex-col gap-4">
          {animal.specialRequirements ? (
            <div className="rounded-md border-l-[6px] border-urgent bg-urgent-soft p-4">
              <h2 className="font-bold text-urgent">Lo que necesita</h2>
              <p className="mt-1">{animal.specialRequirements}</p>
            </div>
          ) : null}
          <div className="rounded-lg bg-muted p-5">
            <h2 className="font-heading text-xl font-bold">Cómo sigue</h2>
            <p className="mt-2 text-ink-2">
              Completás un formulario corto, te escribimos por WhatsApp y coordinamos una charla. Si
              encaja, firmamos un contrato de adopción y hacemos seguimiento.
            </p>
            <Link
              to="/como-adoptar"
              className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
            >
              Ver requisitos y pasos
            </Link>
          </div>
        </aside>
      </div>
    </article>
  )
}

function Facts({ animal }: { animal: AnimalProfile }) {
  return (
    <dl className="mt-8 grid grid-cols-2 gap-x-6 border-t">
      <Fact label="Sexo">{SEX_LABEL[animal.sex]}</Fact>
      <Fact label="Tamaño">{SIZE_LABEL[animal.size]}</Fact>
      {animal.breed ? <Fact label="Raza aproximada">{animal.breed}</Fact> : null}
      {animal.color ? <Fact label="Color">{animal.color}</Fact> : null}
      <Fact label={gendered('Castrado', animal.sex)}>
        <YesNo value={animal.neutered} />
      </Fact>
      <Fact label={gendered('Vacunado', animal.sex)}>
        <YesNo value={animal.vaccinated} />
      </Fact>
      <Fact label={gendered('Desparasitado', animal.sex)}>
        <YesNo value={animal.dewormed} />
      </Fact>
      <Fact label="Con perros">
        <Compatibility value={animal.goodWithDogs} />
      </Fact>
      <Fact label="Con gatos">
        <Compatibility value={animal.goodWithCats} />
      </Fact>
      <Fact label="Con chicos">
        <Compatibility value={animal.goodWithKids} />
      </Fact>
      <Fact label="Dónde está">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-4" aria-hidden="true" />
          Cipolletti
        </span>
      </Fact>
    </dl>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  )
}

function YesNo({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-adopted">
      <Check className="size-4" aria-hidden="true" />
      Sí
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-ink-2">
      <Minus className="size-4" aria-hidden="true" />
      Todavía no
    </span>
  )
}

function Compatibility({ value }: { value: 'yes' | 'no' | 'unknown' }) {
  if (value === 'yes') {
    return <YesNo value />
  }

  return value === 'no' ? (
    <span className="inline-flex items-center gap-1 text-lost">
      <X className="size-4" aria-hidden="true" />
      No
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-ink-2">
      <HelpCircle className="size-4" aria-hidden="true" />
      Sin probar
    </span>
  )
}

function ProfileNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <h1 className="font-heading text-4xl font-bold">No encontramos esta ficha</h1>
      <p className="mt-3 text-lg text-ink-2">
        Puede que el link esté incompleto o que la ficha ya no esté publicada.
      </p>
      <Link
        to="/adopta"
        className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-5 font-bold text-primary-foreground"
      >
        Ver animales en adopción
      </Link>
    </div>
  )
}
