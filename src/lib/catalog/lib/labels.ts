import type { AgeCategory, AnimalStatus, Sex, Size, Species } from './schema'

// Spanish copy for the enum values (docs/glossary.md). User-facing only.

export const SPECIES_LABEL: Record<Species, string> = { dog: 'Perro', cat: 'Gato', other: 'Otro' }

export const SEX_LABEL: Record<Sex, string> = {
  male: 'Macho',
  female: 'Hembra',
  unknown: 'Sexo sin confirmar',
}

export const AGE_LABEL: Record<AgeCategory, string> = {
  baby: 'Cachorro',
  young: 'Joven',
  adult: 'Adulto',
  senior: 'Senior',
}

export const SIZE_LABEL: Record<Size, string> = {
  small: 'Chico',
  medium: 'Mediano',
  large: 'Grande',
}

export const STATUS_LABEL: Record<AnimalStatus, string> = {
  intake: 'Ingresado',
  under_treatment: 'En tratamiento',
  available: 'En adopción',
  reserved: 'Reservado',
  adopted: 'Adoptado',
  fostered: 'En tránsito',
  deceased: 'Fallecido',
  returned: 'Devuelto',
  not_adoptable: 'No adoptable',
}

// "Adoptarlo", "adoptarla" or "adoptarlo/a", for the main call to action.
export function adoptVerb(sex: Sex) {
  if (sex === 'female') {
    return 'adoptarla'
  }

  return sex === 'male' ? 'adoptarlo' : 'adoptarlo/a'
}

// Adjectives in the animal's grammatical gender: "Castrado" or "Castrada".
export function gendered(masculine: string, sex: Sex) {
  return sex === 'female' ? `${masculine.slice(0, -1)}a` : masculine
}
