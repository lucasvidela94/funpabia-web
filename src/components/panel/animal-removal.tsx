import { useNavigate, useRouter } from '@tanstack/react-router'
import { Archive, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmButton } from '@/components/shared/confirm-dialog'
import { archiveAnimal, deleteAnimal, type AnimalDetail } from '@/lib/animals'

// Taking the animal out of the panel. Archiving hides it and keeps its history; deleting for good
// is offered only while nothing (requests, adoptions, foster placements) refers to it.
export function AnimalRemoval({ detail }: { detail: AnimalDetail }) {
  const { animal, deletable } = detail
  const navigate = useNavigate()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove(work: () => Promise<void>) {
    setPending(true)
    setError(null)

    try {
      await work()
      // Invalidate after leaving: this page's animal is gone, so reloading it here would show a 404,
      // but the list may still hold it from before.
      await navigate({ to: '/panel/animales' })
      await router.invalidate({ sync: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo completar.')
      setPending(false)
    }
  }

  return (
    <section aria-labelledby="quitar" className="rounded-lg border bg-card p-5">
      <h2 id="quitar" className="font-heading text-xl font-bold">
        Sacar de la lista
      </h2>
      <p className="mt-1 text-sm text-ink-2">
        Archivar lo oculta del panel y del sitio, y guarda su historial.
        {deletable
          ? ' Como no tiene solicitudes, adopciones ni tránsitos, también se puede borrar para siempre.'
          : ' Tiene solicitudes, adopciones o tránsitos, así que solo se puede archivar.'}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <ConfirmButton
          variant="outline"
          className="h-11 px-4 font-semibold"
          disabled={pending}
          title={`¿Archivar a ${animal.name}?`}
          description="Deja de verse en el panel y en el sitio. Su historial queda guardado."
          confirmLabel="Archivar"
          onConfirm={() => void remove(() => archiveAnimal({ data: { id: animal.id } }))}
        >
          <Archive aria-hidden="true" />
          Archivar
        </ConfirmButton>
        {deletable ? (
          <ConfirmButton
            variant="outline"
            className="h-11 px-4 font-semibold text-lost"
            disabled={pending}
            title={`¿Borrar a ${animal.name} para siempre?`}
            description="Se borra con sus fotos. No se puede deshacer."
            confirmLabel="Borrar para siempre"
            destructive
            onConfirm={() => void remove(() => deleteAnimal({ data: { id: animal.id } }))}
          >
            <Trash2 aria-hidden="true" />
            Borrar para siempre
          </ConfirmButton>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-lost">
          {error}
        </p>
      ) : null}
    </section>
  )
}
