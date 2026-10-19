import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { AnimalDetailsForm } from '@/components/panel/animal-details-form'
import { AnimalPhotosEditor } from '@/components/panel/animal-photos-editor'
import { AnimalRemoval } from '@/components/panel/animal-removal'
import { AnimalStatusPanel } from '@/components/panel/animal-status-panel'
import { getAnimalDetail } from '@/lib/animals'

export const Route = createFileRoute('/_private/panel/animales/$animalId')({
  // ?nuevo=true right after the intake, to say what comes next.
  validateSearch: z.object({ nuevo: z.boolean().optional().catch(undefined) }),
  loader: ({ params }) => getAnimalDetail({ data: { id: params.animalId } }),
  component: AnimalPage,
  notFoundComponent: () => (
    <div>
      <h1 className="font-heading text-3xl font-bold">Este animal no existe</h1>
      <Link
        to="/panel/animales"
        className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline"
      >
        Volver a la lista
      </Link>
    </div>
  ),
})

function AnimalPage() {
  const detail = Route.useLoaderData()
  const { nuevo } = Route.useSearch()
  const { animal } = detail

  return (
    <div>
      <Link
        to="/panel/animales"
        className="mb-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Animales
      </Link>
      <h1 className="font-heading text-4xl font-bold tracking-tight">{animal.name}</h1>

      {nuevo ? (
        <p
          role="status"
          className="mt-4 rounded-md border-l-[6px] border-adopted bg-adopted-soft p-4"
        >
          <strong className="text-adopted">{animal.name} ya está cargado.</strong> Cuando puedas,
          completá su historia y publicalo para que aparezca en el sitio.
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <div className="order-2 lg:order-1">
          <AnimalDetailsForm key={animal.id} animal={animal} />
        </div>
        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <AnimalStatusPanel detail={detail} />
          <AnimalPhotosEditor detail={detail} />
          <AnimalRemoval detail={detail} />
        </div>
      </div>
    </div>
  )
}
