// Links for phone numbers as people type them: click-to-chat (spec 11: wa.me without the WhatsApp
// Business API) and tel:.
//
// wa.me wants the international number without symbols. Argentine mobiles are 54 + 9 + area code +
// number, without the leading 0 of the area code nor the 15 people often type after it. The 15 is
// only dropped when the number has the extra two digits it adds; anything unusual is left as typed.

function toWhatsAppNumber(phone: string) {
  let digits = phone.replaceAll(/\D/g, '')

  if (digits.startsWith('549')) {
    return digits
  }

  if (digits.startsWith('54')) {
    return `549${digits.slice(2)}`
  }

  digits = digits.replace(/^0/, '')

  // "299 15 456 4530": area code (2 to 4 digits) followed by 15, twelve digits in total. Area codes
  // of 3 digits go first: they are the Alto Valle's (299).
  if (digits.length === 12) {
    const at = [3, 2, 4].find((area) => digits.slice(area, area + 2) === '15')

    if (at !== undefined) {
      digits = digits.slice(0, at) + digits.slice(at + 2)
    }
  }

  return digits.length === 10 ? `549${digits}` : digits
}

export function whatsAppUrl(phone: string, text: string) {
  return `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(text)}`
}

// "299 456 4530" -> "tel:+542994564530". Dialing from abroad takes +54 without the mobile 9.
export function telUrl(phone: string) {
  const number = toWhatsAppNumber(phone)

  return number.startsWith('549') ? `tel:+54${number.slice(3)}` : `tel:${number}`
}
