export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogValue = string | number | boolean | null | undefined

export type LogFields = { [key: string]: LogValue }

const LEVEL_ORDER: LogLevel[] = ['debug', 'info', 'warn', 'error']

// Personal data and secrets: the value is replaced, the key stays so the event keeps its shape.
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'email',
  'phone',
  'telefono',
  'whatsapp',
  'dni',
  'address',
  'direccion',
  'lat',
  'lng',
  'latitud',
  'longitud',
]

function isSensitive(key: string) {
  const lower = key.toLowerCase()

  return SENSITIVE_KEYS.some((name) => lower.includes(name))
}

function redact(fields: LogFields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, isSensitive(key) ? '[redacted]' : value]),
  )
}

export function isEnabled(level: LogLevel, minimum: LogLevel) {
  return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(minimum)
}

export function write(level: LogLevel, event: string, fields: LogFields) {
  const line = JSON.stringify({ level, event, time: new Date().toISOString(), ...redact(fields) })

  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
  }
}
