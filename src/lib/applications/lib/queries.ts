import { env } from 'cloudflare:workers'
import { z } from 'zod'
import type { PrescreenResult } from './prescreen'
import type { Submission } from './schema'

// Creates the person and the application in one batch, so a failure never leaves half a request.
export async function insertApplication(
  submission: Submission,
  prescreen: PrescreenResult,
  policyVersion: string,
): Promise<void> {
  const now = new Date().toISOString()
  const personId = crypto.randomUUID()
  const applicationId = crypto.randomUUID()
  const animalId = submission.animalSlug ? await findAvailableAnimal(submission.animalSlug) : null
  const { contact, prescreen: prescreenAnswers, motivation } = submission

  const answers = {
    prescreen: prescreenAnswers,
    household: contact.household,
    hoursAlone: contact.hoursAlone,
    vacationCare: contact.vacationCare,
    motivation: motivation.motivation,
    experience: motivation.experience,
  }

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO person (id, first_name, last_name, whatsapp_phone, email, city, data_consent_at,
         data_consent_version, preferred_channel, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'whatsapp', ?, ?, ?)`,
    ).bind(
      personId,
      contact.firstName,
      contact.lastName,
      contact.whatsapp,
      contact.email || null,
      prescreenAnswers.city,
      now,
      policyVersion,
      JSON.stringify([submission.type === 'adoption' ? 'adopter' : 'foster']),
      now,
      now,
    ),
    env.DB.prepare(
      `INSERT INTO application (id, person_id, animal_id, type, answers, prescreen_result, stage,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
    ).bind(
      applicationId,
      personId,
      animalId,
      submission.type,
      JSON.stringify(answers),
      prescreen.result,
      now,
      now,
    ),
    env.DB.prepare(
      "INSERT INTO application_stage_history (id, application_id, stage, created_at) VALUES (?, ?, 'new', ?)",
    ).bind(crypto.randomUUID(), applicationId, now),
  ])
}

async function findAvailableAnimal(slug: string) {
  const row = await env.DB.prepare(
    "SELECT id FROM animal WHERE slug = ? AND published = 1 AND status IN ('available', 'reserved')",
  )
    .bind(slug)
    .first()

  return row ? z.object({ id: z.string() }).parse(row).id : null
}
