// URL-safe words from a Spanish title: "Deuda veterinaria de octubre" -> "deuda-veterinaria-de-octubre",
// "Ñandú" -> "nandu". Callers add what makes theirs unique.
export function slugify(text: string, maxLength = 60) {
  return text
    .normalize('NFD')
    .replaceAll(/\p{M}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
    .slice(0, maxLength)
    .replace(/-$/, '')
}
