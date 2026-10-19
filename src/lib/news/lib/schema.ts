import { z } from 'zod'

// News post input (spec 6.7), shared by the panel form. The site renders the body as paragraphs,
// so the form is a plain textarea: one blank line starts a new paragraph.

export const NEWS_TAGS = ['adoption', 'awareness', 'rescue', 'statement', 'campaign'] as const

export const NEWS_TAG_LABEL: Record<(typeof NEWS_TAGS)[number], string> = {
  adoption: 'Adopción',
  awareness: 'Concientización',
  rescue: 'Rescate',
  statement: 'Comunicado',
  campaign: 'Campaña',
}

export const newsInputSchema = z.object({
  title: z.string().trim().min(4, 'Escribí un título que diga qué pasó.').max(120),
  body: z.string().trim().min(20, 'Contá la noticia en al menos un párrafo.').max(20000),
  tags: z.array(z.enum(NEWS_TAGS)).min(1, 'Elegí al menos una etiqueta.').max(NEWS_TAGS.length),
  // The R2 key from the upload, or '' for no cover.
  imageKey: z.union([z.literal(''), z.string().trim().min(1).max(200)]),
  animalIds: z.array(z.string().min(1).max(64)).max(10),
  published: z.boolean(),
})

// What the form hands to the module, already validated.
export type NewsInput = z.output<typeof newsInputSchema>
