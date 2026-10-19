import type { ApplicationType, Prescreen } from './schema'

// Pre-screen rules (spec 6.2). In the MVP they live here; in F2 the committee edits them from the
// panel. The minimum age and covered towns are still to be confirmed (spec 17, question 2).

export const COVERED_CITIES = ['Cipolletti', 'Fernández Oro', 'Allen', 'Neuquén']

export type PrescreenResult = {
  result: 'eligible' | 'review' | 'ineligible'
  // Why the answers exclude the request, in the visitor's words. Empty unless ineligible.
  reasons: string[]
}

export function evaluatePrescreen(answers: Prescreen, type: ApplicationType): PrescreenResult {
  const reasons: string[] = []

  if (answers.isAdult === 'no') {
    reasons.push('Para adoptar o ser tránsito hay que ser mayor de 18 años.')
  }

  if (answers.housingTenure === 'rented' && answers.petsAllowed === 'no') {
    reasons.push(
      'Si el contrato de alquiler no permite animales, te podrían pedir que lo devuelvas.',
    )
  }

  if (type === 'adoption' && answers.neuterCommitment === 'no') {
    reasons.push(
      'Pedimos castrar a los cachorros a los 6 meses, para que no nazcan más animales sin casa.',
    )
  }

  if (answers.acceptsFollowUp === 'no') {
    reasons.push(
      'El seguimiento es parte de cada adopción y cada tránsito: así sabemos que todo va bien.',
    )
  }

  if (reasons.length > 0) {
    return { result: 'ineligible', reasons }
  }

  const needsReview =
    answers.fenced === 'no' ||
    answers.otherPets === 'not_neutered' ||
    answers.petsAllowed === 'unknown' ||
    !COVERED_CITIES.some(
      (city) => city.localeCompare(answers.city, 'es', { sensitivity: 'base' }) === 0,
    )

  return { result: needsReview ? 'review' : 'eligible', reasons }
}
