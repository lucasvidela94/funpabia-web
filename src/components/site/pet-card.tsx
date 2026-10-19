import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  AGE_LABEL,
  SEX_LABEL,
  SIZE_LABEL,
  SPECIES_LABEL,
  adoptVerb,
  gendered,
  type CatalogAnimal,
} from '@/lib/catalog'
import { AnimalPhoto } from '../shared/animal-photo'
import { SpeciesTag, StatusTag, TraitTag } from './animal-tags'

// Design system 6, "tarjeta de mascota": big photo, status over it, name, one line of facts,
// a few tags and a single primary button. The whole card opens the profile.
export function PetCard({
  animal,
  priority = false,
}: {
  animal: CatalogAnimal
  priority?: boolean
}) {
  const facts = [
    animal.sex !== 'unknown' && SEX_LABEL[animal.sex],
    animal.ageCategory && AGE_LABEL[animal.ageCategory].toLowerCase(),
    SIZE_LABEL[animal.size].toLowerCase(),
  ]

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg bg-card shadow-card">
      <div className="relative">
        <AnimalPhoto
          photo={animal.photo}
          species={animal.species}
          sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 80vw"
          priority={priority}
          className="aspect-square w-full transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <StatusTag status={animal.status} urgent={animal.urgent} sex={animal.sex} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-heading text-2xl font-bold tracking-tight">
            <Link
              to="/adopta/$slug"
              params={{ slug: animal.slug }}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {animal.name}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">{facts.filter(Boolean).join(', ')}</p>
        </div>

        <ul className="flex flex-wrap gap-1.5" aria-label="Datos">
          <li>
            <SpeciesTag species={animal.species}>{SPECIES_LABEL[animal.species]}</SpeciesTag>
          </li>
          {animal.neutered ? (
            <li>
              <TraitTag>{gendered('Castrado', animal.sex)}</TraitTag>
            </li>
          ) : null}
          {animal.goodWithDogs === 'yes' ? (
            <li>
              <TraitTag>Con perros</TraitTag>
            </li>
          ) : null}
          {animal.goodWithCats === 'yes' ? (
            <li>
              <TraitTag>Con gatos</TraitTag>
            </li>
          ) : null}
        </ul>

        {animal.status === 'available' ? (
          <Button
            asChild
            className="relative z-10 mt-auto h-11 self-start px-5 text-base font-bold"
          >
            <Link to="/adopta/solicitud" search={{ animal: animal.slug }}>
              Quiero {adoptVerb(animal.sex)}
            </Link>
          </Button>
        ) : null}
      </div>
    </article>
  )
}
