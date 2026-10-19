import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import type { ApplicationType } from '@/lib/applications'

// What the visitor has typed so far, saved on the device so a lost signal or a closed tab does not
// lose it (spec 6.2). Values are raw strings until each step is validated.

const text = z.string().max(2000).optional()

const draftSchema = z.object({
  prescreen: z
    .object({
      isAdult: text,
      city: text,
      cityOther: text,
      housingType: text,
      housingTenure: text,
      petsAllowed: text,
      fenced: text,
      otherPets: text,
      neuterCommitment: text,
      acceptsFollowUp: text,
    })
    .catch({}),
  contact: z
    .object({
      firstName: text,
      lastName: text,
      whatsapp: text,
      email: text,
      household: text,
      hoursAlone: text,
      vacationCare: text,
    })
    .catch({}),
  motivation: z
    .object({ motivation: text, experience: text, consent: z.boolean().optional() })
    .catch({}),
})

// The draft holds a name, a phone and who lives at home, and a shared computer keeps it: it expires
// a week after the last change.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const storedSchema = z.object({ savedAt: z.number(), draft: draftSchema })

export type Draft = z.infer<typeof draftSchema>

export type PrescreenDraft = Draft['prescreen']

export type ContactDraft = Draft['contact']

export type MotivationDraft = Draft['motivation']

const EMPTY: Draft = { prescreen: {}, contact: {}, motivation: {} }

function storageKey(type: ApplicationType) {
  return `funpabia.solicitud.${type}`
}

// localStorage as an external store: the server and the first client render see an empty draft,
// then React re-renders with what was saved. Storage can throw (private mode, blocked site data):
// the draft then lives in memory only and the form still works.

const drafts = new Map<ApplicationType, Draft>()
const listeners = new Set<() => void>()

function load(type: ApplicationType): Draft {
  try {
    const saved = localStorage.getItem(storageKey(type))
    const parsed = saved ? storedSchema.safeParse(JSON.parse(saved)) : null

    if (parsed?.success && Date.now() - parsed.data.savedAt <= MAX_AGE_MS) {
      return parsed.data.draft
    }

    // Expired, or from before drafts carried a date: gone, not just ignored.
    localStorage.removeItem(storageKey(type))

    return EMPTY
  } catch {
    return EMPTY
  }
}

function read(type: ApplicationType): Draft {
  const known = drafts.get(type)

  if (known) {
    return known
  }

  const loaded = load(type)
  drafts.set(type, loaded)

  return loaded
}

function write(type: ApplicationType, next: Draft | null) {
  drafts.set(type, next ?? EMPTY)

  try {
    if (next) {
      localStorage.setItem(storageKey(type), JSON.stringify({ savedAt: Date.now(), draft: next }))
    } else {
      localStorage.removeItem(storageKey(type))
    }
  } catch {
    // Storage unavailable: the draft stays in memory.
  }

  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function useDraft(type: ApplicationType) {
  const draft = useSyncExternalStore(
    subscribe,
    () => read(type),
    () => EMPTY,
  )

  return {
    draft,
    hasDraft: draft !== EMPTY,
    update: (next: Draft) => write(type, next),
    clear: () => write(type, null),
  }
}
