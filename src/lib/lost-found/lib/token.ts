// The secret in a report's edit link: the owner can close the report with it, no account needed
// (spec 6.6). Only its SHA-256 is stored.

export function newEditToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))

  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashEditToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))

  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
