import { ArchiveRestore, Trash2 } from 'lucide-react'
import { AnimalPhoto } from '@/components/shared/animal-photo'
import { ConfirmButton } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { deleteAnimal, unarchiveAnimal, type AnimalListItem } from '@/lib/animals'
import { useAction } from './use-action'

// An archived animal: out of the panel and the site, with its history kept. It can come back, or,
// with no history at all, be deleted for good. It has no detail page until it comes back.
export function ArchivedAnimalRow({ animal }: { animal: AnimalListItem }) {
  const action = useAction()

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3">
      <AnimalPhoto
        photo={animal.photo}
        species={animal.species}
        sizes="56px"
        className="size-14 shrink-0 rounded-md [&_span]:hidden [&_svg]:size-6"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-lg font-bold">{animal.name}</p>
        <p className="text-sm text-ink-2">
          {animal.deletable ? 'Archivado, sin historial' : 'Archivado, con historial guardado'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 px-4 font-semibold"
          disabled={action.pending}
          onClick={() => action.run(() => unarchiveAnimal({ data: { id: animal.id } }))}
        >
          <ArchiveRestore aria-hidden="true" />
          Desarchivar
        </Button>
        {animal.deletable ? (
          <ConfirmButton
            variant="outline"
            className="h-11 px-4 font-semibold text-lost"
            disabled={action.pending}
            title={`¿Borrar a ${animal.name} para siempre?`}
            description="Se borra con sus fotos. No se puede deshacer."
            confirmLabel="Borrar para siempre"
            destructive
            onConfirm={() => void action.run(() => deleteAnimal({ data: { id: animal.id } }))}
          >
            <Trash2 aria-hidden="true" />
            Borrar
          </ConfirmButton>
        ) : null}
      </div>
      {action.error ? (
        <p role="alert" className="w-full text-sm font-semibold text-lost">
          {action.error}
        </p>
      ) : null}
    </div>
  )
}
