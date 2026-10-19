// es-AR money and dates in Argentina's time zone (spec section 9), the same on server and client.

const TIME_ZONE = 'America/Argentina/Buenos_Aires'

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const longDate = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  timeZone: TIME_ZONE,
})

const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: TIME_ZONE })
const dayNumber = new Intl.DateTimeFormat('es-AR', { day: 'numeric', timeZone: TIME_ZONE })
const shortMonth = new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: TIME_ZONE })

const time = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TIME_ZONE,
})

// "$ 3.100.000"
export function formatMoney(pesos: number) {
  return money.format(pesos)
}

// "17 de octubre". Calendar dates ('YYYY-MM-DD') are read at noon so no time zone moves the day.
export function formatDate(iso: string) {
  return longDate.format(toDate(iso))
}

const dateWithYear = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: TIME_ZONE,
})

// "17 de octubre de 2027", for dates that can fall in another year (an expiry).
export function formatDateWithYear(iso: string) {
  return dateWithYear.format(toDate(iso))
}

// Parts for a calendar tile: { weekday: 'sábado', day: '24', month: 'oct' }
export function dateParts(iso: string) {
  const date = toDate(iso)

  return {
    weekday: weekday.format(date),
    day: dayNumber.format(date),
    month: shortMonth.format(date).replace('.', ''),
  }
}

// "9:00 a 13:00", or "9:00" without an end
export function formatTimeRange(startIso: string, endIso: string | null) {
  const start = time.format(toDate(startIso))

  return endIso ? `${start} a ${time.format(toDate(endIso))}` : start
}

const DAY = 24 * 60 * 60 * 1000

// "hoy", "ayer", "hace 3 días": how long something has been waiting.
export function formatAge(iso: string, now = Date.now()) {
  const days = Math.floor((now - toDate(iso).getTime()) / DAY)

  if (days <= 0) {
    return 'hoy'
  }

  return days === 1 ? 'ayer' : `hace ${days} días`
}

// "2026-10-17": the calendar date in Argentina (UTC-3, no daylight saving).
export function todayCalendar(now = Date.now()) {
  return new Date(now - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function toDate(iso: string) {
  return new Date(iso.length === 10 ? `${iso}T12:00:00-03:00` : iso)
}
