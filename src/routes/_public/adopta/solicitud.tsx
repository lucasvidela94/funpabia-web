import { Link, createFileRoute, isNotFound } from '@tanstack/react-router'
import { z } from 'zod'
import { AnimalPhoto } from '@/components/shared/animal-photo'
import { ApplicationForm } from '@/components/site/application-form'
import { PageIntro } from '@/components/site/page-intro'
import { getAnimalProfile } from '@/lib/catalog'

// Spec 6.2: "Quiero adoptarlo/a" opens this form with the animal preloaded (?animal=<slug>).
export const Route = createFileRoute('/_public/adopta/solicitud')({
  validateSearch: z.object({ animal: z.string().max(120).optional().catch(undefined) }),
  loaderDeps: ({ search }) => ({ animal: search.animal }),
  // A slug that matches no profile (adopted and unpublished, or mistyped) is not an error: the
  // form still works, it just is not for a particular animal.
  loader: async ({ deps }) => {
    if (!deps.animal) {
      return { animal: null, missing: false }
    }

    try {
      return { animal: await getAnimalProfile({ data: { slug: deps.animal } }), missing: false }
    } catch (error) {
      if (isNotFound(error)) {
        return { animal: null, missing: true }
      }

      throw error
    }
  },
  head: () => ({
    meta: [{ title: 'Solicitud de adopción | Funpabia' }, { name: 'robots', content: 'noindex' }],
  }),
  component: AdoptionRequest,
})

function AdoptionRequest() {
  const { animal, missing } = Route.useLoaderData()

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:pt-14">
      <PageIntro title={animal ? `Quiero adoptar a ${animal.name}` : 'Solicitud de adopción'}>
        <p>
          Tres pasos cortos, unos cinco minutos. Lo que escribís se guarda en tu teléfono, así que
          podés seguir después.
        </p>
      </PageIntro>

      {missing ? (
        <p role="status" className="mt-8 rounded-lg bg-muted p-4 text-ink-2">
          Esa ficha ya no está disponible. Igual podés dejar tu solicitud.
        </p>
      ) : null}

      {animal ? (
        <div className="mt-8 flex items-center gap-4 rounded-lg bg-muted p-3 pr-5">
          <AnimalPhoto
            photo={animal.photo}
            species={animal.species}
            sizes="64px"
            className="size-16 shrink-0 rounded-md"
          />
          <p className="text-ink-2">
            Tu solicitud va para <strong className="text-ink">{animal.name}</strong>.{' '}
            <Link
              to="/adopta/solicitud"
              className="font-semibold text-primary underline underline-offset-4"
            >
              Prefiero no elegir uno
            </Link>
          </p>
        </div>
      ) : null}

      <div className="mt-8">
        <ApplicationForm
          type="adoption"
          animal={animal ? { slug: animal.slug, name: animal.name } : undefined}
        />
      </div>
    </div>
  )
}
