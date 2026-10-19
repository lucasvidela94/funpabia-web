import type { ReportKind, ReportSex, ReportSize, ReportSpecies, ReportStatus } from './schema'

// Spanish labels for the enums (docs/glossary.md).

export const KIND_LABEL: Record<ReportKind, string> = { lost: 'Perdido', found: 'Encontrado' }

export const REPORT_SPECIES_LABEL: Record<ReportSpecies, string> = {
  dog: 'Perro',
  cat: 'Gato',
  other: 'Otro animal',
}

export const REPORT_SEX_LABEL: Record<ReportSex, string> = {
  male: 'Macho',
  female: 'Hembra',
  unknown: 'No sé',
}

export const REPORT_SIZE_LABEL: Record<ReportSize, string> = {
  small: 'Chico',
  medium: 'Mediano',
  large: 'Grande',
}

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  pending: 'Por revisar',
  active: 'Publicado',
  reunited: 'Reencontrado',
  hidden: 'Oculto',
}
