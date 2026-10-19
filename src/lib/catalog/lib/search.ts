import { z } from 'zod'
import type { AgeCategory, Sex, Size, Species } from './schema'

// The catalog filters as they appear in the URL (spec 6.1: filters combine and can be shared).
// Keys and values are Spanish because visitors read and share the link. An invalid value is
// dropped instead of failing the page.

const SPECIES = { perro: 'dog', gato: 'cat', otro: 'other' } as const satisfies Record<
  string,
  Species
>

const SEX = { macho: 'male', hembra: 'female' } as const satisfies Record<string, Sex>

const AGE = {
  cachorro: 'baby',
  joven: 'young',
  adulto: 'adult',
  senior: 'senior',
} as const satisfies Record<string, AgeCategory>

const SIZE = { chico: 'small', mediano: 'medium', grande: 'large' } as const satisfies Record<
  string,
  Size
>

const LIVES_WITH = ['perros', 'gatos', 'chicos'] as const

export const catalogSearchSchema = z.object({
  especie: z.enum(['perro', 'gato', 'otro']).optional().catch(undefined),
  sexo: z.enum(['macho', 'hembra']).optional().catch(undefined),
  edad: z.enum(['cachorro', 'joven', 'adulto', 'senior']).optional().catch(undefined),
  tamano: z.enum(['chico', 'mediano', 'grande']).optional().catch(undefined),
  convive: z.array(z.enum(LIVES_WITH)).optional().catch(undefined),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export type CatalogFilters = {
  species?: Species
  sex?: Sex
  ageCategory?: AgeCategory
  size?: Size
  goodWithDogs: boolean
  goodWithCats: boolean
  goodWithKids: boolean
}

export function toFilters(search: CatalogSearch): CatalogFilters {
  const livesWith = new Set(search.convive ?? [])

  return {
    species: search.especie && SPECIES[search.especie],
    sex: search.sexo && SEX[search.sexo],
    ageCategory: search.edad && AGE[search.edad],
    size: search.tamano && SIZE[search.tamano],
    goodWithDogs: livesWith.has('perros'),
    goodWithCats: livesWith.has('gatos'),
    goodWithKids: livesWith.has('chicos'),
  }
}
